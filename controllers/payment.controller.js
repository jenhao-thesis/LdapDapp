const db = require("../models");
const Payment = db.payment;
const Op = db.Sequelize.Op;

exports.create = (req, res) => {
    console.log(req.body)

    if (!req.body.Number) {
        res.status(400).send({
          message: "number can not be empty!"
        });
        return;
    }

    if (!req.body.identity) {
        res.status(400).send({
          message: "identity can not be empty!"
        });
        return;
    }
    if (!req.body.amount) {
      res.status(400).send({
        message: "amount can not be empty!"
      });
      return;
  }

    const payment = {
        Number: req.body.Number,
        identity: req.body.identity,
        amount: req.body.amount,
        description: "test",
        status : false
    }
    Payment.upsert(payment)
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
exports.findAll = async (req, res) => {
  let data = await payment.findAll({ where: true});
  if (data) {
      return res.send(data);
  }
  else {
      return res.status(500).send("Not found.");
  }
}

/*
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
*/