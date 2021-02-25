var express = require('express');
var router = express.Router();
var fs = require('fs');
const db = require("../models");
const fetch = require('node-fetch');
var Web3 = require('web3');

const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider));    
const contract_address = config.contracts.organizationManagerAddress;
const admin_address = config.admin_address; // org0
const admin_key = config.admin_key;
var isAuthenticated = function (req,res,next){
    if (req.isAuthenticated()) {
        next();
    }
    else {
        // alert("Login first");
        req.flash('info', 'Login first.');
        res.redirect('/');
        // res.status(401).json({"message": 'User not authenticated.'});
    }
};

router.get('/org.json', function(req, res) {
    let contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));
    res.json(contract);
});

router.get('/acc.json', function(req, res) {
    let contract = JSON.parse(fs.readFileSync('./build/contracts/AccessManager.json', 'utf-8'));
    res.json(contract);
});

/* GET home page. */
router.get('/', isAuthenticated, async function(req, res) {
    let tokens = await db.tokens.findAll({where: {identity: req.user.hashed}});
    res.render('dataSharing', {user: req.user, address: contract_address, org_address: admin_address, tokens: tokens});
});

router.get('/getAccessToken', isAuthenticated, async function(req, res) {
    let {provider_address} = req.query;
    if (!provider_address)
        return res.json({msg: "address of provider is missing."});
    provider_address = '0x' + provider_address.substr(2, provider_address.length-2);
    if (config.org_mapping[provider_address] == null) {
        return res.send({status: false, message: "provider ip is not found"});
    }
    else {
        let provider_ip = config.org_mapping[provider_address];
        let jwt = "";
        let identity = req.user.hashed;
        let signatureObject;
        let nonceObject;
        // prove org identity, it should be nonce from provider
        await fetch(`http://${provider_ip}/users/auth/nonce?org=${admin_address}`)
            .then( res => res.json())
            .then( json => {
                console.log(json);
                nonceObject = json;
            })
            .catch( (err) => {
                console.log(err);
                return res.send({status: false, message: err.code});
            });
        signatureObject =  web3.eth.accounts.sign(nonceObject.nonce, admin_key);

        // get token
        await fetch(`http://${provider_ip}/users/authenticate`,{ 
                method: 'POST',
                body: JSON.stringify({
                    identity: identity,
                    target_address: admin_address,
                    signature: signatureObject,
                    nonce: nonceObject
                }),
                headers: {'Content-Type': 'application/json'}
            })
            .then( res => res.json())
            .then( json => {
                if (!json.success) return res.send({status: false, message: json.message});
                jwt = json.token
            })
            .catch( (err) => {
                console.log(err);
                return res.send({status: false, message: err.code});
            });
        
        if (jwt) {

            const token = {
                identity: identity,
                org: provider_address,
                jwt: jwt
            }
        
            await db.tokens.upsert(token)
                .then(data => {
                    console.log("upsert successfully");
                })
                .catch(err => {
                    console.log(err.message || "Some error occurred while creating the Token")
                });


            return res.send({status: true, message:"Got token successfully."});
        }
        return res.send({status: false, message: "org has no response."});        
    }


});

module.exports = router;