import * as core from '@actions/core'
import exec from '@actions/exec'
import * as fs from 'fs/promises'
import path from 'path'

const eslintAnnotations = async (inputFile: EslinJsonOutput[]) => {
  console.log(inputFile)
}

const typescriptAnnotations = async (inputFile: string) => {
  console.log(inputFile)
}

(async () => {
  const eslintInput = process.env.NODE_ENV === 'development' ?
    'eslint_report.json' :
    core.getInput('eslint-report')
  const typescriptInput = process.env.NODE_ENV === 'development' ?
    'typescript.log' :
    core.getInput('typescript-log')
  const errorOnWarn = Boolean(core.getInput('error-on-warn'))

  const pwd = await exec.exec('pwd')
  console.log(pwd)

  try {
    if(eslintInput) {
      core.startGroup('eslint annotations')
      const eslintFile: EslinJsonOutput[] = await JSON.parse(await (await fs.readFile(path.join('./', eslintInput))).toString())
      await eslintAnnotations(eslintFile)
      core.endGroup()
    }
    if(typescriptInput) {
      core.startGroup('typescript annotations')
      const typescriptFile = await (await fs.readFile(path.join('./', typescriptInput))).toString()
      await typescriptAnnotations(typescriptFile)
      core.endGroup()
    }
  } catch (err) {
    core.error(String(err), { title: 'Error reading file' })
    process.exit(1)
  }
})()
