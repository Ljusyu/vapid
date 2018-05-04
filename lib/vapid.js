const dotenv = require('dotenv');
const fs = require('fs');
const http = require('http');
const { join, resolve } = require('path');
const Boom = require('boom');
const Koa = require('koa');

const Builder = require('./builder');
const Cache = require('./cache');
const Dashboard = require('./dashboard');
const Database = require('./db');
const Logger = require('./logger');
const Template = require('./template');
const Utils = require('./utils');
const Watcher = require('./watcher');
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
let dashboard;

/**
 * This is the main class that powers Vapid.
 * It instantiates most of the classes, and runs the core web server.
 */
class Vapid {
  /**
   * This module works in conjunction with a site directory.
   *
   * @param {string} cwd - path to site
   * @return {Vapid}
   */
  constructor(cwd) {
    // User-defined environment variables
    dotenv.config({ path: resolve(cwd, '.env') });

    // User-defined options
    /* eslint-disable-next-line import/no-dynamic-require, global-require */
    const { vapid: options = {} } = require(resolve(cwd, 'package.json'));

    this.env = env;
    this.config = Utils.merge({}, defaults, options);
    this.paths = _paths(cwd, this.config.dataPath);
    this.db = _db(this.config.database, this.paths.data);
    this.builder = new Builder({ Section: this.db.models.Section, templatesDir: this.paths.www });
    this.watcher = env === 'development' && new Watcher(this.paths.www);
    this.liveReload = this.watcher && this.config.liveReload;

    // Convenience
    ({ Section, Record } = this.db.models);

    // Share with dashboard
    dashboard = new Dashboard({
      env,
      Section,
      Record,
      User: this.db.models.User,
      builder: this.builder,
      uploadsDir: this.paths.uploads,
    });

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
      .use(dashboard.routes);

    // Main route
    app.use(async (ctx) => {
      const cacheKey = ctx.path;

      ctx.body = this.config.cache
        ? cache.get(cacheKey) || cache.put(cacheKey, await _renderContent.call(this, ctx.path))
        : await _renderContent.call(this, ctx.path);

      if (this.liveReload) { _injectLiveReload(ctx, this.config.port); }
    });
  }

  /**
   * Starts core services (db, watcher, web server)
   * and registers callbacks
   *
   * @listens {server}
   * @listens {watcher}
   * @listens {Record.addHooks}
   */
  async start() {
    cache.clear();

    await this.db.connect();
    this.server = http.createServer(app.callback());

    if (this.watcher) {
      const watcherOptions = {
        liveReload: this.liveReload,
        server: this.server,
        port: this.config.port,
      };

      this.watcher.listen(watcherOptions, () => { cache.clear(); });
    } else {
      this.server.listen(this.config.port);
    }

    Record.addHooks(['afterSave', 'afterDestroy'], () => {
      cache.clear();
      if (this.liveReload) { this.watcher.refresh(); }
    });
  }

  /**
   * Safely stops the services
   */
  stop() {
    if (this.server) { this.server.stop(); }
    this.db.disconnect();
  }
}

/**
 * @private
 *
 * Resolves commonly-used paths
 *
 * @param {string} cwd
 * @param {string} dataPath - data directory
 * @return {Object} absolute paths
 */
function _paths(cwd, dataPath) {
  return Utils.assignWith({}, {
    root: '.',
    data: dataPath,
    uploads: join(dataPath, 'uploads'),
    www: './www',
  }, (_, srcPath) => resolve(cwd, srcPath));
}

/**
 * @private
 *
 * Instantiates the database
 *
 * @param {Object} dbConfig - database config
 * @param {string} dataPath - data directory
 * @return {Database} a new database instance
 */
function _db(dbConfig, dataPath) {
  if (dbConfig.dialect === 'sqlite') {
    /* eslint-disable-next-line no-param-reassign */
    dbConfig.storage = resolve(dataPath, 'vapid.sqlite');
  }

  return new Database(dbConfig);
}

/**
 * @private
 *
 * Renders content into site template
 *
 * @param {string} uriPath
 * @return {string} rendered HTML
 *
 * @todo Use Promise.all when fetching content
 */
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
    /* eslint-disable-next-line no-await-in-loop */
    let recordContent = await Section.contentFor(args, recordId);

    if (this.config.placeholders) {
      recordContent = _addPlaceholders(recordContent, args);
    }

    content[token] = recordContent;
  }
  /* eslint-enable no-restricted-syntax */

  return template.render(content);
}

/**
 * @private
 *
 * Renders error, first by looking in the site directory,
 * then falling back to Vapid own error template.
 *
 * @param {Error} err
 * @param {Object} request
 * @return {[status, rendered]} HTTP status code, and rendered HTML
 */
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

/**
 * @private
 *
 * Adds placeholders if no content is present
 *
 * @param {Object} content
 * @param {Object} section
 * @return {Object} content containing placeholders
 */
function _addPlaceholders(content, section) {
  const prefix = section.name !== Section.DEFAULT_NAME ? `${section.name}::` : '';

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

/**
 * @private
 *
 * Analyzes request path, and matches it to the corresponding site template
 * Also determines the section name and record ID if necessary
 *
 * @param {string} uriPath - request path
 * @return {[file, sectionName, recordId]}
 *
 * @todo Assumes .html files, but should probably be more tolerant
 */
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
    const partial = resolve(this.paths.www, `_${sectionName}.html`);

    if (fs.existsSync(partial) && !Utils.isNaN(recordId)) {
      file = partial;
    }
  }

  return [file, sectionName, recordId];
}

/**
 * @private
 *
 * Injects LiveReload script into HTML
 *
 * @param {Object} ctx
 * @param {number} port - server port number
 */
function _injectLiveReload(ctx, port) {
  const { hostname } = ctx.request;
  const wsPort = _websocketPort(ctx, port);
  const script = `<script src="/dashboard/javascripts/livereload.js?snipver=1&port=${wsPort}&host=${hostname}"></script>`;

  ctx.body = ctx.body.replace(/(<\/body>(?![\s\S]*<\/body>[\s\S]*$))/i, `${script}\n$1`);
}

/**
 * @private
 *
 * Hack to help determine Glitch WebSocket port
 *
 * @param {Object} ctx
 * @param {number} port - server port number
 * @return {number} WebSocket port number
 */
function _websocketPort(ctx, port) {
  const forwarded = ctx.header['x-forwarded-proto'];
  const protocol = forwarded ? forwarded.split(',')[0] : undefined;
  return protocol === 'https' ? 443 : port;
}

module.exports = Vapid;
