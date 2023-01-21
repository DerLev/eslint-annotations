import * as core from '@actions/core'
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
    statusCheckName,
    pwd,
  } = getInputs()

  try {
    console.log(createStatusCheckConfig, githubToken)
    let checkId = 0
    if(createStatusCheckConfig && githubToken) {
      console.log('calling createStatusCheck')
      checkId = await createStatusCheck(githubToken, statusCheckName)
    }

    if(eslintInput) {
      const eslintFile: EslinJsonOutput[] = await JSON.parse(await (await fs.readFile(path.join('./', eslintInput))).toString())
      const eslintOutput = await eslintAnnotations(eslintFile, pwd, { prefix: eslintPrefix })
      failStatus = eslintOutput.highestSeverity
      annotateCode(eslintOutput, 'ESLint Annotations')
      if(createStatusCheckConfig && githubToken) await updateStatusCheck(githubToken, checkId, eslintOutput)
    }
    if(typescriptInput) {
      const typescriptFile = await (await fs.readFile(path.join('./', typescriptInput))).toString()
      const typescriptOutput = typescriptAnnotations(typescriptFile, { prefix: typescriptPrefix })
      failStatus = typescriptOutput.highestSeverity
      annotateCode(typescriptOutput, 'Typescript Annotations')
      if(createStatusCheckConfig && githubToken) await updateStatusCheck(githubToken, checkId, typescriptOutput)
    }

    if(!eslintInput && !typescriptInput) {
      core.notice(
        'Using this action with its current config does not do anything. Please configure one filepath',
        {
          title: 'No files specified'
        }
      )
    }

    if(createStatusCheckConfig && githubToken) await closeStatusCheck(githubToken, checkId, failStatus >= errorOnWarn ? 'failure' : 'success')

    if(failStatus >= errorOnWarn) {
      process.exit(1)
    }
  } catch (err) {
    core.error(String(err), { title: 'Error reading file' })
    process.exit(1)
  }
})()
