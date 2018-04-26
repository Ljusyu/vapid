const fs = require('fs');
const { join, resolve } = require('path');

const Database = require('./db');
const Directive = require('./directive');
const Logger = require('./logger');
const Server = require('./server');
const Site = require('./site');
const Utils = require('./utils');

const directives = {};
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

class Vapid {
  constructor(cwd, options = {}) {
    this.root = resolve(__dirname, '..');
    this.env = env;
    this.cwd = cwd;
    this.config = _config(options);
    this.paths = _paths.call(this);
    this.site = new Site(this.paths);
    this.db = _db.call(this);
    this.models = this.db.models;
    this.log = Logger;

    // TODO: Revisit how directives are created/registered
    _registerDirectives.call(this);
  }

  initSite() {
    this.site.init();
  }

  /* eslint-disable class-methods-use-this, new-cap */
  directive(params) {
    const name = params.type;

    if (Utils.has(directives, name)) {
      return new directives[name](params);
    }

    // Only show warning if someone explicity enters a bad name
    if (name) { Logger.warn(`Directive type '${name}' does not exist. Falling back to 'text'`); }
    return new directives.text(params);
  }
  /* eslint-enable new-cap */

  registerDirective(name, klass) {
    directives[name] = klass;
  }
  /* eslint-enable class-methods-use-this */

  async startServer() {
    await this.db.connect();
    this.server = new Server(this.site);
    this.server.start();
  }

  stopServer() {
    if (this.server) { this.server.stop(); }
    this.db.disconnect();
  }
}

/*
 * PRIVATE METHODS
 */

function _config(options) {
  return Utils.merge({}, defaults, options);
}

function _paths() {
  return Utils.assignWith({}, {
    root: '.',
    data: this.config.dataPath,
    uploads: join(this.config.dataPath, 'uploads'),
    www: './www',
  }, (_, srcPath) => resolve(this.cwd, srcPath));
}

function _db() {
  const dbConfig = this.config.database;

  if (dbConfig.dialect === 'sqlite') {
    dbConfig.storage = resolve(this.paths.data, 'vapid.sqlite');
  }

  return new Database(dbConfig);
}

/* eslint-disable global-require, import/no-dynamic-require */
function _registerDirectives() {
  const dir = resolve(__dirname, 'directives');

  fs.readdirSync(dir).forEach((file) => {
    require(`${dir}/${file}`)(this, Directive);
  });
}
/* eslint-enable global-require, import/no-dynamic-require */

module.exports = Vapid;
