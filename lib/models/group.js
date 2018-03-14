module.exports = (sequelize, DataType) => {
  let Group = sequelize.define('Group', {
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

  Group.prototype.fieldInput = function (fieldName, value) {
    let attrs = this.fields[fieldName]
    return vapid.directives[attrs.type].input(fieldName, value)
  }

  return Group
}