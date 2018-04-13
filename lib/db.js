const path = require('path')
const Sequelize = require('sequelize')
const Umzug = require('umzug')
const Utils = require('./utils')

const DEFAULT_CONFIG = {
  logging: false,
  operatorsAliases: Sequelize.Op
}

class Database {
  constructor(config) {   
    this.config = Utils.merge(DEFAULT_CONFIG, config) 
    this.sequelize = this.initSequelize()
    this.models = this.defineModels()
    this.migrations = this.initMigrations()
  }

  defineModels() {
    let Section = this.sequelize.import('./models/section')
    let Record = this.sequelize.import('./models/record')
    let User = this.sequelize.import('./models/user')

    Section.hasMany(Record, { as: 'records' })
    Record.belongsTo(Section, { as: 'section' })

    return {
      Section: Section,
      Record: Record,
      User: User
    }
  }

  initSequelize() {
    if (process.env.DATABASE_URL) {
      let dbURL = process.env.DATABASE_URL
      let dialect = dbURL.split(':')[0]
      let config = Utils.merge(this.config, { dialect: dialect })

      return new Sequelize(dbURL, config) 
    } else {
      return new Sequelize(this.config)
    }
  }

  initMigrations() {
    return new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: this.sequelize,
      },
      migrations: {
        params: [this.sequelize.getQueryInterface(), Sequelize],
        path: path.join(__dirname, 'migrations'),
        pattern: /\.js$/
      }
    })
  }

  async connect() {
    await this.sequelize.sync()
    await this.migrations.up()
  }

  async disconnect() {
    await this.sequelize.close()
  }
}

module.exports = Database
