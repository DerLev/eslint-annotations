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
    if(!eslintInput && !typescriptInput) {
      core.notice(
        'Using this action with its current config does not do anything. Please configure one filepath',
        {
          title: 'No files specified'
        }
      )
      process.exit(0)
    }

    let eslintOutput: AnnotationsOutput = { type: 'eslint', highestSeverity: 0, annotations: [] }
    let typescriptOutput: AnnotationsOutput = { type: 'typescript', highestSeverity: 0, annotations: [] }

    let highestSeverity = 0

    let statusCheckStats: StatusCheckStats = {
      eslint: {
        enabled: false,
        warnings: 0,
        errors: 0,
      },
      typescript: {
        enabled: true,
        errors: 0,
      },
    }

    if(eslintInput) {
      const eslintFile: EslinJsonOutput[] = await JSON.parse(await (await fs.readFile(path.join('./', eslintInput))).toString())
      eslintOutput = await eslintAnnotations(eslintFile, pwd, { prefix: eslintPrefix })
      if(eslintOutput.highestSeverity >= highestSeverity) {
        highestSeverity = eslintOutput.highestSeverity
      }

      const errors = eslintOutput.annotations.filter((ann) => ann.severity >= 2).length
      const warns = eslintOutput.annotations.length - errors

      statusCheckStats.eslint = {
        enabled: true,
        warnings: warns,
        errors: errors
      }
    }
    if(typescriptInput) {
      const typescriptFile = await (await fs.readFile(path.join('./', typescriptInput))).toString()
      typescriptOutput = typescriptAnnotations(typescriptFile, { prefix: typescriptPrefix })
      if(typescriptOutput.highestSeverity >= highestSeverity) {
        highestSeverity = typescriptOutput.highestSeverity
      }

      statusCheckStats.typescript = {
        enabled: true,
        errors: typescriptOutput.annotations.length
      }
    }

    if(githubToken && createStatusCheckConfig) {
      const checkId = await createStatusCheck(githubToken, statusCheckName)

      if(eslintInput) await updateStatusCheck(
        githubToken,
        checkId,
        statusCheckName,
        eslintOutput
      )
      if(typescriptInput) await updateStatusCheck(
        githubToken,
        checkId,
        statusCheckName,
        typescriptOutput
      )

      const shouldFail = highestSeverity >= ( errorOnWarn ? 1 : 2 )

      await closeStatusCheck(githubToken, checkId, statusCheckName, shouldFail, statusCheckStats)
    } else {
      if(eslintInput) annotateCode(eslintOutput, 'ESLint Annotations')
      if(typescriptInput) annotateCode(typescriptOutput, 'TypeScript Annotations')
    }

    if( highestSeverity >= ( errorOnWarn ? 1 : 2 ) ) {
      process.exit(1)
    }
  } catch(err) {
    core.error(String(err))
    process.exit(2)
  }
})()
