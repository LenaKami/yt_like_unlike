var express = require("express");
var router = express.Router();
const multer = require("multer");

var UserController = require("../controllers/UserController");
var ValidationController = require("../controllers/ValidationController");
var { authenticate } = require("../controllers/authorizationController");

const upload = multer({ dest: "files/" });

router.post(
  "/register",
  upload.any(),
  ValidationController.validationRegister,
  ValidationController.checkValidation,
  UserController.register
);

// Ping endpoint do odświeżania last_active
router.get("/ping", authenticate, (req, res) => {
  res.json({ status: "ok" });
});

// Get user's profile image
router.get("/:username/image", UserController.getUserImage);

// Upload user's profile image
router.post("/:username/image", upload.any(), UserController.uploadUserImage);

//router.post('/login', UserController.login)

module.exports = router;
