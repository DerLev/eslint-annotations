import * as core from '@actions/core'

/**
 * Annotate code with TypeScript errors
 * @param inputFile Input string of TS CLI output
 * @param config Config of annotations
 * @returns Severity of 2 if failed or nothing
 */
const typescriptAnnotations = async (inputFile: string, config: AnnotationConfig) => {
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
      title: config.prefix + ' ' + error.error,
      file: error.file,
      startLine: error.line,
      endLine: error.line
    })
  })

  if(formattedErrors.length) return 2
}

export default typescriptAnnotations
