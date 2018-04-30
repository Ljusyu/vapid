const dotenv = require('dotenv');
const fs = require('fs');
const http = require('http');
const { join, resolve } = require('path');
const Boom = require('boom');
const Koa = require('koa');

const Cache = require('./cache');
const Database = require('./db');
const Logger = require('./logger');
const Template = require('./template');
const Utils = require('./utils');
const Watcher = require('./watcher');
const dashboard = require('./dashboard');
const middleware = require('./middleware');

const app = new Koa();
const cache = new Cache();
const env = process.env.NODE_ENV || 'development';

const defaults = {
  cache: env === 'production',
  database: {
    dialect: 'sqlite',
    logging: false,
  },
  dataPath: './data',
  liveReload: env === 'development',
  placeholders: env === 'development',
  port: process.env.PORT || 3000,
};

let Section;
let Record;

class Vapid {
  constructor(cwd) {
    // User-defined environment variables
    dotenv.config({ path: resolve(cwd, '.env') });

    // User-defined options
    /* eslint-disable-next-line import/no-dynamic-require, global-require */
    const { vapid: options = {} } = require(resolve(cwd, 'package.json'));

    this.env = env;
    this.config = Utils.merge({}, defaults, options);
    this.paths = _paths.call(this, cwd);
    this.db = _db.call(this);
    this.watcher = env === 'development' && new Watcher(this.paths.www);
    this.liveReload = this.watcher && this.config.liveReload;

    // Convenience
    ({ Section, Record } = this.db.models);

    // Shared with routers
    // TODO: Need a better way to pass these around
    app.context.shared = {
      env,
      Section,
      Record,
      User: this.db.models.User,
      uploadsDir: this.paths.uploads,
    };

    // Set secret key
    app.keys = [process.env.SECRET_KEY];

    // Errors
    app.use(async (ctx, next) => {
      try {
        await next();
      } catch (err) {
        [ctx.status, ctx.body] = _renderError.call(this, err, ctx.request);

        if (this.liveReload) { _injectLiveReload(ctx, this.config.port); }
      }
    });

    // Middleware
    app.use(middleware.security)
      .use(middleware.session(app))
      .use(middleware.webpack(env, this.paths.www))
      .use(middleware.assets(this.paths.uploads, '/uploads'))
      .use(middleware.privateFiles)
      .use(middleware.assets(this.paths.www))
      .use(middleware.assets(dashboard.paths.assets, '/dashboard'))
      .use(middleware.favicon([this.paths.www, dashboard.paths.assets]))
      .use(middleware.logs)
      .use(dashboard.routes());

    // Main route
    app.use(async (ctx) => {
      const cacheKey = ctx.path;

      ctx.body = this.config.cache
        ? cache.get(cacheKey) || cache.put(cacheKey, await _renderContent.call(this, ctx.path))
        : await _renderContent.call(this, ctx.path);

      if (this.liveReload) { _injectLiveReload(ctx, this.config.port); }
    });
  }

  async start() {
    cache.clear();

    await this.db.connect();
    this.server = http.createServer(app.callback());

    if (this.watcher) {
      this.watcher.listen({ server: this.server, port: this.config.port }, () => {
        cache.clear();
      });
    } else {
      this.server.listen(this.config.port);
    }

    Record.addHooks(['afterSave', 'afterDestroy'], () => {
      cache.clear();
      if (this.watcher) { this.watcher.refresh(); }
    });
  }

  stop() {
    if (this.server) { this.server.stop(); }
    this.db.disconnect();
  }
}

/*
 * PRIVATE METHODS
 */

function _paths(cwd) {
  return Utils.assignWith({}, {
    root: '.',
    data: this.config.dataPath,
    uploads: join(this.config.dataPath, 'uploads'),
    www: './www',
  }, (_, srcPath) => resolve(cwd, srcPath));
}

function _db() {
  const dbConfig = this.config.database;

  if (dbConfig.dialect === 'sqlite') {
    dbConfig.storage = resolve(this.paths.data, 'vapid.sqlite');
  }

  return new Database(dbConfig);
}

async function _renderContent(uriPath) {
  const [file, pathSection, pathRecordId] = _analyzePath.call(this, uriPath);
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
    let recordContent = await Section.contentFor(args, recordId);

    if (this.placeholders) {
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
  const siteFile = resolve(this.paths.www, '_error.html');
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

  Logger.extra(error.stack);

  return [status, rendered];
}

function _addPlaceholders(content, section) {
  // TODO: Reference 'general' from Section class
  const prefix = section.name !== 'general' ? `${section.name}::` : '';

  if (content.length === 0) {
    const placeholders = Utils.reduce(section.fields, (memo, params, token) => {
      if (!Utils.has(Record.SPECIAL_FIELDS, params.name)) {
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
  const sysPath = join(this.paths.www, uriPath);
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
    partial = resolve(this.paths.www, `_${sectionName}.html`);

    if (fs.existsSync(partial) && !Utils.isNaN(recordId)) {
      file = partial;
    }
  }

  return [file, sectionName, recordId];
}

function _injectLiveReload(ctx, port) {
  const { hostname } = ctx.request;
  const wsPort = _websocketPort(ctx, port);
  const script = `<script src="/dashboard/javascripts/livereload.js?snipver=1&port=${wsPort}&host=${hostname}"></script>`;

  ctx.body = ctx.body.replace(/(<\/body>(?![\s\S]*<\/body>[\s\S]*$))/i, `${script}\n$1`);
}

// Hack to help determine Glitch WebSocket port
function _websocketPort(ctx, port) {
  const forwarded = ctx.header['x-forwarded-proto'];
  const protocol = forwarded ? forwarded.split(',')[0] : undefined;
  return protocol === 'https' ? 443 : port;
}

module.exports = Vapid;
