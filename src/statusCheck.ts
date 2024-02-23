import * as core from '@actions/core'
import * as github from '@actions/github'
import { PullRequestEvent } from '@octokit/webhooks-definitions/schema'

/**
 * Converts a severity code to a string readable by GitHub
 * @param severity Severity number
 * @returns Severity string for GitHub
 */
const annotationLevelConversion = (severity: number) => {
  switch (severity) {
    case 2:
      return 'failure'
    case 1:
      return 'warning'
    default:
      return 'notice'
  }
}

/**
 * Create a status check for code annotations
 * @param token GitHub token
 * @param checkName Name of the status check
 * @returns ID of the status check
 */
const createStatusCheck = async (
  token: string,
  checkName: string
) => {
  const prPayload = github.context.payload as PullRequestEvent
  const headSha = github.context.eventName == 'pull_request' ?
    prPayload.pull_request.head.sha :
    github.context.sha

  const octokit = github.getOctokit(token)
  
  const response = await octokit.rest.checks.create({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    head_sha: headSha,
    name: checkName,
    status: 'in_progress',
    started_at: new Date().toISOString(),
    output: {
      title: checkName,
      summary: 'This status check will annotate your code shortly...'
    }
  })

  return response.data.id
}

/**
 * Update a running status check to change name and append code annotations
 * @param token GitHub token
 * @param checkId ID of the running status check
 * @param checkName Name of the status check
 * @param annotations Annotations to append to status check
 * @returns Promise array
 */
const updateStatusCheck = async (
  token: string,
  checkId: number,
  checkName: string,
  annotations: AnnotationsOutput
) => {
  const octokit = github.getOctokit(token)

  const formattedAnnotations = annotations.annotations.map((ann) => {
    return {
      path: ann.file,
      start_line: ann.line,
      end_line: ann.endLine ? ann.endLine : ann.line,
      annotation_level: annotationLevelConversion(ann.severity) as ReturnType<typeof annotationLevelConversion>,
      message: ann.message,
      title: ann.title
    }
  })

  // Split annotations up due to API limitations
  // Code inspired from
  // https://github.com/ataylorme/eslint-annotate-action/blob/8fa19018d8f7103abb06256debb48c9f638d5b89/src/addAnnotationsToStatusCheck.ts
  const batchSize = 50
  const batches = Math.ceil(formattedAnnotations.length / batchSize)
  const promises = []

  for(let batch = 1; batch <= batches; batch++) {
    const batchAnnotations = formattedAnnotations.splice(0, batchSize)
    try {
      const promise = octokit.rest.checks.update({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        check_run_id: checkId,
        status: 'in_progress',
        output: {
          title: checkName,
          summary: `Processing batch ${batch} of ${batches} of ${annotations.type} annotations (${formattedAnnotations.length} total)`,
          annotations: batchAnnotations
        }
      })
      promises.push(promise)
    } catch(err) {
      core.error(`Error adding annotations (ID: ${checkId})`, {
        title: `Error in batch ${batch} of ${annotations.type} annotations`
      })
      process.exit(2)
    }
  }

  return Promise.all(promises)
}

interface CloseStatusCheckInput {
  checkId: number
  checkName: string
  shouldFail: boolean
  stats: StatusCheckStats
  createSummary: boolean
}

/**
 * Close a running status check and add a summary
 * @param token GitHub token
 * @param checkId ID of the running status check
 * @param checkName Name to set the status check to
 * @param shouldFail Whether the status check should fail
 * @param stats Stats object to report number of errors and warns
 * @returns status check ID
 */
const closeStatusCheck = async (
  token: string,
  input: CloseStatusCheckInput
) => {
  let isEmpty = false
  let summary = ''

  if(input.stats.typescript.enabled) {
    summary += `${input.stats.typescript.errors} TypeScript Error${input.stats.typescript.errors != 1 ? 's' : ''}`
  }

  if(input.stats.eslint.enabled) {
    summary += input.stats.typescript.enabled ? ', ' : ''
    summary += `${input.stats.eslint.errors} ESLint Error${input.stats.eslint.errors != 1 ? 's' : ''}`
    summary += ' and '
    summary += `${input.stats.eslint.warnings} ESLint Warning${input.stats.eslint.warnings != 1 ? 's' : ''}`
  }

  if(summary) {
    summary += ` ${!input.stats.eslint.enabled && input.stats.typescript.errors == 1 ? 'was' : 'were'} found`
  } else {
    summary += 'Nothing is configured'
    isEmpty = true
  }

  const octokit = github.getOctokit(token)

  const response = await octokit.rest.checks.update({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    check_run_id: input.checkId,
    status: 'completed',
    conclusion: input.shouldFail ? 'failure' : isEmpty ? 'skipped' : 'success',
    completed_at: new Date().toISOString(),
    output: {
      title: input.checkName,
      summary: summary,
    }
  })

  // Do not create a summary
  if(!input.createSummary) return response.data.id

  if(input.shouldFail) {
    core.error('View for details: ' + response.data.html_url, {
      title: 'Action failed! See link for annotations'
    })
  } else {
    core.notice('View for details: ' + response.data.html_url, {
      title: 'Action succeeded! See link for annotations'
    })
  }

  return response.data.id
}

export { createStatusCheck, updateStatusCheck, closeStatusCheck }
