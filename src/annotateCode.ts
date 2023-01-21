import * as core from '@actions/core'

/**
 * Annotates Code through CLI
 * @param input Object of annotations
 */
const annotateCode = (
  input: AnnotationsOutput,
  groupName: string
) => {
  core.startGroup(groupName)

  input.annotations.map((annotation) => {
    if(annotation.severity > 1) {
      core.error(annotation.message, {
        title: annotation.title,
        file: annotation.file,
        startLine: annotation.line,
        startColumn: annotation.column,
      })
    } else {
      core.warning(annotation.message, {
        title: annotation.title,
        file: annotation.file,
        startLine: annotation.line,
        startColumn: annotation.column,
      })
    }
  })

  core.endGroup()
}

export default annotateCode
