module.exports = app => {
    const payment = require("../controllers/payment.controller.js");
  
    var router = require("express").Router();
  
    // Create a new payment
    router.post("/", payment.create);

    //router.get("/", payment.findAll);
    
    //router.get("/:invoiceNo", invoice.findOne);


    app.use('/api/payment', router);
  };