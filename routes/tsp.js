var express = require('express');
var router = express.Router();
var fs = require('fs');
var passport = require('passport');
var LocalStrategy = require('passport-local');
const db = require("../models");
const fetch = require('node-fetch');

const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));
var Web3 = require('web3');
const web3 = new Web3(new Web3.providers.WebsocketProvider(config.web3_provider));
const contract_address = config.contracts.organizationManagerAddress;
const contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));
const admin_address = config.admin_address; // org0
const admin_key = config.admin_key;

var hashId_mapping_account = {}
// for pay bill 
// hashedId => transaction_packet
var hashId_mapping_packet = {}


passport.use('local_tsp', new LocalStrategy({
        // Override those field if you don'y need it
        // https://stackoverflow.com/questions/35079795/passport-login-authentication-without-password-field
        usernameField: 'identity',
        passwordField: 'signature',
        passReqToCallback: true
    },
    async function (req, username, password, done) {
        let identity = username; //hashid
        let signature = password; // sign_hashid
        let account = req.body.account;// public key .toUpperCase();
        
        hashId_mapping_account[username] = account;

        //console.log(username);
        //console.log(password);
        //console.log(account);

        //console.log('mamamamama')

        return done(null, username);
    }
));


let getToken = async (req, res ,next) => {
    
    //let {provider_address, hashed} = req.query;
    let identity = req.body.identity
    let provider_address = JSON.parse(req.body.provider_address)

    
    if (!provider_address || provider_address.length === 0 || identity === undefined) {
        res.redirect('/tsp');
        //next();
        //return res.json({msg: "Address of provider is not found."});
    }
    else {
        console.log('hellllllllllo')
        console.log(provider_address,identity)
        let cur = "", provider_ip = "";
        let tokens = [];
        let errorMsg = "";
        for (let i = 0; i < provider_address.length; ++i) {
            cur = '0x' + provider_address[i].substr(2, provider_address[i].length-2);
            provider_ip = config.org_mapping[cur][0];
            console.log(provider_ip)
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
                            throw `Authenticate Error with ${cur}, Error code:　${err.errno}`
                        });
                } catch (e) {
                    console.log("contiue.", e);
                    errorMsg += e + "\n\n";
                    continue;
                }
                
                let token = {
                    identity: identity,
                    org: cur,
                    jwt: jwt
                }
                tokens.push(token);
            }
        }
        await db.tokens.bulkCreate(tokens, {updateOnDuplicate: ["jwt", "updatedAt"]});
        next();

        /*
        if (errorMsg.length !== 0)
            return res.json({msg: errorMsg});
        res.json({msg:"oK"});
        */
        
    }
};

/*
let getToken = async (req, res) => {
    let {provider_address, hashed} = req.query;
    let identity = hashed;
    console.log('get token!')
    

    if (!provider_address || provider_address.length === 0 || hashed === undefined) {
        return res.json({msg: "Address of provider is not found."});
    }
    else {
        console.log('maoaoaoaoa')
        console.log(provider_address,hashed)
        let cur = "", provider_ip = "";
        let tokens = [];
        let errorMsg = "";
        for (let i = 0; i < provider_address.length; ++i) {
            cur = '0x' + provider_address[i].substr(2, provider_address[i].length-2);
            provider_ip = config.org_mapping[cur][0];
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
                            throw `Authenticate Error with ${cur}, Error code:　${err.errno}`
                        });
                } catch (e) {
                    console.log("contiue.", e);
                    errorMsg += e + "\n\n";
                    continue;
                }
                

                let token = {
                    identity: identity,
                    org: cur,
                    jwt: jwt
                }
                tokens.push(token);
            }
        }
        await db.tokens.bulkCreate(tokens, {updateOnDuplicate: ["jwt", "updatedAt"]});
        if (errorMsg.length !== 0)
            return res.json({msg: errorMsg});
        res.json({msg:"oK"});
    }
};
*/

