interface EslintJsonMessage {
  ruleId: string
  severity: number
  message: string
  line: number
  column: number
  nodeType: string
  messageId: string
  endLine: number
  endColumn: number
}

interface EslinJsonOutput {
  filePath: string
  messages: EslintJsonMessage[]
  suppressedMessages: EslintJsonMessage[]
  errorCount: number
  fatalErrorCount: number
  warningCount: number
  fixableErrorCount: number
  fixableWarningCount: number
  source: string
  usedDeprecatedRules: any[]
}

interface AnnotationConfig {
  prefix: string
  allowedFiles: string[]
}

interface AnnotationsOutput {
  type: "eslint" | "typescript"
  highestSeverity: number
  annotations: AnnotationObject[]
}

interface AnnotationObject {
  severity: number
  title: string
  message: string
  file: string
  line: number
  endLine?: number
  column?: number
}

interface StatusCheckStats {
  eslint: {
    enabled: boolen
    warnings: number
    errors: number
  }
  typescript: {
    enabled: boolen
    errors: number
  }
}
