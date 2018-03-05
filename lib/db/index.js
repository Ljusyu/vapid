const Sequelize = require('sequelize')

class Database {
  constructor(config) {
    // TODO: Tie important SQL logs/errors into Logger?
    this.config = Object.assign({}, config, { logging: false })
    this.sequelize = new Sequelize(this.config)
    this.models = this.defineModels()
  }

  defineModels() {
    let Group = this.sequelize.import('../models/group')
    let Record = this.sequelize.import('../models/record')
    let User = this.sequelize.import('../models/user')

    Group.hasMany(Record, { as: 'records' })

    return {
      Group: Group,
      Record: Record,
      User: User
    }
  }

  async connect(seed = false) {
    await this.sequelize.sync({ force: seed })
    if (seed) {
      require('./seed')(this.sequelize.models)
    }
  }

  disconnect() {
    this.sequelize.close()
  }
}

module.exports = Database
