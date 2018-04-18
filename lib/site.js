const fs = require('fs')
const { basename, extname, resolve } = require('path')
const ejs = require('ejs')
const { sync } = require('glob')
const Template = require('./template')
const Utils = require('./utils')

const pjson = require('../package.json')
const templateDir = resolve(__dirname, '..', 'site_template')

class Site {
  constructor(paths) {
    this.paths = paths
  }

  init() {
    if (this.exists()) throw 'Target directory already exists.'
  
    _copySiteTemplate(templateDir, this.paths.root, { 
      name: basename(this.paths.root),
      package: pjson.name,
      version: pjson.version,
      secret_key: _randomSecretKey()
    })
  }

  exists() {
    return fs.existsSync(this.paths.root)
  }

  async build() {
    let templates = sync(resolve(this.paths.www, '**/*.html'))
    let tree = _createTemplateTree(templates)
    let existing = []

    // Update sections
    for (let [name, params] of Object.entries(tree)) {
      let section = await vapid.models.Section.rebuild(name, params)
      existing.push(section.id)
    }

    vapid.models.Section.destroyExceptExisting(existing)
  }
}

/*******************
 * PRIVATE METHODS
 *******************/

// TODO: Yuck
function _createTemplateTree(templates) {
  let tree = {}

  for (let tpl of templates) {
    let parsed = new Template(tpl).parse()

    for (let [sectionToken, sectionAttrs] of Object.entries(parsed)) {
      let sectionName = sectionAttrs.name

      tree[sectionName] = tree[sectionName] || { options: {}, fields: {} }
      Object.assign(tree[sectionName].options, sectionAttrs.params)

      for (let [fieldToken, fieldAttrs] of Object.entries(sectionAttrs.fields)) {
        let fieldName = fieldAttrs.name
        tree[sectionName].fields[fieldName] = Object.assign({ type: 'text' }, tree[sectionName].fields[fieldName] || {}, fieldAttrs.params)
      }
    }
  }

  return tree
}

function _copySiteTemplate(from, to, data) {
   let filesToCopy = fs.readdirSync(from)

   Utils.mkdirp(to)

   filesToCopy.forEach(file => {
     let fromPath = `${from}/${file}`
     let toPath = `${to}/${file}`
     let stats = fs.statSync(fromPath)

     if (stats.isFile()) {
       let content = fs.readFileSync(fromPath, 'utf8');

       if (extname(fromPath) == '.ejs') {
         toPath = toPath.replace(/\.ejs$/, '')
         content = ejs.render(content, data)
       }

       fs.writeFileSync(toPath, content, 'utf8')
     } else if (stats.isDirectory()) {
       _copySiteTemplate(fromPath, toPath, data);
     }
   })
 }

function _randomSecretKey() {
  return require('crypto').randomBytes(64).toString('hex')
}

module.exports = Site
