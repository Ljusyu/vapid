const Boom = require('boom')
const Sequelize = require('sequelize')
const Utils = require('../utils')

let DEFAULTS = {
  groupName: 'general',
  limit: -1
}

module.exports = (sequelize, DataType) => {
  const Op = Sequelize.Op

  let Group = sequelize.define('Group', {
    name: DataType.STRING,
    repeating: {
      type: DataType.BOOLEAN,
      defaultValue: false
    },
    options: {
      type: DataType.JSON,
      defaultValue: {}
    },
    fields: {
      type: DataType.JSON,
      defaultValue: {}
    }
  }, {
    getterMethods: {
      label: function () {
        return Utils.startCase(this.options.label || this.name)
      },

      labelSingular: function () {
        return Utils.singularize(this.label)
      },

      tableColumns: function () {
        return Object.keys(this.fields).map((f) => { return Utils.startCase(f) })
      },

      hasFields: function () {
        return Object.keys(this.fields).length > 0
      }
    },
    underscored: true
  })

  /*********************
  * CLASS METHODS
  *********************/

  Group.findGeneral = async function () {
    let [group, created] = await this.findOrCreate({ where: { name: DEFAULTS.groupName }})
    return group
  }

  Group.findByName = async function (groupName, options = {}) {
    let query = Object.assign(options, { where: { name: groupName } })
    return await this.findOne(query)
  }

  Group.rebuild = async function(groupName, params) {
    let [group, created] = await vapid.models.Group.findOrCreate({ where: { name: groupName } })
    let fields = vapid.models.Record.removeSpecialFields(params.fields)
    let repeating = params.options.repeating || Utils.isPlural(groupName)

    return await group.update({ options: params.options, fields: fields, repeating: repeating })
  }

  Group.contentFor = async function (args, recordId) {
    let [limit, where, order] = (() => {
      if (recordId) {
        return [1, { id: recordId }, null]
      } else {
        return [args.params.limit || DEFAULTS.limit, {}, _orderBy(args.params.order)]
      }
    })()

    let group = await this.findByName(args.name, {
      include: [{
        association: 'records',
        where: where,
        limit: limit,
        order: order
      }]
    })
    let records = group && group.records || []

    if (recordId && records.length == 0) {
      throw Boom.notFound(`Record #${recordId} not found`)
    }

    return records.map( record => { return record.contentFor(args.fields) } )
  }

  Group.destroyExceptExisting = function(existing = []) {
    this.destroy({
      where: {
        id:   { [Op.notIn]: existing }, 
        name: { [Op.ne]: DEFAULTS.groupName }
      }
    })
  }

  /*********************
   * INSTANCE METHODS
   *********************/

  // TODO: This should probably be in a decorator class, or partial
  Group.prototype.formField = function (fieldName, value) {
    let params = this.fields[fieldName]
    let directive = vapid.directive(params)
    let required = directive.attrs.required ? "required" : ""

    return `
      <div class="${required} field">
        <label>${Utils.startCase(params.label || fieldName)}</label>
        ${directive.input(fieldName, value)}
        <small>${params.help || ""}</small>
      </div>
    `
  }

  /*********************
   * PRIVATE METHODS
   *********************/

  function _orderBy(str = "") {
    let order = []

    str.split(/,/).filter((s) => s).forEach(s => {
      let [orig, negate, fieldName] = s.match(/(-?)(.*)/)
      let direction = negate ? 'DESC' : 'ASC' 
      order.push([sequelize.json(`content.${fieldName}`), direction])
    })

    return order
  }

  return Group
}
