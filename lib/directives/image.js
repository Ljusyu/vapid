const DEFAULTS = {
  options: {
    class: '',
    alt: '',
    tag: true,
  },
};

module.exports = (BaseDirective) => {
  class ImageDirective extends BaseDirective {
    static get DEFAULTS() {
      return DEFAULTS;
    }

    /* eslint-disable class-methods-use-this */
    input(name, value = '') {
      const inputs = `<input type="file" name="${name}" accept="image/*">
                    <input type="hidden" name="${name}" value="${value}">`;
      const preview = !value
        ? ''
        : `<img class="preview" src="/uploads/${value}">
           <div class="ui checkbox">
             <input type="checkbox" name="${name.replace('content', '_destroy')}">
             <label>Delete</label>
           </div>`;

      return `
        <div class="previewable">
          ${inputs}
          ${preview}
        </div>`;
    }
    /* eslint-enable class-methods-use-this */

    render(fileName) {
      if (!fileName) return null;

      if (this.options.tag) {
        return `<img src="/uploads/${fileName}" class="${this.options.class}" alt="${this.options.alt}">`;
      }

      return `/uploads/${fileName}`;
    }
  }

  return ImageDirective;
};
