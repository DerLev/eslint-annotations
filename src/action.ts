import * as core from '@actions/core'
import * as fs from 'fs/promises'
import path from 'path'
import typescriptAnnotations from './typescriptAnnotations'
import eslintAnnotations from './eslintAnnotations'
import annotateCode from './annotateCode'

(async () => {
  let failStatus = 0
  
  const eslintInput = process.env.NODE_ENV === 'development' ?
    'eslint_report.json' :
    core.getInput('eslint-report')
  const typescriptInput = process.env.NODE_ENV === 'development' ?
    'typescript.log' :
    core.getInput('typescript-log')
  const errorOnWarn = core.getInput('error-on-warn') === 'true' ? 1 : 2

  const eslintPrefix = core.getInput('eslint-annotation-prefix')
  const typescriptPrefix = core.getInput('typescript-annotation-prefix')

  const GITHUB_WORKSPACE = !process.env.GITHUB_WORKSPACE ?
    '/home/runner/work/eslint-annotations/eslint-annotations' :
    process.env.GITHUB_WORKSPACE
  const pwd = GITHUB_WORKSPACE.substring(GITHUB_WORKSPACE.length -1, GITHUB_WORKSPACE.length) === '/' ?
    GITHUB_WORKSPACE :
    GITHUB_WORKSPACE + '/'

  try {
    if(eslintInput) {
      const eslintFile: EslinJsonOutput[] = await JSON.parse(await (await fs.readFile(path.join('./', eslintInput))).toString())
      const eslintOutput = await eslintAnnotations(eslintFile, pwd, { prefix: eslintPrefix })
      failStatus = eslintOutput.highestSeverity
      annotateCode(eslintOutput, 'ESLint Annotations')
    }
    if(typescriptInput) {
      const typescriptFile = await (await fs.readFile(path.join('./', typescriptInput))).toString()
      const typescriptOutput = typescriptAnnotations(typescriptFile, { prefix: typescriptPrefix })
      failStatus = typescriptOutput.highestSeverity
      annotateCode(typescriptOutput, 'Typescript Annotations')
    }

    if(!eslintInput && !typescriptInput) {
      core.notice(
        'Using this action with its current config does not do anything. Please configure one filepath',
        {
          title: 'No files specified'
        }
      )
    }

    if(failStatus >= errorOnWarn) {
      process.exit(1)
    }
  } catch (err) {
    core.error(String(err), { title: 'Error reading file' })
    process.exit(1)
  }
})()
