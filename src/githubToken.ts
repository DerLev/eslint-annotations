import * as github from '@actions/github'

/**
 * Check a token for its ability to access all needed permission claims
 * @param token The GITHUB_TOKEN provided by GitHub Actions
 */
export const checkToken = async (token: string) => {
  const octokit = github.getOctokit(token)

  const response = await octokit.request({ url: '/', method: 'GET' })
  console.log(response.headers)
}
