const glob = require('glob')
const { resolve } = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const mode = vapid.env == 'development' ? 'development' : 'production'
const site_modules = resolve(vapid.site.paths.root, 'node_modules')
const vapid_modules = resolve(__dirname, 'node_modules')

module.exports = {
  mode: mode,
  context: vapid_modules,
  entry: [
    resolve(vapid.site.paths.root, 'site.js'),
    glob.sync(resolve(vapid.site.paths.root, '*.?(scss|sass)'))[0]
  ],
  output: {
    path: vapid.site.paths.public,
    publicPath: '/',
    filename: 'site.js'
  },
  module: {
    rules: [
      {
        test:/\.(sass|scss)$/,
        use: [
          { loader: 'css-hot-loader' },
          { loader: MiniCssExtractPlugin.loader },
          { loader: 'css-loader', options: { url: false } },
          { loader: 'sass-loader' }
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "site.css",
    })
  ],
  resolve: {
    modules: [
      vapid_modules,
      site_modules
    ],
  }
}