const fs = require('fs');
const ejs = require('ejs');
const { resolve } = require('path');
const Boom = require('boom');
const { Op } = require('sequelize');
const Utils = require('../utils');

// TODO: Figure out why subQuery in contentFor *needs* a limit
const DEFAULTS = {
  name: 'general',
  limit: 1000,
};

module.exports = (sequelize, DataType) => {
  const Section = sequelize.define('Section', {
    name: DataType.STRING,

    form: {
      type: DataType.BOOLEAN,
      defaultValue: false,
    },

    multiple: {
      type: DataType.BOOLEAN,
      defaultValue: false,
    },

    options: {
      type: DataType.JSON,
      defaultValue: {},
    },

    fields: {
      type: DataType.JSON,
      defaultValue: {},
    },
  }, {
    getterMethods: {
      label: function label() {
        return this.options.label || Utils.startCase(this.name);
      },

      labelSingular: function labelSingular() {
        return Utils.singularize(this.label);
      },

      tableColumns: function tableColumns() {
        return Utils.keys(this.fields).slice(0, 3);
      },

      tableColumnsHeaders: function tableColumnsHeaders() {
        return this.tableColumns.map(key => this.fields[key].label || Utils.startCase(key));
      },

      hasFields: function hasFields() {
        return Object.keys(this.fields).length > 0;
      },
    },

    scopes: {
      content: {
        where: { form: false },
      },

      forms: {
        where: { form: true },
      },
    },

    underscored: true,
  });

  /*********************
  * CLASS METHODS
  *********************/

  Section.findGeneral = async function findGeneral() {
    const [section] = await this.findOrCreate({ where: { name: DEFAULTS.name } });
    return section;
  };

  Section.findByName = async function findByName(name, options = {}) {
    const query = Object.assign(options, { where: { name } });
    return this.findOne(query);
  };

  Section.rebuild = async function rebuild(name, params) {
    const [section] = await this.findOrCreate({ where: { name } });
    const fields = vapid.models.Record.removeSpecialFields(params.fields);
    const multiple = params.options.multiple || Utils.isPlural(name);

    return section.update({
      form: params.form,
      options: params.options,
      multiple,
      fields,
    });
  };

  // TODO: Break this up into subroutines
  Section.contentFor = async function contentFor(args, recordId) {
    const [limit, where, order] = (() => {
      if (recordId) {
        return [1, { id: recordId }, null];
      }

      return [args.params.limit || DEFAULTS.limit, {}, _orderBy(args.params.order)];
    })();

    const section = await this.findByName(args.name, {
      include: [{
        association: 'records',
        where,
        limit,
        order,
      }],
    });

    if (args.keyword === 'form') {
      const options = args.params;
      const formTemplate = fs.readFileSync(resolve(vapid.root, 'views/records/_form_email.ejs'), 'utf8');
      const fields = Utils.reduce(args.fields, (memo, value) => {
        /* eslint-disable-next-line no-param-reassign */
        memo[value.name] = value.params;
        return memo;
      }, {});
      let { recipient } = options;

      if (!recipient) {
        const user = await vapid.models.User.findOne();
        recipient = user ? user.email : null;
      }

      // TODO: This should iterate over args.fields, not section.fields,
      //       so livereload works
      return ejs.render(formTemplate, {
        section: vapid.models.Section,
        subject: options.subject,
        next: options.next,
        fields,
        recipient,
      });
    }

    const records = (section && section.records) || [];

    if (recordId && records.length === 0) {
      throw Boom.notFound(`Record #${recordId} not found`);
    }

    return Promise.all(records.map(async record => record.contentFor(args.fields)));
  };

  Section.destroyExceptExisting = function destroyExceptExisting(existing = []) {
    this.destroy({
      where: {
        id: { [Op.notIn]: existing },
        name: { [Op.ne]: DEFAULTS.name },
      },
    });
  };

  /*********************
   * INSTANCE METHODS
   *********************/

  // TODO: This should probably be in a decorator class, or partial
  Section.formField = function formField(fieldName, params, value, error) {
    const directive = vapid.directive(params);
    const requiredClass = directive.attrs.required ? 'required ' : '';
    const errorClass = error ? 'error ' : '';

    return `
      <div class="${requiredClass}${errorClass}field">
        <label>${params.label || Utils.startCase(fieldName)}</label>
        ${directive.input(`content[${fieldName}]`, value)}
        <small>${error || params.help || ''}</small>
      </div>`;
  };
  Section.prototype.formField = Section.formField;

  /*********************
   * PRIVATE METHODS
   *********************/

  function _orderBy(str = '') {
    const order = [];

    str.split(/,/).filter(s => s).forEach((s) => {
      const [, negate, fieldName] = s.match(/(-?)(.*)/);
      const direction = negate ? 'DESC' : 'ASC';
      order.push([sequelize.json(`content.${fieldName}`), direction]);
    });

    return order;
  }

  return Section;
};
