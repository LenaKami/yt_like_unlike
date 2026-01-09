const db = require('../database/db');

// Create music-related tables
const createMusicCategories = `
  CREATE TABLE IF NOT EXISTS MusicCategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const createMusicSubcategories = `
  CREATE TABLE IF NOT EXISTS MusicSubcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES MusicCategories(id) ON DELETE CASCADE
  );
`;

const createSongs = `
  CREATE TABLE IF NOT EXISTS Songs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subcategory_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    source VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subcategory_id) REFERENCES MusicSubcategories(id) ON DELETE CASCADE
  );
`;

const createPlaylists = `
  CREATE TABLE IF NOT EXISTS Playlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_login VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const createPlaylistSongs = `
  CREATE TABLE IF NOT EXISTS PlaylistSongs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    playlist_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    source VARCHAR(255),
    song_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (playlist_id) REFERENCES Playlists(id) ON DELETE CASCADE
  );
`;

const initDb = async () => {
  await db.promise().query(createMusicCategories);
  await db.promise().query(createMusicSubcategories);
  await db.promise().query(createSongs);
  await db.promise().query(createPlaylists);
  await db.promise().query(createPlaylistSongs);

  await seedCategories();
  await seedSubcategories();
  await seedMathSongs();
  await seedPhysicsSongs();
  await seedPopSongs();
  await seedRapSongs();
  await seedWarszawaSongs();
  await seedWroclawSongs();
};

initDb();
// seed top-level categories if missing
const seedCategories = async () => {
  try {
    const categories = ['Nauka','Lokalizacja','Gatunki'];
    for (const name of categories) {
      const [rows] = await db.promise().query('SELECT id FROM MusicCategories WHERE name = ?', [name]);
      if (rows.length === 0) {
        await db.promise().query('INSERT INTO MusicCategories (name) VALUES (?)', [name]);
      }
    }
    console.log('✅ Music categories seeded');
  } catch (e) {
    console.error('Seed categories error', e.message);
  }
};

// seed subcategories for seeded categories
const seedSubcategories = async () => {
  try {
    const mapping = {
      'Nauka': ['Matematyka','Fizyka'],
      'Lokalizacja': ['Wrocław','Warszawa'],
      'Gatunki': ['Rap','Pop']
    };

    const [cats] = await db.promise().query('SELECT id, name FROM MusicCategories');
    const catMap = {};
    cats.forEach(c => { catMap[c.name] = c.id; });

    for (const [catName, subs] of Object.entries(mapping)) {
      const catId = catMap[catName];
      if (!catId) continue;
      for (const subName of subs) {
        const [rows] = await db.promise().query('SELECT id FROM MusicSubcategories WHERE category_id = ? AND name = ?', [catId, subName]);
        if (rows.length === 0) {
          await db.promise().query('INSERT INTO MusicSubcategories (category_id, name) VALUES (?,?)', [catId, subName]);
        }
      }
    }
    console.log('✅ Music subcategories seeded');
  } catch (e) {
    console.error('Seed subcategories error', e.message);
  }
};

// seed songs for Matematyka
const seedMathSongs = async () => {
  try {
    // najpierw pobierz id subkategorii Matematyka
    const [subs] = await db.promise().query(
      'SELECT id FROM MusicSubcategories WHERE name = ?',
      ['Matematyka']
    );
    if (!subs.length) return console.error('No subcategory "Matematyka" found');
    const subId = subs[0].id;

    // przykładowa lista utworów do nauki matematyki
    const songs = [
      { title: 'Brian Eno - Music for Airports 1/1', source: 'https://www.youtube.com/watch?v=vNwYtllyt3Q' },
      { title: 'Johann Johannsson - Flight from the City', source: 'https://www.youtube.com/watch?v=AlftMNmDH00' },
      { title: 'Tycho - Montana', source: 'https://www.youtube.com/watch?v=Z6ih1aKeETk' },
      { title: 'Boards of Canada - Olson', source: 'https://www.youtube.com/watch?v=PzDupYdobnU' },
      { title: 'Aphex Twin - Avril 14th', source: 'https://www.youtube.com/watch?v=MBFXJw7n-fU' }
    ];

    for (const song of songs) {
      // sprawdź, czy już istnieje
      const [rows] = await db.promise().query(
        'SELECT id FROM Songs WHERE subcategory_id = ? AND title = ?',
        [subId, song.title]
      );
      if (rows.length === 0) {
        await db.promise().query(
          'INSERT INTO Songs (subcategory_id, title, source) VALUES (?,?,?)',
          [subId, song.title, song.source]
        );
      }
    }

    console.log('✅ Songs for Matematyka seeded');
  } catch (e) {
    console.error('Seed songs error', e.message);
  }
};

