var express = require('express');
var router = express.Router();

var UserController = require('../controllers/UserController')
var ValidationController = require('../controllers/ValidationController')

router.post('/register',
  ValidationController.validationRegister,
  ValidationController.checkValidation,
  UserController.register
)
router.get('/test',(req,res) => {
  res.json({status:201})
})

//router.post('/login', UserController.login)

module.exports = router;
