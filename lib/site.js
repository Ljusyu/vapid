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

    for (let [name, attrs] of Object.entries(tree)) {
      let [group, created] = await vapid.models.Group.findOrCreate({ where: { name: name }})
      await group.update({ fields: attrs.fields })
    }
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

    for (let [token, attrs] of Object.entries(parsed)) {
      let groupName = attrs.name
      
      tree[groupName] = tree[groupName] || { options: {}, fields: {} }
      Object.assign(tree[groupName].options, attrs.attributes)

      for (field of attrs.fields) {
        tree[groupName].fields[field.name] = Object.assign({ type: 'text' }, tree[groupName].fields[field.name] || {}, field.attributes)
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
