import * as github from '@actions/github'

const createStatusCheck = async (
  token: string
) => {
  const octokit = github.getOctokit(token)
  
  const start = new Date()
  start.setMinutes(start.getMinutes() - 1)

  const response = await octokit.rest.checks.create({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    head_sha: github.context.sha,
    name: 'test check',
    status: 'completed',
    conclusion: 'success',
    started_at: start.toISOString(),
    completed_at: new Date().toISOString(),
    output: {
      title: 'Hello World!',
      summary: 'this is a test'
    }
  })

  console.log(response)
}

// const updateStatusCheck = async () => {

// }

// const closeStatusCheck = async () => {

// }

export { createStatusCheck }
// export { createStatusCheck, updateStatusCheck, closeStatusCheck }
