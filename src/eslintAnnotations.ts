/**
 * Parse ESLint Output to cleaner Annotations Object
 * @param inputFile JSON input of ESLint output
 * @param pwd Current working directory of workflow runner
 * @param config Config of annotations
 * @returns JSON Object for use in code
 */
const eslintAnnotations = (
  inputFile: EslinJsonOutput[],
  pwd: string,
  config: AnnotationConfig
): AnnotationsOutput => {
  const filteredReport = inputFile.map((item) => {
    if(!item.messages.length) return false

    const filePath = item.filePath.replace(pwd, '')

    if(
      config.allowedFiles.findIndex((item) => item === filePath) < 0 &&
      config.allowedFiles.length
    ) return false

    return {
      file: filePath,
      messages: item.messages
    }
  }).filter((item) => item !== false)

  const annotations: AnnotationObject[] = []
  filteredReport.forEach((item) => {
    if(item == false) return
    item.messages.forEach((msg) => {
      annotations.push({
        severity: msg.severity,
        title: config.prefix + ' ' + msg.ruleId,
        message: msg.message,
        file: item.file,
        line: msg.line,
        endLine: msg.endLine,
      })
    })
  })

  const highestSeverity = (() => {
    let highest = 0

    filteredReport.forEach((item) => {
      if(item == false) return
      item.messages.forEach((msg) => {
        if(msg.severity >= highest) highest = msg.severity
      })
    })

    return highest
  })()

  return {
    type: 'eslint',
    highestSeverity,
    annotations
  }
}

export default eslintAnnotations
