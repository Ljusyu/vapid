const DEFAULTS = {
  options: {
    editor: "wysiwyg"
  }
}

module.exports = (vapid, Directive) => {
  class HTMLDirective extends Directive {
    static get DEFAULTS() {
      return DEFAULTS
    }

    get template() {
      if (this.options.editor == 'wysiwyg') {
        return `
          <input id="<%- name %>" type="hidden" name="<%- name %>" value="<%- value %>">
          <trix-editor input="<%- name %>"></trix-editor>
        `
      } else {
        return `
          <div id="editor"></div>
          <textarea name="<%- name %>"><%- value %></textarea>
        `
      }
    }

    render(value) {
      if (this.options.editor == 'markdown') {
        return require('markdown-it')().render(value)
      } else {
        return value
      }
    }
  }

  return vapid.registerDirective('html', HTMLDirective)
}
