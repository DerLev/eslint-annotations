import * as core from '@actions/core'
import * as github from '@actions/github'

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

const createStatusCheck = async (
  token: string,
  checkName: string
) => {
  const octokit = github.getOctokit(token)
  
  const response = await octokit.rest.checks.create({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    head_sha: github.context.sha,
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
      annotation_level: annotationLevelConversion(ann.severity),
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

const closeStatusCheck = async (
  token: string,
  checkId: number,
  checkName: string,
  shouldFail: boolean
) => {
  const octokit = github.getOctokit(token)

  const response = await octokit.rest.checks.update({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    check_run_id: checkId,
    status: 'completed',
    conclusion: shouldFail ? 'failure' : 'success',
    completed_at: new Date().toISOString(),
    output: {
      title: checkName,
      summary: 'Done!',
    }
  })

  return response.data.id
}

export { createStatusCheck, updateStatusCheck, closeStatusCheck }