// seed songs for Fizyka
const seedPhysicsSongs = async () => {
  try {
    const [subs] = await db.promise().query(
      'SELECT id FROM MusicSubcategories WHERE name = ?',
      ['Fizyka']
    );
    if (!subs.length) return console.error('No subcategory "Fizyka" found');
    const subId = subs[0].id;

    const songs = [
      { title: 'Hans Zimmer - Time', source: 'https://www.youtube.com/watch?v=RxabLA7UQ9k' },
      { title: 'Max Richter - On the Nature of Daylight', source: 'https://www.youtube.com/watch?v=rVN1B-tUpgs' },
      { title: 'Nils Frahm - Says', source: 'https://www.youtube.com/watch?v=dIwwjy4slI8' },
      { title: 'Brian Eno - An Ending (Ascent)', source: 'https://www.youtube.com/watch?v=OlaTeXX3uH8' },
      { title: 'Trent Reznor & Atticus Ross - Hand Covers Bruise', source: 'https://www.youtube.com/watch?v=9SBNCYkSceU' },
      { title: 'Tycho - Awake', source: 'https://www.youtube.com/watch?v=9v6X-Dytlko' },
      { title: 'Boards of Canada - Dayvan Cowboy', source: 'https://www.youtube.com/watch?v=A2zKARkpDW4' }
    ];

    for (const song of songs) {
      const [rows] = await db.promise().query(
        'SELECT id FROM Songs WHERE subcategory_id = ? AND title = ?',
        [subId, song.title]
      );
      if (rows.length === 0) {
        await db.promise().query(
          'INSERT INTO Songs (subcategory_id, title, source) VALUES (?,?,?)',
          [subId, song.title, song.source]
        );
      }
    }

    console.log('✅ Songs for Fizyka seeded');
  } catch (e) {
    console.error('Seed physics songs error', e.message);
  }
};

