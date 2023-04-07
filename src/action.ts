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
  const {
    eslintInput,
    eslintPrefix,
    eslintInputArray,
    typescriptInput,
    typescriptPrefix,
    typescriptInputArray,
    githubToken,
    errorOnWarn,
    createStatusCheck: createStatusCheckConfig,
    statusCheckName,
    failedAttempts,
    failInPr,
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

    // somehow this var needs to be set to a value to avoid TS and ESLint errors
    let checkId = 0

    if(githubToken && createStatusCheckConfig) {
      checkId = await createStatusCheck(githubToken, statusCheckName)
        .catch(() => {
          throw new Error('There has been an issue creating the status check. Does the action have the right permissions?')
        })
    }

    const eslintOutput: AnnotationsOutput = { type: 'eslint', highestSeverity: 0, annotations: [] }
    const typescriptOutput: AnnotationsOutput = { type: 'typescript', highestSeverity: 0, annotations: [] }

    let highestSeverity = 0

    const statusCheckStats: StatusCheckStats = {
      eslint: {
        enabled: false,
        warnings: 0,
        errors: 0,
      },
      typescript: {
        enabled: false,
        errors: 0,
      },
    }

    if(eslintInput) {
      await Promise.all(eslintInputArray.map(async (file) => {
        const eslintFile: EslinJsonOutput[] = await JSON.parse(await (await fs.readFile(path.join('./', file))).toString())
        const fileAnnotation = await eslintAnnotations(eslintFile, pwd, { prefix: eslintPrefix })

        eslintOutput.highestSeverity = eslintOutput.highestSeverity < fileAnnotation.highestSeverity ?
          fileAnnotation.highestSeverity :
          eslintOutput.highestSeverity

        eslintOutput.annotations = eslintOutput.annotations.concat(
          fileAnnotation.annotations.filter((item) => eslintOutput.annotations.indexOf(item) < 0)
        )

        return fileAnnotation
      }))

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
      await Promise.all(typescriptInputArray.map(async (file) => {
        const typescriptFile = await (await fs.readFile(path.join('./', file))).toString()
        const fileAnnotation = typescriptAnnotations(typescriptFile, { prefix: typescriptPrefix })
        
        typescriptOutput.highestSeverity = typescriptOutput.highestSeverity < fileAnnotation.highestSeverity ?
          fileAnnotation.highestSeverity :
          typescriptOutput.highestSeverity
        
        typescriptOutput.annotations = typescriptOutput.annotations.concat(
          fileAnnotation.annotations.filter((item) => typescriptOutput.annotations.indexOf(item) < 0)
        )
        
        return fileAnnotation
      }))

      if(typescriptOutput.highestSeverity >= highestSeverity) {
        highestSeverity = typescriptOutput.highestSeverity
      }
      
      statusCheckStats.typescript = {
        enabled: true,
        errors: typescriptOutput.annotations.length
      }
    }

    if(githubToken && createStatusCheckConfig) {
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

      const shouldFail = highestSeverity >= errorOnWarn

      await closeStatusCheck(githubToken, checkId, statusCheckName, shouldFail, statusCheckStats)
    } else {
      if(eslintInput) annotateCode(eslintOutput, 'ESLint Annotations')
      if(typescriptInput) annotateCode(typescriptOutput, 'TypeScript Annotations')
    }

    // handle failed attempts
    if(failedAttempts && githubToken) {
      const failedArray = failedAttempts.split(',').map((attempt) => {
        if(attempt.substring(0, 1) == ' ') return Number(attempt.substring(1, attempt.length))
        return Number(attempt)
      })

      const checkStats = {
        eslint: {
          enabled: false,
          warnings: 0,
          errors: 0,
        },
        typescript: {
          enabled: false,
          errors: 0,
        },
      }

      const promises: Promise<any>[] = []
      failedArray.map((failed) => {
        promises.push(closeStatusCheck(githubToken, failed, 'Failed Attempt', false, checkStats))
      })
      await Promise.all(promises)
    }

    if(highestSeverity >= errorOnWarn) {
      console.log('error-on-warn')
      if(github.context.eventName == 'pull_request' && !failInPr) {
        return
      } else {
        process.exit(1)
      }
    }
  } catch(err) {
    core.error(String(err))
    process.exit(2)
  }
})()
