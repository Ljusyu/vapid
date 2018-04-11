const dotenv = require('dotenv')
const fs = require('fs')
const path = require('path')

const Database = require('./db')
const Directive = require('./directive')
const Logger = require('./logger')
const Server = require('./server')
const Site = require('./site')

const directives = {}

class Vapid {
  constructor(cwd) {
    _loadDotenv(cwd)

    this.env = process.env.NODE_ENV || 'development'
    this.site = new Site(cwd)
    this.db = _initDB.call(this)
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

function _loadDotenv(cwd) {
  let envFile = path.join(cwd, '.env')
  dotenv.config({ path: envFile })
}

function _initDB() {
  return new Database({
    dialect: 'sqlite',
    storage: path.join(this.site.paths.root, 'db', `${this.env}.sqlite`),
  })
}

function _registerDirectives() {
  let dir = require("path").join(__dirname, "directives")

  fs.readdirSync(dir).forEach( file => {
    require(`${dir}/${file}`)(this, Directive)
  });
}

module.exports = Vapid
