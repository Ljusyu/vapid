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
            <img class="preview" src="<%- value %>">
            <div class="ui checkbox">
              <input type="checkbox" name="<%- name.replace('content', '_destroy') %>">
              <label>Delete</label>
            </div>
          <% } %>
        </div>
      `
    }

    render(value) {
      if (!value) return null

      if (this.options.tag) {
        return `<img src="${value}" class="${this.options.class}" alt="${this.options.alt}">`
      } else {
        return value
      }
    }
  }

  return vapid.registerDirective('image', ImageDirective)
}