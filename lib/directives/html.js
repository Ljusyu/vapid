const markdown = require('markdown-it');
const sanitizeHtml = require('sanitize-html');

const DEFAULTS = {
  options: {
    editor: 'wysiwyg',
  },
};

module.exports = (vapid, Directive) => {
  class HTMLDirective extends Directive {
    static get DEFAULTS() {
      return DEFAULTS;
    }

    input(name, value = '') {
      // TODO: Maybe a help link to a Markdown cheat sheet?
      switch (this.options.editor) {
        case 'wysiwyg':
          return `
            <input id="${name}" type="hidden" name="${name}" value="${value}">
            <trix-editor input="${name}"></trix-editor>`;
        default:
          return `
            <div class="ace_editor"></div>
            <textarea name="${name}">${value}</textarea>`;
      }
    }

    render(value) {
      if (this.options.editor === 'markdown') {
        return markdown({
          html: true,
          breaks: true,
        }).render(value);
      }

      return value;
    }

    preview(value) {
      const dirty = this.render(value);
      return sanitizeHtml(dirty, { allowedTags: [] });
    }
  }

  return vapid.registerDirective('html', HTMLDirective);
};
