var express = require('express');
var router = express.Router();
const PlayerYT = require("../database/models/Player")

var PlayerController = require('../controllers/PlayerController')
var authorization = require('../controllers/authorizationController')

router.post('/add', //authorization.authenticate,
    PlayerController.addPlayerYT
)
router.get('/test',(req,res) => {
  res.json({status:201})
})


router.post('/update/:id', //authorization.authenticate,
    PlayerController.updatePlayerYT
)

router.post('/like/:id', authorization.authenticate,
  PlayerController.likePlayerYT
)

router.post('/unlike/:id', authorization.authenticate,
  PlayerController.unlikePlayerYT
)

router.get('/delete/:id', //authorization.authenticate,
    PlayerController.deletePlayerYT
)

router.get('/allPlayers',
    PlayerController.getAllPlayersYT
)

router.get('/getPlayer/:id',
    PlayerController.getPlayerYT
)

module.exports = router;
