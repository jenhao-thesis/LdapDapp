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
const db = require("../models");

const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));    
const web3 = new Web3(new Web3.providers.HttpProvider(config.web3_provider));
const admin_address = config.admin_address; // org0
const admin_key = config.admin_key;
const contract_address = config.contracts.organizationManagerAddress;
const client = ldap.createClient(config.ldap.server);
const contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));
const user = require("../controllers/user.controller.js");

var newDN = "cn=%s,ou=location2,dc=jenhao,dc=com";

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
                hashed: identity,
                idStatus: 1
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

router.get('/logout', function(req, res) {
    req.logOut();
    res.redirect('/');
});

router.post('/login', function(req, res, next) {
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
        jwt.verify(token, admin_key, function (err, decoded) {
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

router.post('/authenticate', async function(req, res) {
    // TODO: check target address whether own access right.
    const {identity, target_address, signature, nonce} = req.body;
    // show info about authenticate
    console.log("request hashed:"+identity);
    console.log("request target:"+target_address);
    console.log(signature);
    console.log(nonce);
    
    // verify info

    // Check sign
    const recoverTarget = web3.eth.accounts.recover(req.body.signature);
    if (recoverTarget !== target_address)
        return res.json({
            success: false,
            message: 'Target address is not the same'
        })
    
    // Chceck nonce whether are the same
    if (signature.message !== nonce.nonce)
        return res.json({
            success: false,
            message: 'Nonce is not the same'
        })

    // Check nonce is issued by me
    await db.nonce.findByPk(nonce.id)
        .then( data => {
            if (!data)
                return res.json({status: false, message: "Nonce not exist"});
            else
                // if exist, delete it.
                db.nonce.destroy({ where: {id: nonce.id}})
                    .then( num => {
                        if (num == 1) 
                            console.log("Nonce was deleted successfully.");
                        else
                            console.log(`Cannot delete nonce with id ${nonce.id}, maybe not found`);
                    })
                    .catch( err => res.status(500).send({ message: `could not delete nonce with id=${nonce.id}`}));
        });

    let user = {
        hashed: identity
    };
    
    let token = jwt.sign(user, admin_key, {
        expiresIn:60*60*30
    });

    return res.json({
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

router.get('/auth/nonce', async function (req, res) {
    const {org} = req.query;
    if (!org)
        return res.json({msg: "address of org is missing."});
    let nonce;
    let id;
    let list;
    await db.nonce.create({org: org, value: crypto.randomBytes(5).toString('hex')})
        .then( (data) => {
                console.log("generate successfully.")
                id = data.id;
                nonce = data.value;
            })
        .catch( (err) => console.log(err.message));

    await db.nonce.findAll()
        .then( (data) => list = data)
        .catch( (err) => console.log(err.message));

    res.json({id: id, nonce: nonce});
});


module.exports = router;