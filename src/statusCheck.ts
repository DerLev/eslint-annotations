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
    }
  })

  return response.data.id
}

const updateStatusCheck = async (
  token: string,
  checkId: number,
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

  const response = await octokit.rest.checks.update({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    check_run_id: checkId,
    status: 'in_progress',
    completed_at: new Date().toISOString(),
    output: {
      summary: 'annotating',
      annotations: formattedAnnotations
    }
  })

  return response.data.id
}

const closeStatusCheck = async (
  token: string,
  checkId: number,
  conclusion: "success" | "failure"
) => {
  const octokit = github.getOctokit(token)

  const response = await octokit.rest.checks.update({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    check_run_id: checkId,
    status: 'completed',
    conclusion: conclusion,
    completed_at: new Date().toISOString(),
    output: {
      summary: 'Done!',
    }
  })

  return response.data.id
}

export { createStatusCheck, updateStatusCheck, closeStatusCheck }
