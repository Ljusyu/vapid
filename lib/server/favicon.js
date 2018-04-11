const fs = require('fs')
const path = require('path')
const Utils = require('../utils')

module.exports = function (paths = [], options = {}) {
  let faviconPath = '/favicon.ico'
  let icon, filePath
  const maxAge = options.maxAge == null
    ? 86400000
    : Math.min(Math.max(0, options.maxAge), 31556926000)
  const cacheControl = `public, max-age=${maxAge / 1000 | 0}`

  return (ctx, next) => {
    if (ctx.path != faviconPath) {
      return next()
    }

    if ('GET' !== ctx.method && 'HEAD' !== ctx.method) {
      ctx.status = 'OPTIONS' == ctx.method ? 200 : 405
      ctx.set('Allow', 'GET, HEAD, OPTIONS')
    } else {
      Utils.each(paths, p => {
        filePath = path.join(p, faviconPath)
        try {
          icon = fs.readFileSync(filePath)
        } catch (err) { /* Do nothing */ }
        if (icon) return false
      })

      ctx.set('Cache-Control', cacheControl)
      ctx.type = 'image/x-icon'
      ctx.body = icon
    }
  }
}
