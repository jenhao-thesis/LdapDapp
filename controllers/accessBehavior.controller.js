const db = require("../models");
const AccessBehavior = db.accessBehaviors;
const Op = db.Sequelize.Op;

exports.create = (req, res) => {
  const { identity, attribute, orgA, orgB, timestamp } = req.body;
  if (!identity || !attribute || !orgA || !orgB || !timestamp) {
    return res.status(400).send({
      message: "identity, attribute, orgA, orgB, timestamp"
    });
  }

  const accessBehavior = {
    identity: identity,
    attribute: attribute,
    orgA: orgA,
    orgB: orgB,
    timestamp: timestamp
  }

  AccessBehavior.upsert(accessBehavior)
    .then(data => {
      res.send(data)
    })
    .catch(err => {
      res.status(500).send({
        message:
          err.message || "Some error occurred while creating the AccessBehavior"
      });
    });
};

exports.findAll = async (req, res) => {
  console.log(req);
  AccessBehavior.findAll({
    where: {
      [Op.and]: [
        {identity: req.user.hashed},
        req.query.orgA ? {orgA: req.query.orgA} : null,
        req.query.orgB ? {orgA: req.query.orgNB} : null,
        req.query.dateStart && req.query.dateEnd ? {timestamp: {[Op.between]: [req.query.dateStart, req.query.dateEnd]}} : null
      ]
    }
  })
  .then(data => {
    //res.locals.accessBehaviors = data;
    res.send(data);
  })
  .catch(err => {
    res.status(500).send({
      message:
        err.message || "Some error occurred while retrieving accessBehaviors."
    });
  });
}

