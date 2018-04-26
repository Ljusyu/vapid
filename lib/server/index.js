const fs = require('fs');
const helmet = require('koa-helmet');
const http = require('http');
const logger = require('koa-log');
const mount = require('koa-mount');
const serve = require('koa-static');
const session = require('koa-session');
const Boom = require('boom');
const Koa = require('koa');
const {
  basename, extname, join, resolve,
} = require('path');

const cache = require('../cache');
const dashboard = require('./dashboard');
const favicon = require('./favicon');
const Template = require('../template');
const Utils = require('../utils');
const Watcher = require('./watcher');

const app = new Koa();
const cachePathPrefix = 'site-';

class Server {
  constructor(site) {
    const logLevel = vapid.env === 'development' ? 'tiny' : 'combined';

    this.server = undefined;
    this.watcher = vapid.env === 'development' && new Watcher(site.paths.www);
    this.liveReload = this.watcher && vapid.config.liveReload;

    app.keys = [process.env.SECRET_KEY];

    /*******************
     * ERROR HANDLING
     ******************/

    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        [ctx.status, ctx.body] = _renderError(err, ctx.request);

        if (this.liveReload) {
          _injectLiveReload(ctx);
        }
      }
    });

    /*******************
     * MIDDLEWARES
     ******************/

    // TODO: Should there be a "public" folder that acts as a webpack cache in production?
    //       Disabling "global-require" until global.vapid is sorted out
    /* eslint-disable global-require */
    app.use(helmet())
      .use(session({ key: 'vapid:sess' }, app))
      .use(require('../webpack/middleware'))
      .use(mount('/uploads', serve(site.paths.uploads)))
      .use(_hidePrivates)
      .use(_siteAssets)
      .use(mount('/dashboard', serve(dashboard.paths.assets)))
      .use(favicon([site.paths.www, dashboard.paths.assets]))
      .use(logger(logLevel))
      .use(dashboard.routes());
    /* eslint-enable global-require */

    /*******************
     * SITE CONTENT
     ******************/

    app.use(async (ctx) => {
      const cacheKey = `${cachePathPrefix}${ctx.path}`;

      ctx.body = vapid.config.cache
        ? cache.get(cacheKey) || cache.put(cacheKey, await _renderContent(ctx.path))
        : await _renderContent(ctx.path);

      if (this.liveReload) {
        _injectLiveReload(ctx);
      }
    });
  }

  start() {
    cache.clear();

    this.server = http.createServer(app.callback());

    if (this.watcher) {
      this.watcher.listen({ server: this.server, port: vapid.config.port }, () => {
        cache.clearPrefix(cachePathPrefix);
      });
    } else {
      this.server.listen(vapid.config.port);
    }

    vapid.models.Record.addHooks(['afterSave', 'afterDestroy'], () => {
      cache.clearPrefix(cachePathPrefix);
      if (this.watcher) { this.watcher.refresh(); }
    });
  }

  stop() {
    vapid.models.Record.removeHooks(['afterSave', 'afterDestroy']);
    if (this.watcher) { this.watcher.close(); }
    if (this.server) { this.server.close(); }
  }
}

/******************
 * PRIVATE METHODS
 ******************/

async function _renderContent(uriPath) {
  const [file, pathSection, pathRecordId] = _analyzePath(uriPath);
  const content = {};

  if (!file) {
    throw Boom.notFound('Template not found');
  }

  const template = Template.fromFile(file);
  const tree = template.parse();

  /* eslint-disable no-restricted-syntax */
  for (const [token, args] of Object.entries(tree)) {
    const recordId = pathSection === args.name ? pathRecordId : null;
    // TODO: Use Promise.all
    /* eslint-disable-next-line no-await-in-loop */
    let recordContent = await vapid.models.Section.contentFor(args, recordId);

    if (vapid.config.placeholders) {
      recordContent = _addPlaceholders(recordContent, args);
    }

    content[token] = recordContent;
  }
  /* eslint-enable no-restricted-syntax */

  return template.render(content);
}

