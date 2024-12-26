/**
 * Parse JSON Object from TypeScript errors
 * @param inputFile Input string of TS CLI output
 * @param config Config of annotations
 * @returns JSON Object for use in code
 */
const typescriptAnnotations = (
  inputFile: string,
  config: AnnotationConfig
): AnnotationsOutput => {
  const fileArray = inputFile.split('\n')

  const tsErrors = fileArray.filter((item) => item.includes(': error TS'))
  const formattedErrors = tsErrors.map((error) => {
    const areas = error.split(': ')

    const location = areas[0].split(/[(,)]+/)
    const filePath = location[0]

    if(
      config.allowedFiles.findIndex((item) => item === filePath) < 0 &&
      config.allowedFiles.length
    ) return false

    return {
      file: filePath,
      line: Number(location[1]),
      column: Number(location[2]),
      title: config.prefix + ' ' + areas[1].split(' ')[1],
      message: areas[2],
      severity: 2,
    }
  }).filter((item) => item !== false)
  
  const annotations: AnnotationObject[] = []
  formattedErrors.forEach((error) => {
    if(!error) return
    annotations.push(error)
  })

  return {
    type: 'typescript',
    highestSeverity: formattedErrors.length ? 2 : 0,
    annotations
  }
}

export default typescriptAnnotations
