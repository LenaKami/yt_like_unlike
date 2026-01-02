var express = require("express");
var router = express.Router();

var UserController = require("../controllers/UserController");
var ValidationController = require("../controllers/ValidationController");
var { authenticate } = require("../controllers/authorizationController");

router.post(
  "/register",
  ValidationController.validationRegister,
  ValidationController.checkValidation,
  UserController.register
);

// Ping endpoint do odświeżania last_active
router.get("/ping", authenticate, (req, res) => {
  res.json({ status: "ok" });
});

//router.post('/login', UserController.login)

module.exports = router;
