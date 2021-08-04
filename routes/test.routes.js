module.exports = app => {
    const test = require("../controllers/test.controller.js");
  
    var router = require("express").Router();
  
    router.get("/testResponse", test.testResponse);

    router.get("/thirdPartyLogin", test.thirdPartyLogin);

    router.get("/addUser", test.addUser);

    router.get("/bindAccount", test.bindAccount);

    router.get("/authorize", test.authorize);

    router.get("/revoke", test.revoke);

    router.get("/authorizeAll", test.authorizeAll);

    router.get("/revokeAll", test.revokeAll);

    router.get("/testOnce", test.testOnce);

    app.use('/api/test', router);
  };