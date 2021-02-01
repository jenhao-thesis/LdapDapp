var express = require('express');
var router = express.Router();
var ldap = require('ldapjs');
var ssha = require('node-ssha256');
const { nextTick } = require('process');
var util = require('util');
var passport = require('passport');
var LocalStrategy = require('passport-local');
var fs = require('fs');
const { search } = require('../app');
var Web3 = require('web3');
const { resolve } = require('path');
var jwt = require('jsonwebtoken');
const { route } = require('./profile');
var crypto = require("crypto");

const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));    
const web3 = new Web3(new Web3.providers.HttpProvider(config.web3_provider));
const admin_address = config.admin_address; // org0
const contract_address = config.contracts.organizationManagerAddress;
const client = ldap.createClient(config.ldap.server);
const contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));

var newDN = "cn=%s,ou=location2,dc=jenhao,dc=com";
var newUser = {
    cn: '',
    sn: 'sn',
    mail: 'qwe@asd',
    objectClass: 'Person',
    phone: '0900000000',
    userPassword: 'default'
};

var searchDN = "ou=location2,dc=jenhao,dc=com";
var searchOpts = {
    filter: '',
    scope: 'sub',
};

passport.use('local', new LocalStrategy( {
    // Override those field if you don'y need it
    // https://stackoverflow.com/questions/35079795/passport-login-authentication-without-password-field
    usernameField: 'identity',
    passwordField: 'signature',
    passReqToCallback: true
},
    async function (req, username, password, done) {
        let identity = username;
        let signature = password;
        let account = req.body.account.toUpperCase();
        signingAccount = web3.eth.accounts.recover(identity, signature).toUpperCase();
        searchOpts['filter'] = util.format("(hashed=%s)", identity);
        console.log(searchOpts);
        console.log("acc:"+account);
        
        let actualIdentity = "";
        let contractInstance = new web3.eth.Contract(contract.abi, contract_address);
        await contractInstance.methods.getIdByOrg(req.body.account).call({from: admin_address})
        .then((result) => {
            actualIdentity = result
        })
        .catch((err) => {
            console.log(err);
        });

        let search = function(dn, opts) {
            return new Promise( (resolve, reject) => {
                let userObject;
                
                client.search(dn, opts, function(err, res) {
                    if (err) return done(err);
                    
                    res.on('searchEntry', function(entry) {
                        console.log('entry: ' + JSON.stringify(entry.object));
                        console.log(entry.object);
                        userObject = entry.object;
                    });
                    
                    res.on('searchReference', function(referral) {
                        console.log('referral: ' + referral.uris.join());
                    });
                    
                    res.on('error', function(err) {
                        console.error('error: ' + err.message);
                    });
                    
                    res.on('end', function(result) {
                        console.log('status: ' + result.status);
                        resolve(userObject);
                    });
        
                });
            })
        }

        let userObject = await search(searchDN, searchOpts);
        if (account === signingAccount && actualIdentity === identity && userObject) {
            return done(null, userObject);
        }
        else if (account === signingAccount && actualIdentity === identity) {
            // If identity(username) exist and no data in ldap server, create one for this idenetity.
            // TODO: create real user for this org
            console.log("new user");
            let id = crypto.randomBytes(10).toString('hex');
            let DN = util.format(newDN, id); 
            let tmpUser = {
                cn: id,
                sn: 'new sn',
                mail: 'new@qwe',
                objectClass: 'Person',
                phone: '0900000000',
                hashed: identity
            };
            await client.add(DN, tmpUser, function(err) {
                if (err) {
                    console.log(err);
                }
                else {
                    return;
                }
            });
            return done(null, tmpUser);
        }
        else
            return done(null, false); 
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
    res.redirect("/");
});

var authenticateToken = function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (token) {
        jwt.verify(token, 'secret', function (err, decoded) {
            if (err) {
                return res.json({success: false, message: 'Failed to authenticate token.'})
            } else {
                req.decoded = decoded
                next();
            }
        })
    } else {
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        })
    }   
};

router.post('/authenticate', function(req, res) {
    // TODO: check target address whether own access right.
    console.log("request hashed:"+req.body.identity);
    console.log("request target:"+req.body.target_address);
    console.log("request sig:"+req.body.signature);

    console.log("recover:"+web3.eth.accounts.recover(req.body.signature));
    
    let user = {
        cn: 'new user',
        sn: 'new sn',
        mail: 'new@qwe',
        objectClass: 'Person',
        phone: '0900000000',
        hashed: 'test'
    };
    
    let token = jwt.sign(user, 'secret', {
        expiresIn:60*60*30
    });

    res.json({
        success: true,
        message: 'Got token',
        token: token
    })
    
});

router.get('/protected', authenticateToken, function(req, res) {
    res.json({success: true, message: "ok, got token", data: req.decoded});
});

router.get('/auth', function (req, res) {
    const {client_id, redirect_uri, scope} = req.query;
    console.log(client_id, redirect_uri, scope);
    // res.json({msg: "done"});
    res.render("auth", {id: client_id, scope: scope, uri: redirect_uri});
});

router.post('/confirmAuth', function (req, res) {
    const {client_id, redirect_uri, scope} = req.query;
    console.log("!!! redirect:"+redirect_uri);
    res.redirect("http://"+redirect_uri);
});

let noneSet = [];
router.post('/nonce', function (req, res) {
    let nonce = crypto.randomBytes(5).toString('hex');
    noneSet.push(nonce);
    res.json({set: JSON.stringify(noneSet)});
});


module.exports = router;