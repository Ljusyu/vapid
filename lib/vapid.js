const fs = require('fs')
const path = require('path')

const Database = require('./db')
const Logger = require('./logger')
const Server = require('./server')
const Site = require('./site')

const directives = []

class Vapid {
  constructor(path) {
    this.env = process.env.NODE_ENV || 'development'
    
    this.site = new Site(path)
    this.db = this._initDB()
    this.models = this.db.models
    
    this.directives = directives
    this.log = Logger
  }

  /*********************
    STATIC METHODS
   *********************/
  static registerDirective(name, attrs) {
    directives[name] = attrs
  }

  /*********************
    PUBLIC METHODS
   *********************/
  initSite() {
    this.site.init()
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
}

module.exports = Vapid
