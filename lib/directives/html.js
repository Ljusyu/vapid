module.exports = (vapid, Directive) => {

  class HTMLDirective extends Directive {
    static get DEFAULTS() {
      return {
        options: {
          editor: true
        }
      }
    }

    get template() {
      if (this.options.editor) {
        return `
          <input id="<%- name %>" type="hidden" name="<%- name %>" <%- attrs %> value="<%- value %>">
          <trix-editor input="<%- name %>"></trix-editor>
        `
      } else {
        return `
          <div id="editor"></div>
          <textarea name="<%- name %>" <%- attrs %>><%- value %></textarea>
        `
      }
    }
  }

  return vapid.registerDirective('html', HTMLDirective)
}