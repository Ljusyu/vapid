const fs = require('fs')
const path = require('path')

const Database = require('./db')
const Directive = require('./directive')
const Logger = require('./logger')
const Server = require('./server')
const Site = require('./site')

class Vapid {
  constructor(path) {
    this.env = process.env.NODE_ENV || 'development'
    
    this.site = new Site(path)
    this.db = this._initDB()
    this.directives = []
    this.models = this.db.models
    this.log = Logger

    // TODO: Revisit how directives are created/registered
    this._registerDirectives()
  }

  /*********************
    PUBLIC METHODS
   *********************/
  initSite() {
    this.site.init()
  }

  registerDirective(name, attrs = {}) {
    this.directives[name] = new Directive(attrs)
  }

  startServer() {
    this.server = new Server()

    this.db.connect()
    this.server.start()
  }

  stopServer() {
    this.server && this.server.stop()
    this.db.disconnect()
  }

  /*********************
    PRIVATE METHODS
   *********************/
  _initDB() {
    return new Database({
      dialect: 'sqlite',
      storage: path.join(this.site.paths.root, 'db', `${this.env}.sqlite`),
    })
  }

  _registerDirectives() {
    let dir = require("path").join(__dirname, "directives")

    fs.readdirSync(dir).forEach( file => {
      require(`${dir}/${file}`)(this, Directive)
    });
  }
}

module.exports = Vapid
