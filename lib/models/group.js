const Sequelize = require('sequelize')
const pluralize = require('pluralize')

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
        return _upperCase(this.name)
      },

      displayNameSingular: function () {
        return pluralize(this.displayName, 1)
      },

      tableColumns: function () {
        return Object.keys(this.fields).map((f) => { return _upperCase(f) })
      },
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

  Group.rebuild = async function(groupName, params) {
    let [group, created] = await vapid.models.Group.findOrCreate({ where: { name: groupName } })
    let repeating = params.options.repeating || pluralize.isPlural(groupName)

    return await group.update({ fields: params.fields, repeating: repeating })
  }

  Group.contentFor = async function (name, tree) {
    let group = await this.findByName(name, { include: 'records' })
    let records = group && group.records || []

    return records.map( record => { return record.contentFor(tree) } )
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

  // TODO: This should probably be in a decorator class, or partial
  Group.prototype.formField = function (fieldName, value) {
    let attrs = this.fields[fieldName]
    let directive = vapid.directive(attrs)
    let required = directive.attrs.required ? "required" : ""

    return `
      <div class="${required} field">
        <label>${fieldName}</label>
        ${directive.input(fieldName, value)}
      </div>
    `
  }

  return Group
}

/*********************
 * PRIVATE METHODS
 *********************/

function _upperCase(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase())
}