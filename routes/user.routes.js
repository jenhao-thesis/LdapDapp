module.exports = app => {
    let isAuthenticated = function (req,res,next){
        if (req.isAuthenticated()) {
            next();
        }
        else {
            // alert("Login first");
            req.flash('info', 'Login first.');
            res.redirect('/');
            // res.status(401).json({"message": 'User not authenticated.'});
        }
    };

    const user = require("../controllers/user.controller.js");
  
    var router = require("express").Router();
    // Retrieve all Tutorials
    router.get("/", user.findAll);
  
    // Retrieve one Tutorial
    router.get("/:cn", user.findOne);

    // Create a new Tutorial
    router.post("/", user.create);
  
    // Update a Tutorial
    router.put("/:cn", isAuthenticated, user.update);

    // Delete a Tutorial with id
    router.delete("/:cn", user.delete);

    // Add a point in balance
    router.put("/:cn/increase", user.increase);

    app.use('/api/user', router);
};