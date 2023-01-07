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
