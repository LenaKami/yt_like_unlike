const express = require("express");
const router = express.Router();
const FriendController = require("../controllers/FriendsController");

// Dodawanie znajomego
router.post("/add", FriendController.addFriend);

// Pobieranie znajomych
router.get("/:username", FriendController.getFriends);

// Udostępnianie pliku znajomemu
router.post("/share/:username", FriendController.shareFileWithFriend);

// Cofanie udostępnienia
router.post("/unshare", FriendController.unshareFileWithFriend);

// Pobieranie plików udostępnionych danemu użytkownikowi
router.get("/files/:username", FriendController.getFilesSharedWithUser);

router.delete("/delete/:username", FriendController.removeFriend);

module.exports = router;
