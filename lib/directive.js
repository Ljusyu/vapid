const Utils = require('./utils');

const DEFAULTS = {
  options: {
    label: undefined,
    help: undefined,
  },

  attrs: {
    placeholder: '',
    required: true,
  },
};

class Directive {
  constructor(params) {
    const defaults = Utils.merge({}, DEFAULTS, this.constructor.DEFAULTS || {});
    const [options, attrs] = _parseParams(params, defaults);

    this.options = Utils.merge(defaults.options, options);
    this.attrs = Utils.merge(defaults.attrs, attrs);
  }

  get htmlAttrs() {
    const pairs = Utils.transform(this.attrs, (memo, value, key) => {
      if (value !== undefined && value !== false) {
        memo.push(`${key}="${value}"`);
      }
    }, []);

    return pairs.join(' ');
  }

  input(name, value = '') {
    return `<input type="text" name="${name}" value="${Utils.escape(value)}" ${this.htmlAttrs}>`;
  }

  /* eslint-disable class-methods-use-this */
  render(value) {
    return Utils.escape(value);
  }
  /* eslint-enable class-methods-use-this */

  preview(value) {
    return this.render(value);
  }
}

/*
 * PRIVATE METHODS
 */

function _parseParams(params, defaults) {
  const options = {};
  const attrs = {};

  Utils.each(params, (value, key) => {
    const coerced = Utils.coerceType(value);

    if (Utils.has(defaults.options, key)) {
      options[key] = coerced;
    } else if (Utils.has(defaults.attrs, key)) {
      attrs[key] = coerced;
    }
  });

  return [options, attrs];
}

module.exports = Directive;
