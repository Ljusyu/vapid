const Sequelize = require('sequelize')

module.exports = (config, seed = false) => {
  const sequelize = new Sequelize(config)

  let Group = sequelize.import('../models/group')
  let Record = sequelize.import('../models/record')
  let User = sequelize.import('../models/user')

  Group.hasMany(Record, { as: 'records' })

  sequelize.sync({ force: seed }).then(() => {
    if (seed) {
      require('./seed')(sequelize.models)
    }
  })

  return {
    Group: Group,
    Record: Record,
    User: User
  }
}
