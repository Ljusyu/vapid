const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const ejs = require('ejs')
const Template = require('./template')

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
      version: pjson.version
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
   * local site settings
   */
  settings() {
    let settingsFile = path.resolve(this.paths.root, 'package.json')
    return settingsFile ? require(settingsFile).vapid : null
  }

  /**
   * parse site templates, and update the data model
   * TODO: Not sure where this belongs
   */
  async build() {
    let templates = _recursiveDir(this.paths.templates)
    let tree = _createTemplateTree(templates)
    let existing = []

    // Update groups
    for (let [name, params] of Object.entries(tree)) {
      let group = await vapid.models.Group.rebuild(name, params)
      existing.push(group.id)
    }

    vapid.models.Group.destroyExceptExisting(existing)
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

    for (let [groupToken, groupAttrs] of Object.entries(parsed)) {
      let groupName = groupAttrs.name

      tree[groupName] = tree[groupName] || { options: {}, fields: {} }
      Object.assign(tree[groupName].options, groupAttrs.params)

      for (let [fieldToken, fieldAttrs] of Object.entries(groupAttrs.fields)) {
        let fieldName = fieldAttrs.name
        tree[groupName].fields[fieldName] = Object.assign({ type: 'text' }, tree[groupName].fields[fieldName] || {}, fieldAttrs.params)
      }
    }
  }

  return tree
}

function _copySiteTemplate(from, to, data) {
   let filesToCopy = fs.readdirSync(from)

   mkdirp.sync(to)

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
    assets: path.join(rootPath, 'assets'),
    templates: path.join(rootPath, 'templates'),
    uploads: path.join(rootPath, 'uploads')
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

module.exports = Site
