import * as core from '@actions/core'
import * as fs from 'fs/promises'
import path from 'path'

(async () => {
  const eslintInput = core.getInput('eslint-report')
  const typescriptInput = core.getInput('typescript-log')
  const errorOnWarn = Boolean(core.getInput('error-on-warn'))

  try {
    if(eslintInput) {
      const eslintFile = await JSON.parse(await (await fs.readFile(path.join('./', eslintInput))).toString())
      console.log(eslintFile)
    }
    if(typescriptInput) {
      const typescriptFile = await (await fs.readFile(path.join('./', typescriptInput))).toString()
      console.log(typescriptFile)
    }
  } catch (err) {
    core.error(String(err), { title: 'Error reading file' })
    process.exit(1)
  }
})()
