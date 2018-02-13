const fs = require('fs')
const mkdirp = require('mkdirp')
const path = require('path')
const ejs = require('ejs')

const db = require('./db')
const pjson = require('../package.json')
const Logger = require('./logger')
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
    this.name = path.basename(localPath)
    this.localPath = path.resolve(process.cwd(), localPath)
    this.db = db({
      dialect: 'sqlite',
      storage: path.join(this.localPath, 'db', 'development.sqlite')
    }, true)
  }

  /**
   * checks to see if project already exists
   * @return {boolean}
   */
  localExists() {
    return fs.existsSync(this.localPath)
  }

  /**
   * initializes a new local site
   */
  localInitialize() {
    if (this.localExists()) throw 'Target directory already exists.'
  
    copySiteTemplate(templateDir, this.localPath, { 
      name: this.name,
      package: pjson.name,
      version: pjson.version
    })
  }

  /**
   * local site settings
   */
   settings() {
     let settingsPath = path.resolve(this.localPath, 'package.json')
     return require(settingsPath).vapid
   }

   async initDB() {
    const sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: path.join(this.localPath, 'db', 'development.sqlite')
    })

    const Group = await sequelize.define('group', {
      name: Sequelize.STRING,
      repeating: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      fields: Sequelize.JSON
    }).sync({ force: true })

    let zoom = ["one", "two",]
    let user = await Group.create({ 
      // where: {
        name: "default",
        fields: { hello: "world", list: { foo: "bar", zoom: "bah" }, zoom: zoom }
      // }
    })

    Group.findAll().then(groups => {
      console.log(groups[0].fields)
    })
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