let getProtectedData = async (req, res, next) => {
    if (!req.isAuthenticated()) {
        console.log('get hashed no login')
        next();
    } else {
        
        let tokens = await db.tokens.findAll({
            where: {
                identity: req.user
            }
        });
        

        let contractInstance = new web3.eth.Contract(contract.abi, contract_address);

        // First: get user's ethereum address
        let user_address = "";
        await contractInstance.methods.getAddressByHashed(req.user).call({
                from: admin_address
            })
            .then((result) => {
                user_address = result
            })
            .catch((e) => {
                return res.status(500).json({
                    msg: "failed to get address by hashed"
                });
            });

        // Second: get access manager contract of the user
        let accAddress = "";
        await contractInstance.methods.getAccessManagerAddress(user_address).call({
                from: admin_address
            })
            .then((result) => {
                accAddress = result
            })
            .catch((err) => {
                return res.status(500).json({
                    msg: "failed to get acc manager"
                });
            });

        // Third: send request to resource provider with token.
        let data = [];
        let orgs = [];

        let date = [];
        let total = [];
        let resOrg = [];

        let provider_ip = "";
        let errorMsg = "";
        for (let i = 0; i < tokens.length; ++i) {
            provider_ip = config.org_mapping[tokens[i].org][0];
            if (provider_ip === null) {
                console.log(`IP of current provider ${tokens[i].org} is not found.`)
            } else {
                // get balance
                try {
                    let result;
                    await fetch(`http://${provider_ip}/users/protected?acc=${accAddress}`, {
                            headers: {
                                'x-access-token': tokens[i].jwt
                            }
                        })
                        .then(res => res.json())
                        .then(json => {
                            if (json.success) {
                                result = JSON.parse(json.data);
                                console.log(result);
                                orgs.push(tokens[i].org);
                                data.push(result.balance);
                            } else {
                                console.log("no permission")
                                //throw `Token expired. Please get token again with ${tokens[i].org}.${json.message}`;
                            }
                        })
                        .catch(err => {
                            console.log(`Get Data Error`, err);
                            throw `Get protected data Error with ${tokens[i].org}. ${err}`;
                        });
                } catch (e) {
                    errorMsg += e + ".";
                }
                // end get balance

                // get bill
                try {
                    await fetch(`http://${provider_ip}/users/protectedInvoice?acc=${accAddress}`, {
                            headers: {
                                'x-access-token': tokens[i].jwt
                            }
                        })
                        .then(res => res.json())
                        .then(json => {
                            
                            if (json.success) {
                                result = json.data;
                                for (let j = 0; j < result.length; ++j) {
                                    console.log(result[j]);
                                    date.push(result[j].invoiceDate);
                                    total.push(result[j].total);
                                    resOrg.push(tokens[i].org);
                                }
                            }
                        })
                        .catch(err => {
                            console.log(`Get Data Error`, err);
                            throw `Get protected invoice Error with ${tokens[i].org}. ${err}`;
                        });
                } catch (e) {
                    errorMsg += e + '.';
                }

                // end get bill
            }
        }
        /*
        let invoices = await db.invoice.findAll({where: {name: req.user.cn}});
        for (let i = 0; i < invoices.length; ++i) {
            date.push(invoices[i].invoiceDate);
            total.push(invoices[i].total);
            resOrg.push(admin_address);
        }
        */
        req.token = tokens;
        req.errorMsg = errorMsg;
        req.data = data;
        req.orgs = orgs;
        req.date = date;
        req.total = total;
        req.resOrg = resOrg;
        next();
    }

};

