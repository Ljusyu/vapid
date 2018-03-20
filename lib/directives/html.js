module.exports = (vapid, Directive) => {
  return vapid.registerDirective('html', {
    template: options => {
      if (options.editor) {
        return `
          <input id="<%- name %>" type="hidden" name="<%- name %>" <%- attributes %> value="<%- value %>">
          <trix-editor input="<%- name %>"></trix-editor>
        `
      } else {
        return `
          <div id="editor"></div>
          <textarea name="<%- name %>" <%- attributes %>><%- value %></textarea>
        `
      }
    },
    
    attributes: {
      rows: undefined
    },
    
    options: {
      editor: true
    }
  })
}