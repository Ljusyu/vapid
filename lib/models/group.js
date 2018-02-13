module.exports = (sequelize, DataType) => {
  return sequelize.define('Group', {
    name: DataType.STRING,
    repeating: {
      type: DataType.BOOLEAN,
      defaultValue: false
    },
    fields: DataType.JSON
  })
}