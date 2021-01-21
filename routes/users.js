var express = require('express');
var router = express.Router();
var ldap = require('ldapjs');
var ssha = require('node-ssha256');
const { nextTick } = require('process');
var util = require('util');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var fs = require('fs')

const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));    
const client = ldap.createClient(config.ldap.server);

var newDN = "cn=%s,ou=location2,dc=jenhao,dc=com"
// var c = ssha.create('qwer');
var newUser = {
    cn: '',
    sn: 'sn',
    mail: 'qwe@asd',
    objectClass: 'Person',
    phone: '0900000000',
    userPassword: 'default'
}

passport.use('local', new LocalStrategy( {
    // Override those field if you don'y need it
    // https://stackoverflow.com/questions/35079795/passport-login-authentication-without-password-field
    usernameField: 'address',
    passwordField: 'address'
  },
  function (username, password, done) {
      console.log("entor local strategy");
      console.log(username);
      return done(null, {
          username: 'test',
          tt: "qew"
      })
  }
));

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});

router.post('/register', async function(req, res) {
  const {email, username, password, confirmPassword, phone, id} = req.body;
  if (password === confirmPassword) {
    newUser['cn'] = username;
    newUser['sn'] = username;
    newUser['userPassword'] = password;
    newUser['mail'] = email;
    newUser['phone'] = phone;
    newUser['id'] = id;
    var DN = util.format(newDN, req.body.username); 
    await client.add(DN, newUser, function(err) {
      if (err) {
        console.log(err);
        req.flash('info', 'Error, entry may already exists.');
      }
      else {
        console.log(res);
        req.flash('info', 'Create successfully.');
      }
      res.redirect('/');
    });
  }
  else {
    req.flash('info', "confirm password doesn't match.");
    res.redirect('/');
  }
});

router.get('/logout', function(req, res) {
  req.logOut();
  res.redirect('/');
});

router.post('/login', function(req, res, next) {
  // // req.body.passwordField = ssha.create(req.body.passwordField);
  // console.log(ssha.create(req.body.password));
  // // req.body.password = '{SSHA}B0/RzG5dL4stPl0NRmNAnSGwicIog3Yk';
  // res.redirect('/');
  // TODO
  // Hash password with ssha256 for ldap 
  passport.authenticate('ldapauth', {session: true}, function(err, user, info) {
      if (err) {
          return next(err);
      }
      console.log("```", user);
      if (!user) {
          // return res.send({status: info})
          // return res.render('index', {err: info});
          req.flash('info', info['message']);
          return res.redirect('/');
      }
      console.log("User exist");
      console.log(user);
      req.logIn(user, function(err) {
          console.log("after");
          console.log(user);
          if (err) { return next(err); }
      }); 
      return res.redirect('/profile/');
  }) (req, res, next);
});

// TODO: Get unique id by address of metamask from smart contract
// ...

// TODO: Get user data by unique id from ldap server
// ...

router.post('/loginWithMetamask', passport.authenticate('local', {
  failureRedirect: '/'
}), function (req, res) {
  console.log(req.user);
  res.redirect("/");
});

module.exports = router;