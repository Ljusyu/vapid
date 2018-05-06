const { resolve } = require('path');
const writePkg = require('write-pkg');
const netrc = require('netrc');
const url = require('url');

const Utils = require('./utils');

// const { site } = vapid.config;

// if (!site) {
//   const pjsonPath = resolve(vapid.paths.root, 'package.json');
//   let pjson = require(pjsonPath);

//   Logger.info("Creating a new site...");
//   pjson.vapid.site = 'abc123';
//   writePkg.sync(pjsonPath, pjson);
// }

// // Not sure why this doesn't exit on it's own
// process.exit(0);

const apiURL = process.env.API_URL || "https://api.hellovapid.com";
const apiHostname = url.parse(apiURL).hostname;
const userNetrc = netrc();

let pjson;
let credentials;

class Deployer {
  constructor(cwd) {
    this.cwd;
    pjson = resolve(cwd, 'package.json');
    credentials = userNetrc[apiHostname];
  }

  get loggedIn() {
    return !Utils.isEmpty(credentials);
  }

  login(email, password) {
    console.log(email, password);
    // userNetrc[apiHostname] = {
    //   login: 'srobbin@gmail.com',
    //   password: 'abc123',
    // }

    // netrc.save(userNetrc)
  }
}

module.exports = Deployer;
