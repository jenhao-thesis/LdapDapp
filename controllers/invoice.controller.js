const db = require("../models");
const Invoice = db.invoice;
const Op = db.Sequelize.Op;

exports.create = (req, res) => {
    const {name, invoiceNo, description, invoiceDate, total} = req.body;
    if (!name || !invoiceNo || !description || !invoiceDate || !total) {
        return res.status(400).send({
            message: "name, invoiceNo, description, invoiceDate, total"
          });
    }

    let invoice = {
        name: name,
        invoiceNo: invoiceNo,
        description: description,
        invoiceDate: invoiceDate,
        total: total
    }

    Invoice.upsert(invoice)
        .then(data => {
            return res.send(data)
        })
        .catch(err => {
            return res.status(500).send({
                message:
                    err.message || "Some error occurred while creating the Invoice"
            });
        });
}

exports.findOne = async (req, res) => {
    const {invoiceNo} = req.params;
    if (!invoiceNo) {
        return res.status(400).send({
            message: "invoiceNo"
          });        
    }

    let data = await Invoice.findByPk(invoiceNo);
    if (data) {
        return res.send(data);
    }
    else {
        return res.status(500).send("Not found.");
    }
}

exports.findAll = async (req, res) => {
    let data = await Invoice.findAll({ where: true});
    if (data) {
        return res.send(data);
    }
    else {
        return res.status(500).send("Not found.");
    }
}

exports.delete = (req, res) => {
    const {invoiceNo} = req.params;
    if (!invoiceNo) {
        return res.status(400).send({
            message: "invoiceNo"
          });        
    }

    Invoice.destroy({ where: { invoiceNo : invoiceNo}})
        .then( num => {
            if (num == 1) {
                return res.send({
                    message: "invoice delete successfully."
                })
            }
            else {
                return res.send({
                    message: `Can not delete invoice with invoiceNo = ${invoiceNo}, maybe not found`
                });
            }
        })
}