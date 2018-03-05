module.exports = (sequelize, DataType) => {
  return sequelize.define('Group', {
    name: DataType.STRING,
    repeating: {
      type: DataType.BOOLEAN,
      defaultValue: false
    },
    fields: DataType.JSON
  }, {
    getterMethods: {
      displayName: function () {
        return this.name.replace(/\b\w/g, l => l.toUpperCase())
      }
    },

    // TODO: Is there way to delcare this universally, for all models?
    underscored: true
  })
}