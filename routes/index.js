var express = require('express');
var router = express.Router();
var fs = require('fs');

const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));    
const contract_address = config.contracts.organizationManagerAddress;

/* GET home page. */
router.get('/', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('profile');
  }
  else {
    var msg;
    msg = req.flash('info')[0];
    res.render('index', { title: 'Homepage', info: msg, address: contract_address});
  }
});

module.exports = router;