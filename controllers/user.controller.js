const { rejects } = require('assert');
const fs = require('fs');
const ldap = require('ldapjs');
const { resolve } = require('path');
const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));   
const client = ldap.createClient(config.ldap.server);
const util = require('util');

let defaultDN = "cn=%s,ou=location2,dc=jenhao,dc=com";
let templateUser = {
    cn: '',
    sn: 'sn',
    mail: 'qwe@asd',
    objectClass: 'Person',
    phone: '0900000000',
    userPassword: 'default'
};

let UserSearch = function(opts, base) {
    return new Promise(function(resolve, reject) {
        client.search(base, opts, function(err, res) {
            let data = [], entry;
            res.on('searchEntry', function(entry) {
                entry = JSON.stringify(entry.object)
                console.log('entry: ' + entry);
                data.push(entry);
            });
            res.on('searchReference', function(referral) {
                console.log('referral: ' + referral.uris.join());
            });
            res.on('error', function(err) {
                console.error('error: ' + err.message);
            });
            res.on('end', function(result) {
                console.log('status: ' + result.status);
                if (result.status !== 0) {
                    reject('Error code received from AD');
                } else {
                    resolve(data);
                }
            });        
        });
    });
}

exports.userSearch = UserSearch;

exports.findOne = async (req, res) => {
    let opts = {
        filter: util.format('(cn=%s)', req.params.cn),
        scope: 'sub'
    };
    let data = await UserSearch(opts, 'ou=location2,dc=jenhao,dc=com');
    // res.json({msg: data[0]});
    res.send(JSON.parse(data[0]));
};

exports.findAll = async (req, res) => {
    let opts = {
        filter: '(objectclass=Person)',
        scope: 'sub'
    };
    let data = await UserSearch(opts, 'ou=location2,dc=jenhao,dc=com');
    res.json({msg: data});
};

exports.create = async (req, res) => {
    const {email, username, password, confirmPassword, phone, id} = req.body;
    if (password === confirmPassword) {
        templateUser['cn'] = username;
        templateUser['sn'] = username;
        templateUser['userPassword'] = password;
        templateUser['mail'] = email;
        templateUser['phone'] = phone;
        templateUser['id'] = id;
        let DN = util.format(defaultDN, req.body.username); 
        await client.add(DN, templateUser, function(err) {
            if (err) {
                console.log(err);
                req.flash('info', 'Error, entry may already exists.');
            }
            else {
                console.log(res);
                req.flash('info', 'Create successfully.');
            }
            res.redirect('/');
            // res.json({"status": "success"});
        });
    }
    else {
        req.flash('info', "confirm password doesn't match.");
        res.redirect('/');
    }
};

exports.update = (req, res) => {
    const {email, phone, id} = req.body;
    let DN = util.format(defaultDN, req.params.cn); 
    let change = {
        operation: 'replace',
        modification: {
            mail: email,
            phone: phone,
            id: id
        }
    };
    
    client.modify(DN, change, function(err) {
        if (err !== null) {
            console.log(err);
            res.status(500).json({msg: "error in modify"});
        }
            
    });

    res.json({msg: "Profile was updated successfully."});
};

exports.delete = (req, res) => {
    
};