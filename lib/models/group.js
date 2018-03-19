const Sequelize = require('sequelize')

module.exports = (sequelize, DataType) => {
  const Op = Sequelize.Op
  const defaultName = 'general'

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

  /*********************
  * CLASS METHODS
  *********************/
  Group.findGeneral = async function () {
    let [group, created] = await this.findOrCreate({ where: { name: defaultName }})
    return group
  }

  Group.findByName = async function (groupName, options = {}) {
    let query = Object.assign(options, { where: { name: groupName } })
    return await this.findOne(query)
  }

  // TODO: This and record contentFor need to be renamed
  Group.contentFor = async function (name, fieldsQuery) {
    let group = await this.findByName(name, { include: 'records' })
    let records = group && group.records || []

    return records.map( record => { return record.contentFor(fieldsQuery) } )
  }

  Group.destroyExceptExisting = function(existing = []) {
    this.destroy({
      where: {
        id:   { [Op.notIn]: existing }, 
        name: { [Op.ne]: defaultName }
      }
    })
  }

  /*********************
  * INSTANCE METHODS
  *********************/
  Group.prototype.fieldInput = function (fieldName, value) {
    let attrs = this.fields[fieldName]
    return vapid.directives[attrs.type].input(fieldName, value)
  }

  return Group
}