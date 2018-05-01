const { resolve } = require('path');
const { sync } = require('glob');

const Template = require('./template');

let Section;

class Builder {
  constructor(options = { Section: undefined, templatesDir: undefined }) {
    ({ Section } = options);
    this.templatesDir = options.templatesDir;
  }

  async build() {
    const templates = sync(resolve(this.templatesDir, '**/*.html'));
    const tree = _createTemplateTree(templates);
    const existing = [];

    // Update sections
    // TODO: Use Promise.all
    /* eslint-disable no-restricted-syntax, no-await-in-loop */
    for (const [name, params] of Object.entries(tree)) {
      const section = await Section.rebuild(name, params);
      existing.push(section.id);
    }
    /* eslint-enable no-restricted-syntax, no-await-in-loop */

    await Section.destroyExceptExisting(existing);
  }
}

/*
 * PRIVATE METHODS
 */

// TODO: Yuck
/* eslint-disable no-restricted-syntax */
function _createTemplateTree(templates) {
  const tree = {};

  for (const tpl of templates) {
    const parsed = Template.fromFile(tpl).parse();

    for (const [, sectionAttrs] of Object.entries(parsed)) {
      const sectionName = sectionAttrs.name;

      tree[sectionName] = tree[sectionName] || { form: false, options: {}, fields: {} };
      Object.assign(tree[sectionName].options, sectionAttrs.params);
      tree[sectionName].form = tree[sectionName].form || sectionAttrs.keyword === 'form';

      for (const [, fieldAttrs] of Object.entries(sectionAttrs.fields)) {
        const fieldName = fieldAttrs.name;
        tree[sectionName].fields[fieldName] = Object.assign({ type: 'text' }, tree[sectionName].fields[fieldName] || {}, fieldAttrs.params);
      }
    }
  }

  return tree;
}
/* eslint-enable no-restricted-syntax */

module.exports = Builder;