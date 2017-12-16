const colors = require('colors')
const arrow = '==>'

module.exports = class Logger {
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