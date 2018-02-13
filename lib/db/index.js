const Sequelize = require('sequelize')

module.exports = async (config, seed = false) => {
  const sequelize = new Sequelize(config)

  sequelize.import('../models/group')
  sequelize.import('../models/record')
  sequelize.import('../models/user')

  sequelize.models.Group.hasMany(sequelize.models.Record)

  await sequelize.sync({ force: seed })

  if (seed) {
    require('./seed')(sequelize.models)
  }

  return sequelize.models
}
