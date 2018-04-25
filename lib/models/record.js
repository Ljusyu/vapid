const Utils = require('../utils');

const SPECIAL_FIELDS = {
  _id: null,
  _created_at: { type: 'date', time: true },
  _updated_at: { type: 'date', time: true },
  _permalink: null,
};

module.exports = (sequelize, DataType) => {
  const Record = sequelize.define('Record', {
    content: {
      type: DataType.JSON,

      defaultValue: {},

      validate: {
        fields(content) {
          const errors = Utils.reduce(this.section.fields, (memo, params, name) => {
            const directive = vapid.directive(params);

            if (directive.attrs.required && !content[name]) {
              /* eslint-disable-next-line no-param-reassign */
              memo[name] = 'required field';
            }

            return memo;
          }, {});

          if (!Utils.isEmpty(errors)) {
            throw new Error(JSON.stringify(errors));
          }
        },
      },
    },
  }, {
    getterMethods: {
      permalink() {
        const section = this.get('section');
        const slug = Utils.kebabCase(this.content.title || this.content.name);

        if (section.multiple) {
          const path = Utils.compact([
            section.name,
            this.id,
            slug,
          ]).join('/');
          return `/${path}`;
        }

        return null;
      },
    },

    hooks: {
      beforeFind: (options) => {
        // Need for permalink getter
        /* eslint-disable-next-line no-param-reassign */
        options.include = options.include || [{ all: true }];
      },
    },

    underscored: true,
  });

  /*********************
  * CLASS METHODS
  *********************/

  Record.removeSpecialFields = function removeSpecialFields(fields) {
    return Utils.pickBy(fields, (params, token) => !Utils.startsWith(token, '_'));
  };

  Record.addHooks = function addHooks(hooks, fn) {
    Utils.each(hooks, (hook) => {
      this.addHook(hook, 'registeredHooks', fn);
    });
  };

  Record.removeHooks = function removeHooks(hooks) {
    Utils.each(hooks, (hook) => {
      this.removeHook(hook, 'registeredHooks');
    });
  };

  /*********************
   * INSTANCE METHODS
   *********************/

  Record.prototype.contentFor = async function contentFor(args) {
    const content = {};

    /* eslint-disable no-restricted-syntax */
    for (const [token, field] of Object.entries(args)) {
      const { name } = field;
      let { params } = field;
      let value;
      let directive;

      if (Utils.has(SPECIAL_FIELDS, name)) {
        value = this.get(name.slice(1));
        params = Utils.assign({}, SPECIAL_FIELDS[name], params);

        if (params.type) {
          directive = vapid.directive(params);
          content[token] = directive.render(value);
        } else {
          content[token] = value;
        }
      } else {
        value = this.content[name];
        directive = vapid.directive(params);

        // TODO: Fix the need for eslint-disable
        /* eslint-disable-next-line no-await-in-loop */
        content[token] = await directive.render(value);
      }
    }
    /* eslint-enable no-restricted-syntax */

    return content;
  };

  Record.prototype.previewContent = function previewContent(fieldName, section) {
    const directive = vapid.directive(section.fields[fieldName]);
    const rendered = directive.preview(this.content[fieldName]);

    return Utils.truncate(rendered, { length: 140 });
  };

  /*********************
  * CLASS CONSTANTS
  *********************/

  Record.SPECIAL_FIELDS = SPECIAL_FIELDS;

  return Record;
};
