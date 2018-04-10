// TODO: Can't require a checkbox
// Inputs: checkbox, toggle, radio, dropdown (multi-select dropdown?)
// Maybe template should be able to return an array, for inline fields?
const Utils = require('../utils')

const DEFAULTS = {
  options: {
    input: undefined,
    multiple: false,
    options: ""
  }
}

const INPUT_TYPES = [
  'checkbox',
  'toggle',
  'radio',
  'dropdown'
]

module.exports = (vapid, Directive) => {
  class ChoiceDirective extends Directive {
    constructor(params) {
      super(params)
      this.possibilities = _possibilites(this.options.options)
      this.options.input = _determineInputType.call(this)
      this.options.required = this.possibilities.length > 1 && this.options.required ? true : false
    }

    static get DEFAULTS() {
      return DEFAULTS
    }

    // TODO: This is nasty
    input(name, value) {
      if (this.options.input == 'dropdown') {
        return this._dropdown(name, value)
      } else if (this.possibilities <= 1) {
        return this._checkbox(name, value, true)
      } else {
        return Utils.reduce(this.possibilities, (memo, p) => {
          return memo += this._checkbox(name, value, p, p)
        }, '')
      }
    }

    render(value) {
      return Utils.isArray(value) ? value.join(', ') : value
    }

    /*********************
     * PRIVATE METHODS
     *********************/

    _checkbox(name, value, inputValue, label = '') {
      let klass = this.options.input === 'checkbox' ? '' : this.options.input
      let type = this.options.input === 'toggle' ? 'checkbox' : this.options.input
      let checked = (type == 'checkbox' && value) || (value === label) ? 'checked' : ''
      
      return `
        <div class="ui ${klass} checkbox">
          <input type="${type}" name="${name}" value="${inputValue}" ${checked}>
          <label>${label}</label>
        </div>`
    }

    _dropdown(name, value = "") {
      let placeholder = this.attrs.placeholder
      let multiple = this.options.multiple ? 'multiple' : ''
      let values = Utils.isArray(value) ? value : value.split(',')

      let options = Utils.reduce(this.possibilities, (memo, p) => {
        let selected = Utils.includes(values, p) ? 'selected' : ''
        return memo += `<option value="${p}" ${selected}>${p}</option>`
      }, '')

      return `
        <select name="${name}" class="ui dropdown" ${multiple}>
          <option value="">${placeholder}</option>
          ${options}
        </select>`
    }
  }

  _possibilites = function(str) {
    // TODO: Needs a better parser that takes into account quotes, escaped chars etc
    let parts = str.split(',')

    return Utils.chain(parts)
                .map(p => { return Utils.trim(p) })
                .compact()
                .value()
  }

  _determineInputType = function() {
    let input = Utils.includes(INPUT_TYPES, this.options.input) ? this.options.input : null
    let numPossibilities = this.possibilities.length


    if (numPossibilities <= 1) {
      return input == 'toggle' ? 'toggle' : 'checkbox'
    } else if (this.options.multiple) {
      return 'dropdown'
    }

    // If we've gotten this far, radio and dropdown are the only options
    input = Utils.includes(['radio', 'dropdown'], input) ? input : null

    if (numPossibilities <= 3 && !this.options.multiple) {
      return input || 'radio'
    } else {
      return input || 'dropdown'
    }
  }

  return vapid.registerDirective('choice', ChoiceDirective)
}
