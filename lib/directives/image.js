const DEFAULTS = {
  options: {
    class: "",
    alt: "",
    tag: true
  }
}

module.exports = (vapid, Directive) => {
  class ImageDirective extends Directive {
    static get DEFAULTS() {
      return DEFAULTS
    }

    input(name, value = "") {
      let inputs = `<input type="file" name="${name}" accept="image/*">
                    <input type="hidden" name="${name}" value="${value}">`
      let preview = !value 
                    ? "" 
                    : `<img class="preview" src="/uploads/${value}">
                       <div class="ui checkbox">
                         <input type="checkbox" name="${name.replace('content', '_destroy')}">
                         <label>Delete</label>
                       </div>`

      return `
        <div class="previewable">
          ${inputs}
          ${preview}
        </div>`
    }

    render(fileName) {
      if (!fileName) return

      if (this.options.tag) {
        return `<img src="/uploads/${fileName}" class="${this.options.class}" alt="${this.options.alt}">`
      } else {
        return `/uploads/${fileName}`
      }
    }
  }

  return vapid.registerDirective('image', ImageDirective)
}
