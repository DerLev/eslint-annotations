const path = require('path')
const webpack = require('webpack')
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer')

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
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: process.env.NODE_ENV == 'development' ? 'static' : 'disabled',
      reportFilename: path.resolve(__dirname, 'bundle-report.html')
    }),
    new webpack.optimize.ModuleConcatenationPlugin()
  ],
}
