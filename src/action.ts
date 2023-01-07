import * as core from '@actions/core'
import * as fs from 'fs'

(() => {
  core.notice('This is a test', {
    title: 'Hello World!',
    file: 'src/action.ts',
    startLine: 5,
    endLine: 10
  })
})()
