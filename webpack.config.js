const path = require('path')

module.exports = {
  target: 'node',
  mode: 'production',
  entry: './src/action.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'action.js',
    path: path.resolve(__dirname, 'dist'),
  },
}
