var express = require('express');
var router = express.Router();

function isAuthenticated(req,res,next){
    if (req.isAuthenticated()) {
        next();
    }
    else {
        res.status(401).json({"message": 'User not authenticated.'});
    }
  }

router.get('/', isAuthenticated, function(req, res) {
    res.render('profile', { title: 'Profile ', user: req.user});
});

module.exports = router;
