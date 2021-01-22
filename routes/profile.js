var express = require('express');
var router = express.Router();
var fs = require('fs')
var Web3 = require('web3');
var ldap = require('ldapjs');

const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));    
const web3 = new Web3(new Web3.providers.HttpProvider(config.web3_provider));
const admin_address = config.admin_address; // org0
const contract_address = config.contracts.organizationManagerAddress;
const client = ldap.createClient(config.ldap.server);


function isAuthenticated(req,res,next){
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

router.get('/', isAuthenticated, function(req, res) {
    res.render('profile', { title: 'Profile ', user: req.user, address: contract_address});
});

router.get('/org.json', function(req, res) {
    let contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));
    res.json(contract);
});

router.post('/bindAccount', isAuthenticated, async function(req, res, next) {
    let contract = JSON.parse(fs.readFileSync('./build/contracts/OrganizationManager.json', 'utf-8'));    
    let contractInstance = new web3.eth.Contract(contract.abi, contract_address);
    
    let userId = req.body.uid;
    let userAddress = req.body.address;
    let msg = "", hash = "";
    let status = false;
    console.log("profile id", userId);
    console.log("profile address", userAddress);
    
    await contractInstance.methods.bindAccount(userId, userAddress).send({
        from: admin_address,
        gas: 1000000
    })
    .then( (result) => {
        msg = `OK, i got it, this is your transaction hash: ${result.transactionHash}`;
        hash = result.transactionHash;
        status = true;
        console.log(result);
    })
    .catch( (err) => {
        console.log(err);
        msg = `${err}`;
    })
    
    if (status) {
    }
    
    res.send({msg: msg, status: status, txHash: hash});
});


router.post('/updateUser', isAuthenticated, function(req, res) {
    const {hashed} = req.body;
    let msg = "successfully";

    let change = new ldap.Change({
        operation: 'add',
        modification: {
            hashed: hashed
        }
    });
    
    client.modify(req.user.dn, change, function(err) {
        console.log("error", err);
    });
    
    let newUser = req.user;
    newUser.hashed = hashed;
    req.logIn(newUser, function(err) {
        if (err)
            console.log("err");
    })

    res.send({msg: msg});
});

module.exports = router;
