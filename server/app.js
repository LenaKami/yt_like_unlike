var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./database/db.js");
var playerRouter = require("./routes/PlayerRoute.js");
var fileRouter = require("./routes/FileRouter.js");
var friendRouter = require("./routes/FriendRouter.js");
var friendRequestsRouter = require("./routes/FriendRequestsRouter.js");
const multer = require("multer");
const fs = require("fs");

var app = express();
dotenv.config();

// Konfiguracja Multera – lokalne zapisywanie plików
const upload = multer({ dest: "files/" });

// Tworzenie tabeli użytkowników, jeśli nie istnieje
const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS Users (
    _id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role BOOLEAN DEFAULT FALSE,
    profile_picture VARCHAR(255) DEFAULT 'default.png',
    last_active TIMESTAMP NULL DEFAULT NULL
  );
`;

db.promise()
  .query(createUsersTableQuery)
  .then(() => console.log("✅ Tabela Users jest gotowa!"))
  .catch((err) =>
    console.error("❌ Błąd przy tworzeniu tabeli Users:", err.message)
  );

// Spróbuj dodać kolumnę last_active jeśli nie istnieje (bez przerywania przy błędzie)
db.promise()
  .query(
    "ALTER TABLE Users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP NULL"
  )
  .then(() => console.log("✅ Kolumna last_active sprawdzona/dodana"))
  .catch(() => {});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  cors({
    origin: "*",
  })
);

app.use("/player", playerRouter);
app.use("/file", fileRouter);
app.use("/friend", friendRouter);
app.use("/friend/requests", friendRequestsRouter);

// ============================
// 📌 Rejestracja użytkownika
// ============================
app.post("/user/register", upload.any(), async function (req, res) {
  try {
    const { login, email, password } = req.body;
    const role = false;
    const fileName =
      req.files && req.files[0] ? req.files[0].filename : "default.png";

    // Sprawdź, czy użytkownik już istnieje
    const [existingUser] = await db
      .promise()
      .query("SELECT * FROM Users WHERE email = ? OR login = ?", [
        email,
        login,
      ]);
    if (existingUser.length > 0) {
      return res.status(400).json({
        message: "Użytkownik o takim loginie lub emailu już istnieje",
      });
    }

    // Hashowanie hasła
    const hashedPassword = await bcrypt.hash(password, 10);

    // Zapis do bazy
    const insertQuery = `
      INSERT INTO Users (login, email, password, role, profile_picture)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db
      .promise()
      .query(insertQuery, [login, email, hashedPassword, role, fileName]);

    res.status(200).json({
      message: "Rejestracja zakończona sukcesem",
      user: { login, email, role, profile_picture: fileName },
    });
  } catch (error) {
    console.error("❌ Błąd przy rejestracji:", error);
    res.status(500).json({ message: "Błąd serwera", error: error.message });
  }
});

// ============================
// 📌 Logowanie użytkownika
// ============================
app.post("/user/login", async function (req, res) {
  try {
    const { login, password } = req.body;

    // Sprawdź, czy użytkownik istnieje
    const [rows] = await db
      .promise()
      .query("SELECT * FROM Users WHERE login = ?", [login]);
    if (rows.length === 0) {
      return res.status(400).json({ message: "Użytkownik nie istnieje" });
    }

    const user = rows[0];

    // Sprawdzenie hasła
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Nieprawidłowe hasło" });
    }

    // Generowanie JWT
    const token = jwt.sign(
      {
        login: user.login,
        email: user.email,
        role: user.role,
        image: user.profile_picture,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      message: "Zalogowano pomyślnie",
      token,
      user: {
        login: user.login,
        email: user.email,
        role: user.role,
        image: `/files/${user.profile_picture}`,
      },
    });
  } catch (err) {
    console.error("❌ Błąd przy logowaniu:", err);
    res.status(500).json({ message: "Błąd serwera", error: err.message });
  }
});

// Aktualizuj pole last_active dla użytkownika
app.post("/user/active", async function (req, res) {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ message: "Brak username" });

    await db
      .promise()
      .query("UPDATE Users SET last_active = NOW() WHERE login = ?", [
        username,
      ]);
    res.status(200).json({ message: "OK" });
  } catch (err) {
    console.error("❌ Błąd przy aktualizacji last_active:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

// Wyszukiwanie użytkowników po prefiksie (query param `query`)
app.get("/user/search", async function (req, res) {
  try {
    const q = (req.query.query || "").toString().trim();
    if (!q) return res.status(200).json({ data: [] });

    const like = q + "%";
    const [rows] = await db
      .promise()
      .query(
        "SELECT login, profile_picture FROM Users WHERE login LIKE ? LIMIT 10",
        [like]
      );

    res.status(200).json({ data: rows });
  } catch (err) {
    console.error("❌ Błąd przy wyszukiwaniu użytkowników:", err);
    res.status(500).json({ message: "Błąd serwera" });
  }
});

app.listen(5000, () => {
  console.log(`✅ Serwer działa na http://localhost:5000`);
});

module.exports = app;
