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
  shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;

db.promise()
  .query(createFilesTableQuery)
  .then(() => console.log("✅ Tabela Files gotowa!"))
  .catch((err) =>
    console.error("❌ Błąd przy tworzeniu tabeli Files:", err.message)
  );

// 🔹 Dodawanie pliku
module.exports.addFile = [
  upload.any(), // akceptujemy wszystkie pliki
  async (req, res) => {
    const { username, category } = req.body;
    const file = req.files && req.files[0]; // bierzemy pierwszy plik, jeśli jest

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

// 🔹 Pobieranie plików udostępnionych (shared = true)
module.exports.getSharedFiles = async (req, res) => {
  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM Files WHERE shared = true");
    res.status(200).json({ status: 200, data: rows });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Usuwanie pliku
module.exports.deleteFile = async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

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

    await db.promise().query("DELETE FROM Files WHERE id = ?", [id]);
    res
      .status(200)
      .json({ status: 200, message: "🗑️ Plik usunięty pomyślnie" });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Udostępnianie / cofanie udostępnienia
module.exports.toggleShareFile = async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

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

    const current = rows[0].shared;
    const newStatus = !current;

    await db
      .promise()
      .query("UPDATE Files SET shared = ? WHERE id = ?", [newStatus, id]);
    res.status(200).json({
      status: 200,
      message: newStatus
        ? "🔗 Plik został udostępniony"
        : "🚫 Plik przestał być udostępniany",
    });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};
