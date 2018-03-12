const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const ejs = require('ejs')

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
    this.paths = this._paths(localPath)
  }

  /**
   * initializes a new local site
   */
  init() {
    if (this.exists()) throw 'Target directory already exists.'
  
    this._copySiteTemplate(templateDir, this.paths.root, { 
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

   /*******************
    * PRIVATE METHODS
    *******************/

   _copySiteTemplate(from, to, data) {
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
         this._copySiteTemplate(fromPath, toPath, data);
       }
     })
   }

   _paths(rootPath) {
    return {
      root: rootPath,
      assets: path.join(rootPath, 'assets'),
      templates: path.join(rootPath, 'templates'),
      uploads: path.join(rootPath, 'uploads')
    }
  }
}

module.exports = Site
