import * as core from '@actions/core'

/**
 * Annotate code with ESLint warns and errors
 * @param inputFile JSON input of ESLint output
 * @param pwd Current working directory of workflow runner
 * @param config Config of annotations
 * @returns Severity number
 */
const eslintAnnotations = async (inputFile: EslinJsonOutput[], pwd: string, config: AnnotationConfig) => {
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
          title: config.prefix + ' ' + msg.ruleId,
          file: item.file,
          startLine: msg.line,
          endLine: msg.endLine
        })
      } else {
        core.warning(msg.message, {
          title: config.prefix + ' ' + msg.ruleId,
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

  return highestSeverity
}

export default eslintAnnotations
