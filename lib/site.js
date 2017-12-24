const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const ejs = require('ejs')

const templateDir = path.join(__dirname, '..', 'template')

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
  constructor (localPath) {
    this.name = path.basename(localPath)
    this.localPath = path.resolve(process.cwd(), localPath)
  }

  /**
   * checks to see if project already exists
   * @return {boolean}
   */
  localExists () {
    return fs.existsSync(this.localPath)
  }

  /**
   * initializes a new local site
   */
  localInitialize () {
    if (this.localExists()) throw 'Target directory already exists.'
    copySiteTemplate(templateDir, this.localPath, { name: this.name })
  }

  /**
   * local site settings
   */
   settings () {
     let settingsPath = path.resolve(this.localPath, 'package.json')
     return require(settingsPath).vapid
   }
}

/**
 * PRIVATE METHODS
 */

function copySiteTemplate(from, to, data) {
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
      copySiteTemplate(fromPath, toPath, data);
    }
  })
}

module.exports = Site
