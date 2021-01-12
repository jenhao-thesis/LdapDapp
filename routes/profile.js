var express = require('express');
var router = express.Router();

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
    res.render('profile', { title: 'Profile ', user: req.user});
});

module.exports = router;
