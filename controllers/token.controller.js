const db = require("../models");
const Token = db.tokens;
const Op = db.Sequelize.Op;

exports.create = (req, res) => {
    if (!req.body.identity) {
        res.status(400).send({
          message: "Identity can not be empty!"
        });
        return;
    }

    if (!req.body.org) {
        res.status(400).send({
          message: "Org can not be empty!"
        });
        return;
    }

    const token = {
        identity: req.body.identity,
        org: req.body.org,
        jwt: req.body.jwt
    }

    Token.upsert(token)
        .then(data => {
            res.send(data)
        })
        .catch(err => {
            res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the Token"
            });
        });
};

exports.findAll = (req, res) => {
    console.log(req);
    const identity = req.query.identity;
    const org = req.query.org;
    var condition = identity || org ? {
         [Op.or]: [
             {identity: { [Op.like]: `%${identity}%` }},
             {org: { [Op.like]: `%${org}%` }}
         ] 
        }: null;
  
    Token.findAll({ where: condition })
      .then(data => {
        res.send(data);
      })
      .catch(err => {
        res.status(500).send({
          message:
            err.message || "Some error occurred while retrieving tokens."
        });
      });
};

exports.delete = (req, res) => {
    const identity = req.params.identity;
    const org = req.params.org;
  
    Token.destroy({
      where: {
          [Op.and]: [
              {identity: identity},
              {org: org}
          ]
       }
    })
      .then(num => {
        if (num == 1) {
          res.send({
            message: "Token was deleted successfully!"
          });
        } else {
          res.send({
            message: `Cannot delete Token with identity=${identity} and org=${org}. Maybe Token was not found!`
          });
        }
      })
      .catch(err => {
        res.status(500).send({
          message: `Could not delete Token with identity= ${identity} and org=${org}`
        });
      });
  };