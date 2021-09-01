var express = require('express');
var router = express.Router();
const db = require("../models");
const Op = db.Sequelize.Op;
var fs = require('fs');
const config = JSON.parse(fs.readFileSync('./server-config.json', 'utf-8'));
const fetch = require('node-fetch');

/* GET home page. */
router.get('/', async function (req, res) {
    let identity = req.query.identity ? req.query.identity : "";
    let orgA = req.query.orgA ? req.query.orgA : "";
    let orgB = req.query.orgB ? req.query.orgB : "";
    let dateStart = req.query.dateStart ? req.query.dateStart : "";
    let dateEnd = req.query.dateEnd ? req.query.dateEnd : "";
    let provider_ip = "";
    let accessBehaviors = [];
    
    for (const provider_address of Object.keys(config.org_mapping)) {
        provider_ip = config.org_mapping[provider_address][0];
        console.log(provider_ip);
        try {
            await fetch(encodeURI(`http://${provider_ip}/regAccessBehaviorTracking/getData?identity=${identity}&orgA=${orgA}&orgB=${orgB}&dateStart=${dateStart}&dataEnd=${dateEnd}`))
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
    res.render('regAccessBehaviorTracking', {
        accessBehaviors: accessBehaviors
    });
});

router.get('/getData', async function (req, res) {
    let accessBehaviors = await db.accessBehaviors.findAll({
        where: {
            [Op.and]: [
                req.query.identity ? { identity: { [Op.like]: `%${req.query.identity}%` } } : null,
                req.query.orgA ? { orgA: { [Op.like]: `%${req.query.orgA}%` } } : null,
                req.query.orgB ? { orgB: { [Op.like]: `%${req.query.orgB}%` } } : null,
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
