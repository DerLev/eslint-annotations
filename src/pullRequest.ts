import * as github from '@actions/github'

/**
 * Get all changed files from the current pull request
 * @param token The GITHUB_TOKEN provided by GitHub Actions
 */
export const getChangedFiles = async (token: string) => {
  const { owner, repo } = github.context.repo
  const pullNumber = github.context.payload.pull_request?.number

  const octokit = github.getOctokit(token)

  const prFiles = await octokit.paginate({
    method: 'GET',
    url: `/repos/${owner}/${repo}/pulls/${pullNumber}/files`
  })

  return prFiles.map((file: any) => file.filename) as string[]
}
