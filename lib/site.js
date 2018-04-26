const fs = require('fs');
const { basename, extname, resolve } = require('path');
const { randomBytes } = require('crypto');
const ejs = require('ejs');
const { sync } = require('glob');
const Boom = require('boom');
const Template = require('./template');
const Utils = require('./utils');
const pjson = require('../package.json');

const templateDir = resolve(__dirname, '..', 'site_template');

class Site {
  constructor(paths) {
    this.paths = paths;
  }

  init() {
    if (this.exists()) {
      throw new Boom('Target directory already exists.');
    }

    _copySiteTemplate(templateDir, this.paths.root, {
      name: basename(this.paths.root),
      package: pjson.name,
      version: pjson.version,
      secret_key: _randomSecretKey(),
    });
  }

  exists() {
    return fs.existsSync(this.paths.root);
  }

  async build() {
    const templates = sync(resolve(this.paths.www, '**/*.html'));
    const tree = _createTemplateTree(templates);
    const existing = [];

    // Update sections
    // TODO: Use Promise.all
    /* eslint-disable no-restricted-syntax, no-await-in-loop */
    for (const [name, params] of Object.entries(tree)) {
      const section = await vapid.models.Section.rebuild(name, params);
      existing.push(section.id);
    }
    /* eslint-enable no-restricted-syntax, no-await-in-loop */

    vapid.models.Section.destroyExceptExisting(existing);
  }
}

/*******************
 * PRIVATE METHODS
 *******************/

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

function _copySiteTemplate(from, to, data) {
  const filesToCopy = fs.readdirSync(from);

  Utils.mkdirp(to);

  filesToCopy.forEach((file) => {
    let toPath = `${to}/${file}`;
    const fromPath = `${from}/${file}`;
    const stats = fs.statSync(fromPath);

    if (stats.isFile()) {
      let content = fs.readFileSync(fromPath, 'utf8');

      if (extname(fromPath) === '.ejs') {
        toPath = toPath.replace(/\.ejs$/, '');
        content = ejs.render(content, data);
      }

      fs.writeFileSync(toPath, content, 'utf8');
    } else if (stats.isDirectory()) {
      _copySiteTemplate(fromPath, toPath, data);
    }
  });
}

function _randomSecretKey() {
  return randomBytes(64).toString('hex');
}

module.exports = Site;
