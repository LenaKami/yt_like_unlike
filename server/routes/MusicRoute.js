var express = require('express');
var router = express.Router();
var Music = require('../controllers/MusicController');

router.get('/categories', Music.getCategories);
router.get('/subcategories/:categoryId', Music.getSubcategories);
router.get('/subcategory/:subId/songs', Music.getSongsForSubcategory);

// playlists
router.post('/playlist/add', Music.createPlaylist);
router.get('/playlists/:username', Music.getUserPlaylists);
router.post('/playlist/:playlistId/addSong', Music.addSongToPlaylist);
router.get('/playlist/:playlistId/remove/:songId', Music.removeSongFromPlaylist);

router.get('/friends/:username', Music.getFriendsPlaylists);
router.get('/playlist/:playlistId/songs', Music.getPlaylistSongs);
router.get('/remove/:id', Music.deletePlaylist);

module.exports = router;
