const { resolve } = require('path');
const { sync } = require('glob');

const Template = require('./template');
const Utils = require('./utils');

let Section;
let lastTree;

/**
 * Helps keep the database data structure in sync with the site templates
 */
class Builder {
  /*
   * @param {{Section, templatesDir: string}} options - Section model and template directory
   */
  constructor(options = { Section: undefined, templatesDir: undefined }) {
    ({ Section } = options);
    this.templates = sync(resolve(options.templatesDir, '**/*.html'));
    _initLastTree();
  }

  /**
   * Parses templates and updates the database
   */
  async build() {
    const { tree } = this;
    const existing = [];

    // TODO: Use Promise.all
    /* eslint-disable no-restricted-syntax, no-await-in-loop */
    for (const [name, params] of Object.entries(tree)) {
      const section = await Section.rebuild(name, params);
      existing.push(section.id);
    }
    /* eslint-enable no-restricted-syntax, no-await-in-loop */

    await Section.destroyExceptExisting(existing);
    lastTree = tree;
  }

  /**
   * Determines if tree has changed since last build
   *
   * @todo Cache so this isn't as taxing on the load time
   */
  get isDirty() {
    return !Utils.isEqual(this.tree, lastTree);
  }

  /**
   * Creates the template tree
   *
   * @return {Object}
   */
  get tree() {
    return _createTemplateTree(this.templates);
  }
}

/**
 * @private
 *
 * Crawls templates, and creates object representing the data model
 *
 * @param {array} templates - array of file paths
 * @return {Object} template tree
 *
 * @todo Yuck, this is nasty. Clean it up.
 */
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

/**
 * Initializes the lastTree from Section entries
 */
function _initLastTree() {
  return Section.findAll().then((sections) => {
    lastTree = Utils.reduce(sections, (memo, section) => {
      /* eslint-disable-next-line no-param-reassign */
      memo[section.name] = {
        form: section.form,
        options: section.options,
        fields: section.fields,
      };

      return memo;
    }, {});
  });
}

module.exports = Builder;
