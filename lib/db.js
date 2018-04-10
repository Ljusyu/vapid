const path = require('path')
const Sequelize = require('sequelize')
const Umzug = require('umzug')

class Database {
  constructor(config) {
    // TODO: Tie important SQL logs/errors into Logger?
    this.config = Object.assign({}, config, {
      logging: false,
      operatorsAliases: Sequelize.Op
    })
    
    this.sequelize = new Sequelize(this.config)
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

  initMigrations() {
    return new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: this.sequelize,
      },
      migrations: {
        params: [this.sequelize.getQueryInterface(), this.sequelize.constructor, function() {
            throw new Error('Migration tried to use old style "done" callback. Please upgrade to "umzug" and return a promise instead.');
        }],
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
