var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.render('metamask-connect', { title: 'Metamask connection'});
});

module.exports = router;