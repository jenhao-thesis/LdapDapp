var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
  if (req.isAuthenticated()) {
    res.redirect('profile');
  }
  else {
    var msg;
    msg = req.flash('info')[0];
    res.render('index', { title: 'Homepage', info: msg});
  }
});

module.exports = router;