// TODO: Can't require a checkbox
// Inputs: checkbox, toggle, radio, dropdown (multi-select dropdown?)
// Maybe template should be able to return an array, for inline fields?
const Utils = require('../utils');

const DEFAULTS = {
  options: {
    input: undefined,
    multiple: false,
    options: '',
  },
};

const INPUT_TYPES = [
  'checkbox',
  'toggle',
  'radio',
  'dropdown',
];

module.exports = (BaseDirective) => {
  class ChoiceDirective extends BaseDirective {
    constructor(params) {
      super(params);
      this.possibilities = _possibilites(this.options.options);
      this.options.input = _determineInputType.call(this);
      this.attrs.required = this.possibilities.length > 1 && this.attrs.required;
    }

    static get DEFAULTS() {
      return DEFAULTS;
    }

    // TODO: This is nasty
    input(name, value) {
      if (this.options.input === 'dropdown') {
        return this._dropdown(name, value);
      } else if (this.possibilities <= 1) {
        return this._checkbox(name, value, true);
      }

      return Utils.reduce(this.possibilities, (memo, p) => memo + this._checkbox(name, value, p, p), '');
    }

    /* eslint-disable class-methods-use-this */
    render(value) {
      return Utils.isArray(value) ? value.join(', ') : value;
    }
    /* eslint-enable class-methods-use-this */

    get required() {
      return this.attrs.required ? 'required=true' : '';
    }

    /*
     * PRIVATE METHODS
     */

    _checkbox(name, value, inputValue, label = '') {
      const klass = this.options.input === 'checkbox' ? '' : this.options.input;
      const type = this.options.input === 'toggle' ? 'checkbox' : this.options.input;
      const checked = (type === 'checkbox' && value) || (value === label) ? 'checked' : '';

      return `
        <div class="ui ${klass} checkbox">
          <input type="${type}" name="${name}" value="${inputValue}" ${checked} ${this.required}>
          <label>${label}</label>
        </div>`;
    }

    _dropdown(name, value = '') {
      const { placeholder } = this.attrs;
      const multiple = this.options.multiple ? 'multiple' : '';
      const values = Utils.isArray(value) ? value : value.split(',');

      const options = Utils.reduce(this.possibilities, (memo, p) => {
        const selected = Utils.includes(values, p) ? 'selected' : '';
        const option = `<option value="${p}" ${selected}>${p}</option>`;
        return memo + option;
      }, '');

      return `
        <select name="${name}" class="ui dropdown" ${multiple} ${this.required}>
          <option value="">${placeholder}</option>
          ${options}
        </select>`;
    }
  }

  function _possibilites(str) {
    // TODO: Needs a better parser that takes into account quotes, escaped chars etc
    const parts = str.split(',');

    return Utils.chain(parts)
      .map(p => Utils.trim(p))
      .compact()
      .value();
  }

  function _determineInputType() {
    let input = Utils.includes(INPUT_TYPES, this.options.input) ? this.options.input : null;
    const numPossibilities = this.possibilities.length;


    if (numPossibilities <= 1) {
      return input === 'toggle' ? 'toggle' : 'checkbox';
    } else if (this.options.multiple) {
      return 'dropdown';
    }

    // If we've gotten this far, radio and dropdown are the only options
    input = Utils.includes(['radio', 'dropdown'], input) ? input : null;

    if (numPossibilities <= 3 && !this.options.multiple) {
      return input || 'radio';
    }

    return input || 'dropdown';
  }

  return ChoiceDirective;
};
