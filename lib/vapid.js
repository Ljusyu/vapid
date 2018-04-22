const fs = require('fs')
const { join, resolve } = require('path')

const Database = require('./db')
const Directive = require('./directive')
const Logger = require('./logger')
const Server = require('./server')
const Site = require('./site')
const Utils = require('./utils')

const directives = {}
const node_env = process.env.NODE_ENV || 'development'
const defaults = {
  cache: node_env == 'production',
  database: {
    dialect: 'sqlite',
    logging: false
  },
  dataPath: './data',
  placeholders: node_env == 'development',
  port: process.env.PORT || 3000,
  watch: node_env === 'development'
}

class Vapid {
  constructor(cwd, options = {}) {
    this.root = resolve(__dirname, '..')
    this.env = node_env
    this.cwd = cwd
    this.config = _config(options)
    this.paths = _paths.call(this)
    this.site = new Site(this.paths)
    this.db = _db.call(this)
    this.models = this.db.models
    this.log = Logger

    // TODO: Revisit how directives are created/registered
    _registerDirectives.call(this)
  }

  initSite() {
    this.site.init()
  }

  directive(params) {
    let name = params.type

    if (directives.hasOwnProperty(name)) {
      return new directives[name](params);
    } else {
      // Only show warning if someone explicity enters a bad name
      name && Logger.warn(`Directive type '${name}' does not exist. Falling back to 'text'`)
      return new directives['text'](params)
    }
  }

  registerDirective(name, klass) {
    directives[name] = klass
  }

  async startServer() {
    this.server = new Server(this.site)

    await this.db.connect()
    this.server.start()
  }

  stopServer() {
    this.server && this.server.stop()
    this.db.disconnect()
  }
}

/*********************
 * PRIVATE METHODS
 *********************/

function _config(options) {
  return Utils.merge({}, defaults, options)
}

function _paths() {
  return Utils.assignWith({}, {
    root: '.',
    data: this.config.dataPath,
    uploads: join(this.config.dataPath, 'uploads'),
    www: './www'
  }, (_, srcPath) => {
    return resolve(this.cwd, srcPath)
  })
}

function _db() {
  let dbConfig = this.config.database

  if (dbConfig.dialect == 'sqlite') {
    dbConfig.storage = resolve(this.paths.data, `vapid.sqlite`)
  }

  return new Database(dbConfig)
}

function _registerDirectives() {
  let dir = resolve(__dirname, "directives")

  fs.readdirSync(dir).forEach( file => {
    require(`${dir}/${file}`)(this, Directive)
  });
}

module.exports = Vapid
