module.exports = app => {
    const token = require("../controllers/token.controller.js");
  
    var router = require("express").Router();
  
    // Create a new Tutorial
    router.post("/", token.create);
  
    // Retrieve all Tutorials
    router.get("/", token.findAll);
  
    // Delete a Tutorial with id
    router.delete("/:identity/:org", token.delete);

    app.use('/api/tokens', router);
  };