const express = require("express");
const router = express.Router();
const FriendRequestsController = require("../controllers/FriendRequestsController");

router.post("/", FriendRequestsController.createRequest);
router.get("/incoming/:username", FriendRequestsController.getIncoming);
router.get("/outgoing/:username", FriendRequestsController.getOutgoing);
router.post("/:id/accept", FriendRequestsController.acceptRequest);
router.post("/:id/reject", FriendRequestsController.rejectRequest);
router.delete("/:id", FriendRequestsController.deleteRequest);

module.exports = router;
