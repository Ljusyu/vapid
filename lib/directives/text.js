module.exports = (vapid, Directive) => {
  class TextDirective extends Directive {
    static get DEFAULTS() {
      return {
        attrs: {
          maxlength: undefined
        }
      }
    }
  }

  return vapid.registerDirective('text', TextDirective)
}