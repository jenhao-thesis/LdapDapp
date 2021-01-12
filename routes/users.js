var express = require('express');
var router = express.Router();
var ldap = require('ldapjs');
var ssha = require('node-ssha256');
const { nextTick } = require('process');
var util = require('util');
var passport = require('passport');

var client = ldap.createClient({
  url: 'ldap://192.168.139.130:1389',
  bindDN: 'cn=root',
  bindCredentials: 'secret',
  searchBase: 'ou=location2,dc=jenhao,dc=com',
});

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
      
      if (!user) {
          // return res.send({status: info})
          // return res.render('index', {err: info});
          req.flash('info', info['message']);
          return res.redirect('/');
      }
      console.log("User exist");
      console.log(user);
      user.sn="backend-edited";
      req.logIn(user, function(err) {
          if (err) { return next(err); }
      }); 
      return res.redirect('/profile/');
  }) (req, res, next);
});

module.exports = router;