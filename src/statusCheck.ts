import * as core from '@actions/core'
import * as github from '@actions/github'

const createStatusCheck = async (
  token: string
) => {
  const octokit = github.getOctokit(token)
  
  octokit.rest.checks.create({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    head_sha: github.context.sha,
    name: 'test check',
    status: 'completed',
    conclusion: 'success',
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString()
  })
}

const updateStatusCheck = async () => {

}

const closeStatusCheck = async () => {

}

export { createStatusCheck, updateStatusCheck, closeStatusCheck }
