import * as core from '@actions/core'
import * as fs from 'fs/promises'
import path from 'path'

let failStatus = 0

// this will generate an eslint warning
let number: number

const eslintAnnotations = async (inputFile: EslinJsonOutput[], pwd: string) => {
  const filteredReport = inputFile.map((item) => {
    if(!item.messages.length) return false

    return {
      file: item.filePath.replace(pwd, ''),
      messages: item.messages
    }
  }).filter((item) => item !== false)

  filteredReport.map((item) => {
    if(item == false) return
    item.messages.map((msg) => {
      if(msg.severity == 2) {
        core.error(msg.message, {
          title: 'ESLint Rule: ' + msg.ruleId,
          file: item.file,
          startLine: msg.line,
          endLine: msg.endLine
        })
      } else {
        core.warning(msg.message, {
          title: 'ESLint Rule: ' + msg.ruleId,
          file: item.file,
          startLine: msg.line,
          endLine: msg.endLine
        })
      }
    })
  })

  const highestSeverity = (() => {
    let highest = 0

    filteredReport.map((item) => {
      if(item == false) return
      item.messages.map((msg) => {
        if(msg.severity >= highest) highest = msg.severity
      })
    })

    return highest
  })()

  failStatus = highestSeverity
}

const typescriptAnnotations = async (inputFile: string) => {
  const fileArray = inputFile.split('\n')

  const tsErrors = fileArray.filter((item) => item.includes(': error TS'))
  const formattedErrors = tsErrors.map((error) => {
    const areas = error.split(': ')

    const location = areas[0].split(/[(,)]+/)

    return {
      file: location[0],
      line: Number(location[1]),
      column: Number(location[2]),
      error: areas[1],
      message: areas[2]
    }
  })
  
  formattedErrors.map((error) => {
    core.error(error.message, {
      title: 'Typescript error: ' + error.error,
      file: error.file,
      startLine: error.line,
      endLine: error.line
    })
  })

  if(formattedErrors.length) failStatus = 2
}

(async () => {
  const eslintInput = process.env.NODE_ENV === 'development' ?
    'eslint_report.json' :
    core.getInput('eslint-report')
  const typescriptInput = process.env.NODE_ENV === 'development' ?
    'typescript.log' :
    core.getInput('typescript-log')
  const errorOnWarn = Boolean(core.getInput('error-on-warn')) ? 1 : 2

  const GITHUB_WORKSPACE = !process.env.GITHUB_WORKSPACE ?
    '/home/runner/work/eslint-annotations/eslint-annotations' :
    process.env.GITHUB_WORKSPACE
  const pwd = GITHUB_WORKSPACE.substring(GITHUB_WORKSPACE.length -1, GITHUB_WORKSPACE.length) === '/' ?
    GITHUB_WORKSPACE :
    GITHUB_WORKSPACE + '/'

  try {
    if(eslintInput) {
      core.startGroup('ESLint Annotations')
      const eslintFile: EslinJsonOutput[] = await JSON.parse(await (await fs.readFile(path.join('./', eslintInput))).toString())
      await eslintAnnotations(eslintFile, pwd)
      core.endGroup()
    }
    if(typescriptInput) {
      core.startGroup('Typescript Annotations')
      const typescriptFile = await (await fs.readFile(path.join('./', typescriptInput))).toString()
      await typescriptAnnotations(typescriptFile)
      core.endGroup()
    }

    if(failStatus >= errorOnWarn) {
      console.log('threshold passed')
      process.exit(1)
    }
  } catch (err) {
    core.error(String(err), { title: 'Error reading file' })
    process.exit(1)
  }
})()
