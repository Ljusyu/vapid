module.exports = (vapid, Directive) => {

  class ImageDirective extends Directive {
    static get DEFAULTS() {
      return {
        options: {
          class: "",
          alt: "",
          tag: true
        }
      }
    }

    get template() {
      return `
        <div class="previewable">
          <input type="file" name="<%- name %>" accept="image/*" <%- attrs %>">
          <input type="hidden" name="<%- name %>" value="<%- value %>">
          <% if (value) { %>
            <img class="preview" src="/uploads/<%- value %>">
            <div class="ui checkbox">
              <input type="checkbox" name="<%- name.replace('content', '_destroy') %>">
              <label>Delete</label>
            </div>
          <% } %>
        </div>
      `
    }

    render(fileName) {
      if (!fileName) return null

      if (this.options.tag) {
        return `<img src="/uploads/${fileName}" class="${this.options.class}" alt="${this.options.alt}">`
      } else {
        return `/uploads/${fileName}`
      }
    }
  }

  return vapid.registerDirective('image', ImageDirective)
}