let getDepositInfo = async (req , res , next) =>{
    if (!req.isAuthenticated()) {
        return  res.json({'status':false,'url':'/tsp'})
    }
    else
    {
        let {orgs, amount , bank , receive_address} = req.query;

        console.log('======================')
        console.log(orgs,amount,bank,receive_address)
        console.log('======================')

        // check value is exist
        if(!orgs || !amount || !bank || !receive_address){
            return  res.json({'status':false,'url':'/tsp'})
        }

        let transaction = {
            "status" : true,
            "org" : [],
            "amount" : [],
            "nonce" : [],
            "msg" : ""
        }
        
        // get user token
        let tokens = await db.tokens.findAll({
            where: {
                identity: req.user
            }
        });

        let contractInstance = new web3.eth.Contract(contract.abi, contract_address);

        // check receive_address has account on bank
        if(bank && receive_address){
            try {
                await contractInstance.methods.isRegistered(bank).call({from:receive_address})
                .then ( (r) => {

                    if(r){
                        contractInstance.methods.getId().call({from: receive_address})
                        .then( (result) => {
                            transaction['receive_address'] = result
                            transaction['bank'] = bank
                        })
                    }
                })
            }
            catch(e) {
                transaction['status'] = false
                transaction['receive_address'] = false
                transaction['msg'] += "account is not exist."
            }
                
        }

        // First: get user's ethereum address
        let user_address = "";
        await contractInstance.methods.getAddressByHashed(req.user).call({
                from: admin_address
            })
            .then((result) => {
                user_address = result
            })
            .catch((e) => {
                return res.status(500).json({
                    msg: "failed to get address by hashed"
                });
            });

        // Second: get access manager contract of the user
        let accAddress = "";
        await contractInstance.methods.getAccessManagerAddress(user_address).call({
                from: admin_address
            })
            .then((result) => {
                accAddress = result
            })
            .catch((err) => {
                return res.status(500).json({
                    msg: "failed to get acc manager"
                });
            });
        
        // Third send request to resource provider to check the balance is enough
        for(let i = 0 ; i < orgs.length ;++i){
            provider_ip = config.org_mapping[orgs[i]][0];
            transaction['org'].push(orgs[i])
            transaction['amount'].push(amount[i])

            if (provider_ip === null) {
                console.log(`IP of current provider ${org[i]} is not found.`)
            }
            else
            {   
                let token = tokens.find(token => token.org == orgs[i])
                if(token)
                {
                    try {
                        let result;
                        await fetch(`http://${provider_ip}/users/depositCheck?acc=${accAddress}&amount=${amount[i]}`, {
                            headers: {
                                'x-access-token': token.jwt
                            }
                        })
                        .then(res => res.json())
                        .then(json => {
                            console.log(json)
                            if (json.success) {
                                transaction['nonce'].push(json.data)
                            
                            } else {
                                transaction['status'] = false;
                                transaction['nonce'].push("-1")
                                transaction['msg'] += ` ${config.org_mapping[orgs[i]][1]}戶頭餘額不足`

                                throw `${config.org_mapping[orgs[i]][1]} 戶頭餘額不足`
                            }
                        })

            
                    }
                    catch (e) {
                        console.log(e)
                        break;
                        //errorMsg += e + ".";
                    }
                    
                }
                else{
                    transaction['status'] = false;
                    transaction['nonce'].push("-1")
                    
                    transaction['msg']+= " Tsp does not have permission to check the " + config.org_mapping[orgs[i]][1] + " balance."
                    
                    
                    break;
                }
            }
        }
        if(transaction['status']){
            hashId_mapping_packet[req.user] = transaction;
            console.log(hashId_mapping_packet)
        }
        

        return res.json(transaction)
    }
};
router.post('/executeTransfer',async function(req,res){
    if (req.isAuthenticated()) {
        let transaction_status = {status:true};
        let packet = req.body.packet;
        let provider_ip = ""
        let cur = ""
        console.log(packet)
        let account = web3.eth.accounts.recover(JSON.stringify(hashId_mapping_packet[req.user]), packet)
        console.log(account)
        
        if(account == hashId_mapping_account[req.user]){
            // execute deduction
            for (let i = 0; i < hashId_mapping_packet[req.user]['org'].length ; ++i) {
                provider_ip =  config.org_mapping[hashId_mapping_packet[req.user]['org'][i]][0];
                await fetch(`http://${provider_ip}/users/executeDeduction`,{ 
                    method: 'POST',
                    body:JSON.stringify({
                        hashed : req.user,
                        identity : account,
                        sign_packet : packet,
                        packet : JSON.stringify(hashId_mapping_packet[req.user]),
                        amount: hashId_mapping_packet[req.user]['amount'][i],
                        nonce : hashId_mapping_packet[req.user]['nonce'][i],
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(res => res.json())
                .then(json => {
                    console.log(json)
                    if (json.success) {
                        console.log(json)
                    } else {
                        transaction_status['status'] = false
                    }
                })
            }
            
            provider_ip =  config.org_mapping[hashId_mapping_packet[req.user]['bank']][0];

            // execute increase
            await fetch(`http://${provider_ip}/users/executeIncrease`,{
                method: 'POST',
                body:JSON.stringify({
                    sender_hased : req.user,
                    sender_account : account,
                    sign_packet : packet,
                    packet : JSON.stringify(hashId_mapping_packet[req.user]),
                }),
                headers: {
                    'Content-Type': 'application/json'
                }

            })
            .then(res => res.json())
            .then(json => {
                console.log(json)

                if (json.success) {
                    console.log('hello')
                      
                } 
                else {
                    transaction_status['status'] = false
                }
            })

            if(transaction_status['status']){
                return res.json({success: true, message: "good", data: []})
            }
            else{
                return res.json({success: true, message: "fail execute", data: []})
            }
        }
        else{
            console.log('123')
            return res.json({success: false, message: "ecRecover"})
        }
        
    }
})

router.post('/executeTransaction',async function(req,res){
    if (req.isAuthenticated()) {
        let transaction_status = {status:true};
        let packet = req.body.packet;
        let provider_ip = ""
        let cur = ""
        let account = web3.eth.accounts.recover(JSON.stringify(hashId_mapping_packet[req.user]), packet)
        
        
        
        if(account == hashId_mapping_account[req.user]){
            for (let i = 0; i < hashId_mapping_packet[req.user]['org'].length ; ++i) {
               
                provider_ip =  config.org_mapping[hashId_mapping_packet[req.user]['org'][i]][0];
                await fetch(`http://${provider_ip}/users/executeTransaction`,{ 
                    method: 'POST',
                    body:JSON.stringify({
                        hashed : req.user,
                        identity : account,
                        sign_packet : packet,
                        packet : JSON.stringify(hashId_mapping_packet[req.user]),
                        amount: hashId_mapping_packet[req.user]['amount'][i],
                        nonce : hashId_mapping_packet[req.user]['nonce'][i],
                    }),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(res => res.json())
                .then(json => {
                    console.log(json)
                    if (json.success) {
                        console.log(json)
                    } else {
                        transaction_status['status'] = false
                    }
                })
            }

            if(transaction_status['status']){
                return res.json({success: true, message: "good", data: []})
            }
            else{
                return res.json({success: true, message: "fail execute", data: []})
            }
        }
        else{
            return res.json({success: false, message: "ecRecover"})
        }
        
    }
})

router.post('/loginWithMetamask', passport.authenticate('local_tsp', {
    failureRedirect: '/tsp'
}), getToken ,function (req, res) {
    res.send({
        url: "/tsp/"
    });
});

router.get('/setting',getProtectedData, async function (req , res){
    
    if (req.isAuthenticated()) {
        let tokens = await db.tokens.findAll({where: {identity: req.user}});
        console.log(config.org_mapping)
        res.render('setting',{ user: true , 
            address: contract_address, 
            org_address: admin_address ,
            org_mapping: JSON.stringify(config.org_mapping) , 
            orgs: JSON.stringify(req.orgs) ,
            tokens: tokens
        })
    }
    else{
        res.render('tsp_index', {
            user: false,
            address: contract_address,
            //org_mapping: JSON.stringify(config.org_mapping)
        });
    }
});
router.get('/logout', function (req, res) {
    req.logOut();
    res.redirect('/tsp');
});

router.get('/', getProtectedData, async function (req, res) {

    if (req.isAuthenticated()) {
        res.render('tsp_index', {
            user: true,
            account : hashId_mapping_account[req.user],
            address: contract_address,
            org_address: admin_address,
            token: req.token,
            data: JSON.stringify(req.data),
            orgs: JSON.stringify(req.orgs),
            date: JSON.stringify(req.date),
            total: JSON.stringify(req.total),
            resOrg: JSON.stringify(req.resOrg),
            errorMsg: req.errorMsg,
            org_mapping: JSON.stringify(config.org_mapping)
        });
        //res.redirect('/profile/');
    } else {
        res.render('tsp_index', {
            user: false,
            address: contract_address,
            org_mapping: JSON.stringify(config.org_mapping)
        });
    }
    /*
  if (req.isAuthenticated()) {
    res.redirect('/profile/');
  }
  else {
    var msg;
    msg = req.flash('info')[0];
    res.render('index', { title: 'Homepage', info: msg, address: contract_address});
  }*/
});
router.get('/queryPaymentInfo',async function(req,res){
    if (req.isAuthenticated()) {
        console.log(req.user)
        console.log(req.query.payment_number)
        let payment = await db.payment.findAll({where: {number:req.query.payment_number, identity: req.user}});
        
        if (payment.length !== 0) {
            console.log("Found record and return.");
            return res.json({success: true, message: "ok, got token", data: payment});
        }
        else
            return res.json({success: false, message: "not found", data: []});   
        }
})
router.get('/getAccessToken',getToken)


router.get('/depositCheck',getDepositInfo)

module.exports = router;