const path = require("path");
const fs = require("fs");
const multer = require("multer");
const db = require("../database/db");

// 🔸 Konfiguracja folderu i nazwy pliku
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadPath))
      fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// 🔸 Tworzenie tabeli jeśli nie istnieje
const createFilesTableQuery = `
CREATE TABLE IF NOT EXISTS Files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  filepath VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

const createFoldersTableQuery = `
CREATE TABLE IF NOT EXISTS Folders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL,
  foldername VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

db.promise()
  .query(createFilesTableQuery)
  .then(() => console.log("✅ Tabela Files gotowa!"))
  .catch((err) =>
    console.error("❌ Błąd przy tworzeniu tabeli Files:", err.message)
  );

db.promise()
  .query(createFoldersTableQuery)
  .then(() => console.log("✅ Tabela Folders gotowa!"))
  .catch((err) =>
    console.error("❌ Błąd przy tworzeniu tabeli Folders:", err.message)
  );

// 🔹 Dodawanie pliku
module.exports.addFile = [
  upload.any(),
  async (req, res) => {
    const { username, category } = req.body;
    const file = req.files && req.files[0];

    if (!file) {
      return res
        .status(400)
        .json({ status: 400, message: "Nie przesłano pliku" });
    }

    try {
      const insertQuery = `
        INSERT INTO Files (username, filename, category, filepath)
        VALUES (?, ?, ?, ?)
      `;
      const values = [username, file.originalname, category, file.filename];

      await db.promise().query(insertQuery, values);

      res.status(200).json({
        status: 200,
        message: "📁 Plik dodany pomyślnie",
      });
    } catch (err) {
      res.status(400).json({ status: 400, message: err.message });
    }
  },
];

// 🔹 Pobieranie wszystkich plików użytkownika
module.exports.getUserFiles = async (req, res) => {
  const { username } = req.params;

  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM Files WHERE username = ?", [username]);
    res.status(200).json({ status: 200, data: rows });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Dodawanie folderu
module.exports.addFolder = async (req, res) => {
  const { username, foldername } = req.body;

  if (!username || !foldername) {
    return res.status(400).json({
      status: 400,
      message: "Brak wymaganych danych (username, foldername)",
    });
  }

  try {
    const insertQuery = `
      INSERT INTO Folders (username, foldername)
      VALUES (?, ?)
    `;
    await db.promise().query(insertQuery, [username, foldername]);

    res.status(200).json({
      status: 200,
      message: "📁 Folder dodany pomyślnie",
    });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Pobieranie folderów użytkownika
module.exports.getUserFolders = async (req, res) => {
  const { username } = req.params;

  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM Folders WHERE username = ? ORDER BY created_at DESC", [username]);
    res.status(200).json({ status: 200, data: rows });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Pobieranie plików udostępnionych wszystkim (niezależnie od znajomych)
module.exports.getSharedFiles = async (req, res) => {
  try {
    const [rows] = await db.promise().query(
      `SELECT DISTINCT f.* 
         FROM Files f 
         JOIN FileShares fs ON f.id = fs.file_id`
    );
    res.status(200).json({ status: 200, data: rows });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Pobieranie pliku (download)
module.exports.downloadFile = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM Files WHERE id = ?", [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Plik nie istnieje",
      });
    }

    const file = rows[0];
    const filePath = path.join(__dirname, "../uploads", file.filepath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        status: 404,
        message: "Plik nie został znaleziony na serwerze",
      });
    }

    res.download(filePath, file.filename);
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Usuwanie pliku
module.exports.deleteFile = async (req, res) => {
  const { id, username } = req.params;

  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM Files WHERE id = ? AND username = ?", [
        id,
        username,
      ]);
    if (rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Plik nie istnieje lub nie należy do Ciebie",
      });
    }

    const file = rows[0];
    const filePath = path.join(__dirname, "../uploads", file.filepath);

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Usuwanie powiązanych udostępnień
    await db.promise().query("DELETE FROM FileShares WHERE file_id = ?", [id]);

    await db.promise().query("DELETE FROM Files WHERE id = ?", [id]);
    res
      .status(200)
      .json({ status: 200, message: "🗑️ Plik usunięty pomyślnie" });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Pobierz listę użytkowników którym plik został udostępniony
module.exports.getFileShares = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db
      .promise()
      .query("SELECT shared_with FROM FileShares WHERE file_id = ?", [id]);
    res.status(200).json({ status: 200, data: rows });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};
