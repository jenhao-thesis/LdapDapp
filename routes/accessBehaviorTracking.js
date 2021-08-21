var express = require('express');
var router = express.Router();
const user = require("../controllers/user.controller.js");

let isAuthenticated = function (req, res, next) {
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

let getHashed = async (req, res, next) => {
    let opts = {
        filter: `(cn=${req.user.cn})`,
        scope: 'sub',
        attributes: ['hashed']
    };
    let searchResult = await user.userSearch(opts, 'ou=location2,dc=jenhao,dc=com');
    if (searchResult.length === 1) {
        let userObject = JSON.parse(searchResult[0]);
        console.log("MSG: user is not binding.")
        if (userObject.hashed === "")
            return res.redirect("/");
        req.user.hashed = userObject.hashed;
        next();
    }
    else {
        console.log("MSG: User not found.")
        return res.redirect("/");
    }
}

/* GET home page. */
router.get('/', isAuthenticated, async function (req, res) {
    let accessBehaviors = await db.accessBehaviors.findAll({
        where: {
            [Op.and]: [
                { identity: req.user.hashed },
                req.query.orgA ? { orgA: req.query.orgA } : null,
                req.query.orgB ? { orgA: req.query.orgNB } : null,
                req.query.dateStart && req.query.dateEnd ? { timestamp: { [Op.between]: [req.query.dateStart, req.query.dateEnd] } } : null
            ]
        }
    });
    let opts = {
        filter: `(cn=${req.user.cn})`,
        scope: 'one',
        attributes: ['mail', 'phone', 'balance'],
        attrsOnly: true
    };
    let data = await user.userSearch(opts, 'ou=location2,dc=jenhao,dc=com');
    let userObject = JSON.parse(data);
    console.log(userObject);
    res.render('accessBehaviorTracking', {
        user: userObject,
        accessBehaviors: accessBehaviors
    });
});

module.exports = router;
