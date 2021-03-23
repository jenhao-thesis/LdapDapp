module.exports = app => {
    const invoice = require("../controllers/invoice.controller.js");
  
    var router = require("express").Router();
  
    // Create a new bill
    router.post("/", invoice.create);
  
    router.get("/:invoiceNo", invoice.findOne);

    // Retrieve all bill
    router.get("/", invoice.findAll);
  
    // Delete a Tutorial with id
    router.delete("/:invoiceNo", invoice.delete);

    app.use('/api/invoice', router);
  };