var express = require('express');
var router = express.Router();
const db = require("../models");
const user = require("../controllers/user.controller.js");
const Op = db.Sequelize.Op;
var fs = require('fs');
const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));
const fetch = require('node-fetch');

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

/* GET home page. */
router.get('/', isAuthenticated, async function (req, res) {
    let identity = req.user.hashed ? req.user.hashed : "";
    let orgA = req.query.orgA ? req.query.orgA : "";
    let dateStart = req.query.dateStart ? req.query.dateStart : "";
    let dateEnd = req.query.dateEnd ? req.query.dateEnd : "";
    let provider_ip = "";
    let accessBehaviors = [];

    for (const provider_address of Object.keys(config.org_mapping)) {
        provider_ip = config.org_mapping[provider_address][0];
        console.log(provider_ip);
        try {
            await fetch(encodeURI(`http://${provider_ip}/userAccessBehaviorTracking/getData?identity=${identity}&orgA=${orgA}&dateStart=${dateStart}&dataEnd=${dateEnd}`))
                .then(res => res.json())
                .then(json => {
                    if (json.success) {
                        accessBehaviors.push(...json.data);
                    } 
                })
                .catch(err => {
                    console.log(`Get Data Error`, err);
                    throw `Get access behaviors Error with ${provider_ip}. ${err}`;
                });
        } catch (e) {
            console.log(e);
            // errorMsg += e + ".";
        }
    }
    let opts = {
        filter: `(cn=${req.user.cn})`,
        scope: 'one',
        attributes: ['mail', 'phone', 'balance'],
        attrsOnly: true
    };
    let data = await user.userSearch(opts, 'ou=location2,dc=jenhao,dc=com');
    let userObject = JSON.parse(data);
    console.log(userObject);
    res.render('userAccessBehaviorTracking', {
        user: userObject,
        accessBehaviors: accessBehaviors
    });
});

router.get('/getData', async function (req, res) {
    let accessBehaviors = await db.accessBehaviors.findAll({
        where: {
            [Op.and]: [
                { identity: req.query.identity },
                req.query.orgA ? { orgA: { [Op.like]: `%${req.query.orgA }%` } } : null,
                req.query.dateStart && req.query.dateEnd ? { timestamp: { [Op.between]: [req.query.dateStart, req.query.dateEnd] } } : null
            ]
        }
    });
    if (accessBehaviors.length !== 0) {
        console.log("Found record and return.");
        return res.json({success: true, message: "ok, got access behaviors", data: accessBehaviors});
    }
    else
        return res.json({success: false, message: "not found", data: []});    
});

module.exports = router;
