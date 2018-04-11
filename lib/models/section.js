const Boom = require('boom')
const Sequelize = require('sequelize')
const Utils = require('../utils')

let DEFAULTS = {
  name: 'general',
  limit: -1
}

module.exports = (sequelize, DataType) => {
  const Op = Sequelize.Op

  let Section = sequelize.define('Section', {
    name: DataType.STRING,
    multiple: {
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
        return this.options.label || Utils.startCase(this.name)
      },

      labelSingular: function () {
        return Utils.singularize(this.label)
      },

      tableColumns: function () {
        return Utils.chain(this.fields)
                    .map((value, key) => {
                      return Utils.startCase(key)
                    })
                    .slice(0,3)
                    .value()
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

  Section.findGeneral = async function () {
    let [section, created] = await this.findOrCreate({ where: { name: DEFAULTS.name }})
    return section
  }

  Section.findByName = async function (name, options = {}) {
    let query = Object.assign(options, { where: { name: name } })
    return await this.findOne(query)
  }

  Section.rebuild = async function(name, params) {
    let [section, created] = await this.findOrCreate({ where: { name: name } })
    let fields = vapid.models.Record.removeSpecialFields(params.fields)
    let multiple = params.options.multiple || Utils.isPlural(name)

    return await section.update({ options: params.options, fields: fields, multiple: multiple })
  }

  Section.contentFor = async function (args, recordId) {
    let [limit, where, order] = (() => {
      if (recordId) {
        return [1, { id: recordId }, null]
      } else {
        return [args.params.limit || DEFAULTS.limit, {}, _orderBy(args.params.order)]
      }
    })()

    let section = await this.findByName(args.name, {
      include: [{
        association: 'records',
        where: where,
        limit: limit,
        order: order
      }]
    })
    let records = section && section.records || []

    if (recordId && records.length == 0) {
      throw Boom.notFound(`Record #${recordId} not found`)
    }

    return Promise.all(records.map(async record => { return await record.contentFor(args.fields) }))
  }

  Section.destroyExceptExisting = function(existing = []) {
    this.destroy({
      where: {
        id:   { [Op.notIn]: existing }, 
        name: { [Op.ne]: DEFAULTS.name }
      }
    })
  }

  /*********************
   * INSTANCE METHODS
   *********************/

  // TODO: This should probably be in a decorator class, or partial
  Section.prototype.formField = function (fieldName, value, error) {
    let params = this.fields[fieldName]
    let directive = vapid.directive(params)
    let requiredClass = directive.options.required ? "required " : ""
    let errorClass = error ? "error " : ""

    return `
      <div class="${requiredClass}${errorClass}field">
        <label>${params.label || Utils.startCase(fieldName)}</label>
        ${directive.input(`content[${fieldName}]`, value)}
        <small>${error || params.help || ""}</small>
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

  return Section
}
