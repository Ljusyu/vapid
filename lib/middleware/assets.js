const mount = require('koa-mount');
const serve = require('koa-static');
const { extname } = require('path');
const Boom = require('boom');
const Utils = require('../utils');

module.exports = function assets(path, prefix = '/') {
  return async (ctx, next) => {
    const ext = extname(ctx.path);

    if (Utils.includes(['', '.html'], ext)) {
      await next();
    } else if (Utils.includes(['.scss', '.sass'], ext)) {
      const suggestion = ctx.path.replace(/\.(scss|sass)$/, '.css');
      throw Boom.notFound(`Sass files cannot be served. Use "${suggestion}" instead.`);
    } else {
      await mount(prefix, serve(path))(ctx, next);
    }
  };
};
