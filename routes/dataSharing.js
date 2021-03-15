var express = require('express');
var router = express.Router();
var fs = require('fs');
const db = require("../models");
const fetch = require('node-fetch');
var Web3 = require('web3');
const user = require("../controllers/user.controller.js");
const { exception } = require('console');

const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider));    
const contract_address = config.contracts.organizationManagerAddress;
const admin_address = config.admin_address; // org0
const admin_key = config.admin_key;
let isAuthenticated = function (req,res,next){
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

let getToken = async (req, res) => {
    let {provider_address, hashed} = req.query;
    let identity = hashed;
    if (provider_address.length === 0 || hashed === undefined) {
        return res.json({msg: "Address of provider is not found."});
    }
    else {
        console.log(provider_address, hashed);

        let cur = "", provider_ip = "";
        let tokens = [];
        let errorMsg = "";
        for (let i = 0; i < provider_address.length; ++i) {
            cur = '0x' + provider_address[i].substr(2, provider_address[i].length-2);
            provider_ip = config.org_mapping[cur];
            if (provider_ip === null) {
                return res.json({msg: `IP of current provider ${cur} is not found.`})
            }
            else {
                let jwt = "";
                let signatureObject;
                let nonceObject;
                // prove org identity, it should be nonce from provider
                try {
                    await fetch(`http://${provider_ip}/users/auth/nonce?org=${admin_address}`)
                        .then( res => res.json())
                        .then( json => {
                            console.log(json);
                            nonceObject = json;
                        })
                        .catch( (err) => {
                            console.log("GetNonce Error");
                            throw `Get Nonce Error with ${cur}, Error code:　${err.errno}`;
                        });
                } catch (e) {
                    console.log("contiue.", e);
                    errorMsg += e + "\n\n";
                    continue;
                }
                signatureObject =  web3.eth.accounts.sign(nonceObject.nonce, admin_key);
                
                // get token
                try {
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
                            console.log("Authenticate Error");
                            throw `Get Nonce Error with ${cur}, Error code:　${err.errno}`
                        });
                } catch (e) {
                    console.log("contiue.", e);
                    errorMsg += e + "\n\n";
                    continue;
                }
                

                const token = {
                    identity: identity,
                    org: cur,
                    jwt: jwt
                }
                tokens.push(token);
            }
        }
        await db.tokens.bulkCreate(tokens, {updateOnDuplicate: ["jwt", "updatedAt"]});
        if (errorMsg.length !== "")
            return res.json({msg: errorMsg});
        res.json({msg:"oK"});
    }
};

let getHashed = async (req, res, next) => {
    let opts = {
        filter: `(cn=${req.user.cn})`,
        scope: 'sub',
        attributes: ['hashed']
    };
    let searchResult = await user.userSearch(opts, 'ou=location2,dc=jenhao,dc=com');
    if (searchResult.length === 1) {
        let userObject = JSON.parse(searchResult[0]);
        req.user.hashed = userObject.hashed;
        next();
    }
    else {
        return res.send({msg: "user search error", status: false, txHash: ""});
    }
}

let getProtectedData = async (req, res, next) => {
    let tokens = await db.tokens.findAll({where: {identity: req.user.hashed}});

    let data = [];
    let provider_ip = "";
    let errorMsg = "";
    for (let i = 0; i < tokens.length; ++i) {
        provider_ip = config.org_mapping[tokens[i].org];
        if (provider_ip === null) {
            console.log(`IP of current provider ${tokens[i].org} is not found.`)
        }
        else {
            try {
                let result;
                await fetch(`http://${provider_ip}/users/protected`, {            
                    headers: {'x-access-token': tokens[i].jwt}
                })
                .then(res => res.json())
                .then(json => {
                    if (json.success) {
                        result = JSON.parse(json.data);
                        console.log(result);
                        data.push(result.phone);
                    }
                })
                .catch(err => {
                    console.log(`Get Data Error`, err);
                    throw `Get protected data Error with ${tokens[i].org}.`;
                });
            } catch (e) {
                errorMsg += e + "\n\n";
            }
        }
    }

    req.data = data;
    next();
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
router.get('/', isAuthenticated, getHashed, getProtectedData, async function(req, res) {
    let tokens = await db.tokens.findAll({where: {identity: req.user.hashed}});
    res.render('dataSharing', {user: req.user, address: contract_address, org_address: admin_address, tokens: tokens, data: req.data});
});

router.get('/getAccessToken', isAuthenticated, getToken);

router.get('/getOpenData', isAuthenticated, async function(req, res) {
    let tokens = await db.tokens.findAll({where: {identity: req.user.hashed}});
    let data = [];
    let provider_ip = "";
    let result;
    for (let i = 0; i < tokens.length; ++i) {
        console.log(tokens[i].org);
        provider_ip = config.org_mapping[tokens[i].org];
        if (provider_ip == null) {
            console.log("provider ip is not found")
        }
        else {
            await fetch(`http://${provider_ip}/users/protected`, {            
                headers: {'x-access-token': tokens[i].jwt}
            })
            .then(res => res.json())
            .then(json => {
                if (json.success) {
                    result = JSON.parse(json.data);
                    console.log(result);
                    data.push(result.phone);
                }
            })
            .catch(err => console.log(err));
        }
    }

    res.render('dataSharing', {user: req.user, address: contract_address, org_address: admin_address, tokens: tokens, data: data});
});

module.exports = router;