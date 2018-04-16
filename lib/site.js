const fs = require('fs')
const path = require('path')
const ejs = require('ejs')
const Template = require('./template')
const Utils = require('./utils')

const pjson = require('../package.json')
const templateDir = path.join(__dirname, '..', 'site_template')

/**
 * Primary object for interacting with a site
 * @example
 * let site = new Site('path/to/your/project')
 */
class Site {
  /**
   * @param {string} localPath - the local directory where site files reside
   * @return {Site}
   */
  constructor(localPath) {
    this.paths = _paths(localPath)
  }

  /**
   * initializes a new local site
   */
  init() {
    if (this.exists()) throw 'Target directory already exists.'
  
    _copySiteTemplate(templateDir, this.paths.root, { 
      name: path.basename(this.paths.root),
      package: pjson.name,
      version: pjson.version,
      secret_key: _randomSecretKey()
    })
  }

  /**
   * checks to see if site already exists
   * @return {boolean}
   */
  exists() {
    return fs.existsSync(this.paths.root)
  }

  /**
   * parse site templates, and update the data model
   * TODO: Not sure where this belongs
   */
  async build() {
    let templates = _recursiveDir(this.paths.templates)
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

       if (path.extname(fromPath) == '.ejs') {
         toPath = toPath.replace(/\.ejs$/, '')
         content = ejs.render(content, data)
       }

       fs.writeFileSync(toPath, content, 'utf8')
     } else if (stats.isDirectory()) {
       _copySiteTemplate(fromPath, toPath, data);
     }
   })
 }

function _paths(rootPath) {
  return {
    root: rootPath,
    public: path.join(rootPath, 'public'),
    templates: path.join(rootPath, 'templates')
  }
}

function _recursiveDir(dir, filelist = []) {
  let files = fs.readdirSync(dir)

  files.forEach(file => {
    let path = `${dir}/${file}`
    if (fs.statSync(path).isDirectory()) {
      filelist = _recursiveDir(path, filelist)
    } else if (!/^\..*/.test(file)) {
      filelist.push(path)
    }
  })

  return filelist
}

function _randomSecretKey() {
  return require('crypto').randomBytes(64).toString('hex')
}

module.exports = Site
