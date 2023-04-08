import * as core from '@actions/core'
import * as github from '@actions/github'

/**
 * Get all action inputs
 * @returns JSON Object with all action inputs
 */
const getInputs = () => {
  const eslintInput = process.env.NODE_ENV === 'development' ?
    'eslint_report.json' :
    core.getInput('eslint-report')
  const eslintInputArray = eslintInput.split(' ')
  
  const typescriptInput = process.env.NODE_ENV === 'development' ?
  'typescript.log' :
  core.getInput('typescript-log')
  const typescriptInputArray = typescriptInput.split(' ')
    
  const eslintPrefix = core.getInput('eslint-annotation-prefix')
  const typescriptPrefix = core.getInput('typescript-annotation-prefix')
    
  const githubToken = core.getInput('github-token')
    
  const errorOnWarn = core.getInput('error-on-warn') === 'true' ? 1 : 2
  const createStatusCheck = core.getInput('create-status-check') === 'true'
  const statusCheckName = core.getInput('status-check-name')
  const failedAttempts = core.getInput('failed-attempts')
  const failInPr = core.getInput('fail-in-pr') === 'true'

  const GITHUB_WORKSPACE = !process.env.GITHUB_WORKSPACE ?
    '/home/runner/work/eslint-annotations/eslint-annotations' :
    process.env.GITHUB_WORKSPACE
  const cwd = GITHUB_WORKSPACE.substring(GITHUB_WORKSPACE.length -1, GITHUB_WORKSPACE.length) === '/' ?
    GITHUB_WORKSPACE :
    GITHUB_WORKSPACE + '/'

  const inPr = github.context.eventName === 'pull_request'

  const onlyChangedInPr = core.getInput('only-changed-in-pr') === 'true'

  const addResultNotice = core.getInput('add-notice-with-url') === 'true'

  return {
    eslintInput,
    eslintPrefix,
    eslintInputArray,
    typescriptInput,
    typescriptPrefix,
    typescriptInputArray,
    githubToken,
    errorOnWarn,
    createStatusCheck,
    statusCheckName,
    failedAttempts,
    failInPr,
    cwd,
    inPr,
    onlyChangedInPr,
    addResultNotice
  }
}

export default getInputs
