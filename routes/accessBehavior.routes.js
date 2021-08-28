module.exports = app => {
  const accessBehavior = require("../controllers/accessBehavior.controller.js");

  var router = require("express").Router();

  // Create a new Tutorial
  router.post("/", accessBehavior.create);

  // Retrieve all Tutorials
  router.get("/", accessBehavior.findAll);

  app.use('/api/accessBehaviors', router);
};