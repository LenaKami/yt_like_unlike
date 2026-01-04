const express = require("express");
const router = express.Router();
const FilesController = require("../controllers/FileController");
const FriendsController = require("../controllers/FriendsController");

router.post("/add", FilesController.addFile);
router.post("/folder/add", FilesController.addFolder);
router.get("/user/:username", FilesController.getUserFiles);
router.get("/folders/:username", FilesController.getUserFolders);
router.get("/download/:id", FilesController.downloadFile);
router.get("/shared", FilesController.getSharedFiles);
router.get(
  "/recent-shared-by-friends/:username",
  FriendsController.getRecentSharedByFriends
);
router.get("/shared-with/:username", FriendsController.getFilesSharedWithUser);
router.post("/share", FriendsController.shareFileWithUsers);
router.delete("/delete/:id/:username", FilesController.deleteFile);

module.exports = router;
