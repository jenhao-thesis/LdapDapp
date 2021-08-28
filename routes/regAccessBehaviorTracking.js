var express = require('express');
var router = express.Router();
const db = require("../models");
const user = require("../controllers/user.controller.js");
const Op = db.Sequelize.Op;

/* GET home page. */
router.get('/', async function (req, res) {
    let accessBehaviors = await db.accessBehaviors.findAll({
        where: {
            [Op.and]: [
                req.query.identity ? { identity: {[Op.like]: `%${req.query.identity }%` }} : null,
                req.query.orgA ? { orgA: {[Op.like]: `%${req.query.orgA }%` }} : null,
                req.query.orgB ? { orgB: {[Op.like]: `%${req.query.orgB }%` }} : null,
                req.query.dateStart && req.query.dateEnd ? { timestamp: { [Op.between]: [req.query.dateStart, req.query.dateEnd] } } : null
            ]
        }
    });
    res.render('regAccessBehaviorTracking', {
        accessBehaviors: accessBehaviors
    });
});

module.exports = router;
