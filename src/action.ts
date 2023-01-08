import * as core from '@actions/core'
import * as fs from 'fs'

(async () => {
  const eslintOutput = JSON.parse(fs.readFileSync('./eslint_report.json').toString())
  console.log(JSON.stringify(eslintOutput, null, 2))

  let number: number
  number = "String"
})()