function _renderError(err, request) {
  const error = Boom.boomify(err);

  const status = error.output.statusCode;
  const siteFile = resolve(vapid.site.paths.www, '_error.html');
  const errorFile = fs.existsSync(siteFile) ? siteFile : resolve(dashboard.paths.views, 'error.html');
  const rendered = Template.fromFile(errorFile).render({
    error: {
      status,
      title: error.output.payload.error,
      message: error.message,
      stack: error.stack,
    },
    request,
  });

  vapid.log.extra(error.stack);

  return [status, rendered];
}

function _addPlaceholders(content, section) {
  // TODO: Reference 'general' from Section class
  const prefix = section.name !== 'general' ? `${section.name}::` : '';

  if (content.length === 0) {
    const placeholders = Utils.reduce(section.fields, (memo, params, token) => {
      if (!Utils.has(vapid.models.Record.SPECIAL_FIELDS, params.name)) {
        /* eslint-disable-next-line no-param-reassign */
        memo[token] = `{{${prefix}${params.name}}}`;
      }
      return memo;
    }, {});
    content.push(placeholders);
  } else if (section.keyword !== 'form') {
    Utils.each(content, (record) => {
      Utils.each(record, (value, key) => {
        const { name } = section.fields[key];

        if (Utils.isEmpty(value) && name) {
          /* eslint-disable-next-line no-param-reassign */
          record[key] = `{{${prefix}${name}}}`;
        }
      });
    });
  }

  return content;
}

// TODO: Assumes .html files, but should probably be more tolerant
function _analyzePath(uriPath) {
  const sysPath = join(vapid.site.paths.www, uriPath);
  let file;
  let recordId;
  let sectionName;

  if (fs.existsSync(sysPath)) {
    const stats = fs.statSync(sysPath);

    if (stats.isDirectory()) {
      const dirFile = resolve(sysPath, 'index.html');
      file = fs.existsSync(dirFile) ? dirFile : null;
    } else {
      file = sysPath;
    }
  } else {
    [sectionName, recordId] = uriPath.slice(1).split('/');
    partial = resolve(vapid.site.paths.www, `_${sectionName}.html`);

    if (fs.existsSync(partial) && !Utils.isNaN(recordId)) {
      file = partial;
    }
  }

  return [file, sectionName, recordId];
}

async function _hidePrivates(ctx, next) {
  const filename = basename(ctx.path);
  const char = filename.slice(0, 1);

  if (Utils.includes(['_', '.'], char)) {
    throw Boom.notFound('Filenames starting with an underscore or period are private, and cannot be served.');
  } else {
    await next();
  }
}

async function _siteAssets(ctx, next) {
  const ext = extname(ctx.path);

  if (Utils.includes(['', '.html'], ext)) {
    await next();
  } else if (Utils.includes(['.scss', '.sass'], ext)) {
    const suggestion = ctx.path.replace(/\.(scss|sass)$/, '.css');
    throw Boom.notFound(`Sass files cannot be served. Use "${suggestion}" instead.`);
  } else {
    await serve(vapid.site.paths.www)(ctx, next);
  }
}

function _injectLiveReload(ctx) {
  const { hostname } = ctx.request;
  const port = _websocketPort(ctx);
  const script = `<script src="/dashboard/javascripts/livereload.js?snipver=1&port=${port}&host=${hostname}"></script>`;

  ctx.body = ctx.body.replace(/(<\/body>(?![\s\S]*<\/body>[\s\S]*$))/i, `${script}\n$1`);
}

// Hack to help determine Glitch WebSocket port
function _websocketPort(ctx) {
  const forwarded = ctx.header['x-forwarded-proto'];
  const protocol = forwarded ? forwarded.split(',')[0] : undefined;
  return protocol === 'https' ? 443 : vapid.config.port;
}

module.exports = Server;
