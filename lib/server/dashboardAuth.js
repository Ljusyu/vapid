const Router = require('koa-router')
const passport = require('koa-passport')
const fs = require('fs')

const auth = new Router({ prefix: '/dashboard' })
const LocalStrategy = require('passport-local').Strategy

const fetchUser = (() => {
  // This is an example! Use password hashing in your project and avoid storing passwords in your code
  const user = { id: 1, username: 'test', password: 'test' }
  return async function() {
    return user
  }
})()

passport.serializeUser(function(user, done) {
  done(null, user.id)
})

passport.deserializeUser(async function(id, done) {
  try {
    const user = await fetchUser()
    done(null, user)
  } catch(err) {
    done(err)
  }
})

passport.use(new LocalStrategy(function(username, password, done) {
  fetchUser()
    .then(user => {
      if (username === user.username && password === user.password) {
        done(null, user)
      } else {
        done(null, false)
      }
    })
    .catch(err => done(err))
}))

auth.get('/login', ctx => {
  ctx.type = 'html'
  ctx.body = fs.createReadStream('views/dashboard/login.html')
})

auth.post('/login', passport.authenticate('local', {
  successRedirect: './',
  failureRedirect: 'login'
}))

auth.get('/logout', ctx => {
  ctx.logout()
  ctx.redirect('login')
})

module.exports = auth
