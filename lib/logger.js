const colors = require('colors')
const arrow = '==>'

class Logger {
  /**
   * @param {string} str
   */
  static info(str) {
    console.log(`${arrow.blue} ${str}`.bold)
  }

  /**
   * @param {string} err
   */
  static error(err) {
    console.log(`ERROR: ${err}`.bold.red)
    
    if (vapid.env == 'development') {
      console.trace(err)
    }
  }

  /**
   * @param {string|array} lines
   */
  static extra(lines) {
    for (let line of [].concat(lines)) {
      console.log(line)
    }
  }
}

module.exports = Logger
