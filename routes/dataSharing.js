var express = require('express');
var router = express.Router();
var fs = require('fs');

const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));    
const contract_address = config.contracts.organizationManagerAddress;
const admin_address = config.admin_address; // org0

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
router.get('/', isAuthenticated, function(req, res) {

    res.render('dataSharing', {user: req.user, address: contract_address, org_address: admin_address});
});

module.exports = router;