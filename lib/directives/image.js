module.exports = (vapid, Directive) => {

  class ImageDirective extends Directive {
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
      return `<img src="${value}" alt="">`
    }
  }

  return vapid.registerDirective('image', ImageDirective)
}