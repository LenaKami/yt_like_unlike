const API_URL = "http://localhost:5000/music";

export const musicApi = {
  getCategories: async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      const data = await res.json();
      if (data.status === 200) return data.data;
      return [];
    } catch (e) {
      console.error('musicApi.getCategories', e);
      return [];
    }
  },

  getSubcategories: async (categoryId: number) => {
    try {
      const res = await fetch(`${API_URL}/subcategories/${categoryId}`);
      const data = await res.json();
      if (data.status === 200) return data.data;
      return [];
    } catch (e) {
      console.error('musicApi.getSubcategories', e);
      return [];
    }
  },

  getSongsForSubcategory: async (subId: number) => {
    try {
      const res = await fetch(`${API_URL}/subcategory/${subId}/songs`);
      const data = await res.json();
      if (data.status === 200) return data.data;
      return [];
    } catch (e) {
      console.error('musicApi.getSongsForSubcategory', e);
      return [];
    }
  },

  // Playlists
  createPlaylist: async (owner_login: string, name: string, is_public = false) => {
    try {
      const res = await fetch(`${API_URL}/playlist/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_login, name, is_public })
      });
      return await res.json();
    } catch (e) {
      console.error('musicApi.createPlaylist', e);
      return { status: 500, message: e.message };
    }
  },

  getUserPlaylists: async (username: string) => {
    try {
      const res = await fetch(`${API_URL}/playlists/${username}`);
      const data = await res.json();
      if (data.status === 200) return data.data;
      return [];
    } catch (e) {
      console.error('musicApi.getUserPlaylists', e);
      return [];
    }
  },

  deletePlaylist: async (folderId: number) => {
    try {
      const res = await fetch(`${API_URL}/remove/${folderId}`);
      return await res.json();
    } catch (e) {
      console.error('musicApi.deletePlaylist', e);
      return { status: 500, message: e.message };
    }
  },

  addSongToPlaylist: async (playlistId: number, payload: any) => {
    try {
      const res = await fetch(`${API_URL}/playlist/${playlistId}/addSong`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      console.error('musicApi.addSongToPlaylist', e);
      return { status: 500, message: e.message };
    }
  },

  removeSongFromPlaylist: async (playlistId: number, songId: number) => {
    try {
      const res = await fetch(`${API_URL}/playlist/${playlistId}/remove/${songId}`);
      return await res.json();
    } catch (e) {
      console.error('musicApi.removeSongFromPlaylist', e);
      return { status: 500, message: e.message };
    }
  },

  getFriendsPlaylists: async (username: string) => {
    try {
      const res = await fetch(`${API_URL}/friends/${username}`);
      const data = await res.json();
      if (data.status === 200) return data.data;
      return [];
    } catch (e) {
      console.error('musicApi.getFriendsPlaylists', e);
      return [];
    }
  },

  getPlaylistSongs: async (playlistId: number) => {
    try {
      const res = await fetch(`${API_URL}/playlist/${playlistId}/songs`);
      const data = await res.json();
      if (data.status === 200) return data.data;
      return [];
    } catch (e) {
      console.error('musicApi.getPlaylistSongs', e);
      return [];
    }
  }
};

export default musicApi;
