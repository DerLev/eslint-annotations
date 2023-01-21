import * as core from '@actions/core'
import * as github from '@actions/github'
import * as fs from 'fs/promises'
import path from 'path'
import typescriptAnnotations from './typescriptAnnotations'
import eslintAnnotations from './eslintAnnotations'
import annotateCode from './annotateCode'
import getInputs from './inputs'
import {
  createStatusCheck,
  updateStatusCheck,
  closeStatusCheck
} from './statusCheck'

(async () => {
  let failStatus = 0
  
  const {
    eslintInput,
    eslintPrefix,
    typescriptInput,
    typescriptPrefix,
    githubToken,
    errorOnWarn,
    createStatusCheck: createStatusCheckConfig,
    pwd,
  } = getInputs()

  try {
    if(createStatusCheckConfig && githubToken) {
      await createStatusCheck(githubToken)
    }

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
