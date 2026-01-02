const express = require("express");
const router = express.Router();
const FilesController = require("../controllers/FileController");
const FriendsController = require("../controllers/FriendsController");

router.post("/add", FilesController.addFile);
router.get("/user/:username", FilesController.getUserFiles);
router.get("/shared", FilesController.getSharedFiles);
router.get(
  "/recent-shared-by-friends/:username",
  FriendsController.getRecentSharedByFriends
);
router.delete("/delete/:id/:username", FilesController.deleteFile);

module.exports = router;
