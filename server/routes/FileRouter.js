const express = require("express");
const router = express.Router();
const FilesController = require("../controllers/FileController");

router.post("/add", FilesController.addFile);
router.get("/user/:username", FilesController.getUserFiles);
router.get("/shared", FilesController.getSharedFiles);
router.delete("/delete/:id/:username", FilesController.deleteFile);

module.exports = router;