const seedPopSongs = async () => {
  try {
    const [subs] = await db.promise().query(
      'SELECT id FROM MusicSubcategories WHERE name = ?',
      ['Pop']
    );
    if (!subs.length) {
      console.error('❌ Subcategory Pop not found');
      return;
    }

    const subId = subs[0].id;

    const songs = [
      { title: 'Dua Lipa - Levitating', source: 'https://www.youtube.com/watch?v=TUVcZfQe-Kw' },
      { title: 'The Weeknd - Blinding Lights', source: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ' },
      { title: 'Taylor Swift - Style', source: 'https://www.youtube.com/watch?v=-CmadmM5cOk' },
      { title: 'Harry Styles - As It Was', source: 'https://www.youtube.com/watch?v=H5v3kku4y6Q' },
      { title: 'Adele - Rolling in the Deep', source: 'https://www.youtube.com/watch?v=rYEDA3JcQqw' },
      { title: 'Billie Eilish - Ocean Eyes', source: 'https://www.youtube.com/watch?v=viimfQi_pUw' },
      { title: 'Coldplay - Viva La Vida', source: 'https://www.youtube.com/watch?v=dvgZkm1xWPE' },
      { title: 'Ed Sheeran - Shape of You', source: 'https://www.youtube.com/watch?v=JGwWNGJdvx8' },
      { title: 'Lana Del Rey - Summertime Sadness', source: 'https://www.youtube.com/watch?v=TdrL3QxjyVw' },
      { title: 'Imagine Dragons - Demons', source: 'https://www.youtube.com/watch?v=mWRsgZuwf_8' }
    ];

    for (const song of songs) {
      const [rows] = await db.promise().query(
        'SELECT id FROM Songs WHERE subcategory_id = ? AND title = ?',
        [subId, song.title]
      );

      if (rows.length === 0) {
        await db.promise().query(
          'INSERT INTO Songs (subcategory_id, title, source) VALUES (?,?,?)',
          [subId, song.title, song.source]
        );
      }
    }

    console.log('✅ Songs for Pop seeded');
  } catch (e) {
    console.error('Seed pop songs error', e.message);
  }
};

const seedRapSongs = async () => {
  try {
    const [subs] = await db.promise().query(
      'SELECT id FROM MusicSubcategories WHERE name = ?',
      ['Rap']
    );
    if (!subs.length) {
      console.error('❌ Subcategory Rap not found');
      return;
    }

    const subId = subs[0].id;

    const songs = [
      // 🇵🇱 Polska
      { title: 'Malik Montana x DaChoyce & The Plug - Jetlag', source: 'https://www.youtube.com/watch?v=xCBRhR11sJA' },
      { title: 'Kaz Bałagane feat. Oskar83 - Multisport', source: 'https://www.youtube.com/watch?v=gDcNzblrePw' },
      { title: 'Kaz Bałagane - Blueface (Feat. Młody Dron)', source: 'https://www.youtube.com/watch?v=wrXPXRULrBA' },
      { title: 'Malik Montana feat. K Koke - Robię Yeah', source: 'https://www.youtube.com/watch?v=u9sz3_Avmlo' },
      { title: 'Malik Montana & Mr.Polska - Jagodzianki', source: 'https://www.youtube.com/watch?v=JcV-q-Mv06U' },
      // 🌍 Zagranica
      { title: 'Eminem - Lose Yourself', source: 'https://www.youtube.com/watch?v=_Yhyp-_hX2s' },
      { title: 'Kendrick Lamar - HUMBLE.', source: 'https://www.youtube.com/watch?v=tvTRZJ-4EyI' },
      { title: 'J. Cole - No Role Modelz', source: 'https://www.youtube.com/watch?v=_CL6n0FJZpk' },
      { title: 'Nas - If I Ruled The World', source: 'https://www.youtube.com/watch?v=mlp-IIG9ApU' },
      { title: 'Mac Miller - Self Care', source: 'https://www.youtube.com/watch?v=SsKT0s5J8ko' }
    ];

    for (const song of songs) {
      const [rows] = await db.promise().query(
        'SELECT id FROM Songs WHERE subcategory_id = ? AND title = ?',
        [subId, song.title]
      );

      if (rows.length === 0) {
        await db.promise().query(
          'INSERT INTO Songs (subcategory_id, title, source) VALUES (?,?,?)',
          [subId, song.title, song.source]
        );
      }
    }

    console.log('✅ Songs for Rap (PL + global) seeded');
  } catch (e) {
    console.error('Seed rap songs error', e.message);
  }
};

const seedWarszawaSongs = async () => {
  try {
    const [subs] = await db.promise().query(
      'SELECT id FROM MusicSubcategories WHERE name = ?',
      ['Warszawa']
    );
    if (!subs.length) {
      console.error('❌ Subcategory Warszawa not found');
      return;
    }

    const subId = subs[0].id;

    const songs = [
      { title: 'Taco Hemingway - Następna stacja', source: 'https://www.youtube.com/watch?v=TZgBIbqtDnQ' },
      { title: 'Taco Hemingway - 6 zer', source: 'https://www.youtube.com/watch?v=TKO8zmF98nI' },
      { title: 'Mata - Będę Prezydentem', source: 'https://www.youtube.com/watch?v=LSJWfqWK6aU' },
      { title: 'Taco Hemingway - Deszcz na betonie', source: 'https://www.youtube.com/watch?v=PCQs3vSJ6xA' },
      { title: 'Taco Hemingway - Marmur', source: 'https://www.youtube.com/watch?v=LopWRJj0i4k' },
      { title: 'Mata - Patointeligencja', source: 'https://www.youtube.com/watch?v=wTAibxp37vE' },
      { title: 'Sokół - Warszawa', source: 'https://www.youtube.com/watch?v=zvgbZFzwtds' },
    ];

    for (const song of songs) {
      const [rows] = await db.promise().query(
        'SELECT id FROM Songs WHERE subcategory_id = ? AND title = ?',
        [subId, song.title]
      );

      if (rows.length === 0) {
        await db.promise().query(
          'INSERT INTO Songs (subcategory_id, title, source) VALUES (?,?,?)',
          [subId, song.title, song.source]
        );
      }
    }

    console.log('✅ Warszawa songs seeded with Mata');
  } catch (e) {
    console.error('Seed Warszawa songs error', e.message);
  }
};

const seedWroclawSongs = async () => {
  try {
    const [subs] = await db.promise().query(
      'SELECT id FROM MusicSubcategories WHERE name = ?',
      ['Wrocław']
    );
    if (!subs.length) {
      console.error('❌ Subcategory Wrocław not found');
      return;
    }

    const subId = subs[0].id;

    const songs = [
      { title: 'Guzior - Blueberry', source: 'https://www.youtube.com/watch?v=vClqvioJETU' },
      { title: 'Guzior - Fala', source: 'https://www.youtube.com/watch?v=H30R1BUpRF8' },
      { title: 'Zdechły Osa - GTA Wrocław', source: 'https://www.youtube.com/watch?v=5ubUY3j_MJ0' },
      { title: 'Zdechły Osa - Patolove', source: 'https://www.youtube.com/watch?v=l44moJhbAyc' },
      { title: 'Guzior - Strzelam petem', source: 'https://www.youtube.com/watch?v=xT5BXK-ZIDU' },
      { title: 'Zdechły Osa - Zakochałem się w twojej matce', source: 'https://www.youtube.com/watch?v=21MAeOX1Bxc' },
    ];

    for (const song of songs) {
      const [rows] = await db.promise().query(
        'SELECT id FROM Songs WHERE subcategory_id = ? AND title = ?',
        [subId, song.title]
      );

      if (rows.length === 0) {
        await db.promise().query(
          'INSERT INTO Songs (subcategory_id, title, source) VALUES (?,?,?)',
          [subId, song.title, song.source]
        );
      }
    }

    console.log('✅ Wrocław songs seeded with real tracks');
  } catch (e) {
    console.error('Seed Wrocław songs error', e.message);
  }
};




module.exports = {
  getCategories: async (req,res) => {
    try {
      const [rows] = await db.promise().query('SELECT * FROM MusicCategories ORDER BY name');
      res.status(200).json({ status:200, data: rows });
    } catch (e) { res.status(500).json({ status:500, message: e.message }); }
  },

  getSubcategories: async (req,res) => {
    try {
      const categoryId = req.params.categoryId;
      const [rows] = await db.promise().query('SELECT * FROM MusicSubcategories WHERE category_id = ? ORDER BY name', [categoryId]);
      res.status(200).json({ status:200, data: rows });
    } catch (e) { res.status(500).json({ status:500, message: e.message }); }
  },

  getSongsForSubcategory: async (req,res) => {
    try {
      const subId = req.params.subId;
      const [rows] = await db.promise().query('SELECT * FROM Songs WHERE subcategory_id = ? ORDER BY created_at DESC', [subId]);
      res.status(200).json({ status:200, data: rows });
    } catch (e) { res.status(500).json({ status:500, message: e.message }); }
  },

  // Playlists
  createPlaylist: async (req,res) => {
    try {
      const { owner_login, name, is_public } = req.body;
      if (!owner_login || !name) return res.status(400).json({ status:400, message:'owner_login and name required' });
      const [result] = await db.promise().query('INSERT INTO Playlists (owner_login, name, is_public) VALUES (?,?,?)', [owner_login, name, !!is_public]);
      res.status(200).json({ status:200, data:{ id: result.insertId }, message:'Playlist created' });
    } catch(e){ res.status(500).json({ status:500, message: e.message }); }
  },

  getUserPlaylists: async (req,res) => {
    try {
      const username = req.params.username;
      const [rows] = await db.promise().query('SELECT * FROM Playlists WHERE owner_login = ? ORDER BY created_at DESC', [username]);
      res.status(200).json({ status:200, data: rows });
    } catch(e){ res.status(500).json({ status:500, message: e.message }); }
  },

  deletePlaylist: async (req, res) => {
    try {
      const folderId = req.params.id;
      console.log(`Deleting folder/playlist with id: ${folderId}`);

      // Usuń wszystkie piosenki w folderze/playlist
      await db.promise().query('DELETE FROM PlaylistSongs WHERE playlist_id = ?', [folderId]);
      await db.promise().query('DELETE FROM Playlists WHERE id = ?', [folderId]);
      res.status(200).json({ status: 200, message: 'Playlist deleted' });
    } catch (e) {
      console.error('deleteFolder error:', e);
      res.status(500).json({ status: 500, message: e.message });
    }
  },

  addSongToPlaylist: async (req,res) => {
    try {
      const playlistId = req.params.playlistId;
      const { title, source } = req.body;
      if (!title) return res.status(400).json({ status:400, message:'title required' });
      const [result] = await db.promise().query('INSERT INTO PlaylistSongs (playlist_id, title, source) VALUES (?,?,?)', [playlistId, title, source||null]);
      res.status(200).json({ status:200, message:'Song added to playlist', data:{ id: result.insertId } });
    } catch(e){ res.status(500).json({ status:500, message: e.message }); }
  },

  removeSongFromPlaylist: async (req,res) => {
    try {
      const { playlistId, songId } = req.params;
      await db.promise().query('DELETE FROM PlaylistSongs WHERE playlist_id = ? AND id = ?', [playlistId, songId]);
      res.status(200).json({ status:200, message:'Removed from playlist' });
    } catch(e){ res.status(500).json({ status:500, message: e.message }); }
  },

  // get playlists of friends
  getFriendsPlaylists: async (req,res) => {
    try {
      const username = req.params.username;
      const [frows] = await db.promise().query('SELECT friends FROM Friends WHERE username = ?', [username]);
      if (!frows.length) return res.status(200).json({ status:200, data: [] });
      const friends = JSON.parse(frows[0].friends || '[]');
      if (!friends.length) return res.status(200).json({ status:200, data: [] });
      const placeholders = friends.map(()=>'?').join(',');
      const [rows] = await db.promise().query(`SELECT * FROM Playlists WHERE owner_login IN (${placeholders}) ORDER BY created_at DESC`, friends);
      res.status(200).json({ status:200, data: rows });
    } catch(e){ res.status(500).json({ status:500, message: e.message }); }
  },

  // get songs from a playlist
  getPlaylistSongs: async (req,res) => {
    try {
      const playlistId = req.params.playlistId;
      const [rows] = await db.promise().query(
        `SELECT id, title, source FROM PlaylistSongs
         WHERE playlist_id = ?
         ORDER BY song_order ASC`,
        [playlistId]
      );
      res.status(200).json({ status:200, data: rows });
    } catch(e){ res.status(500).json({ status:500, message: e.message }); }
  }
};