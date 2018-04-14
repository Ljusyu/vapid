const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

const Database = require('./db')
const Directive = require('./directive')
const Logger = require('./logger')
const Server = require('./server')
const Site = require('./site')
const Utils = require('./utils')

const NODE_ENV = process.env.NODE_ENV || 'development'

const DEFAULT_CONFIG = {
  database: {
    dialect: 'sqlite',
    storage: './db/vapid.sqlite',
    logging: false
  },
  livereload: NODE_ENV == 'development',
  log: NODE_ENV == 'development' ? 'tiny' : 'combined',
  port: process.env.PORT || 3000
}

const directives = {}

class Vapid {
  constructor(cwd) {
    // Relative paths use the site directory
    process.chdir(cwd)
    dotenv.config()

    this.env = NODE_ENV
    this.config = Utils.merge({}, DEFAULT_CONFIG, _packageConfig())
    this.site = new Site(cwd)
    this.db = _initDB(this.config.database)
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
    this.server = new Server()

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

function _packageConfig() {
  return require(path.resolve('package.json')).vapid || {}
}

function _initDB(dbConfig) {
  if (dbConfig.dialect == 'sqlite' && dbConfig.storage) {
    Utils.mkdirp(path.dirname(dbConfig.storage))
  }

  return new Database(dbConfig)
}

function _registerDirectives() {
  let dir = require("path").join(__dirname, "directives")

  fs.readdirSync(dir).forEach( file => {
    require(`${dir}/${file}`)(this, Directive)
  });
}

module.exports = Vapid
