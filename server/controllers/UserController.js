const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const db = require("../database/db");
var express = require('express');
var app = express();
dotenv.config();

// 🔹 Tworzenie tabeli Users w MySQL, jeśli nie istnieje
const createUsersTableQuery = `
  CREATE TABLE IF NOT EXISTS Users (
    _id INT AUTO_INCREMENT PRIMARY KEY,
    login VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role BOOLEAN DEFAULT FALSE,
    profile_picture VARCHAR(255) DEFAULT 'default.png',  -- Ustawienie domyślnego zdjęcia
    last_active DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`;

db.promise()
  .query(createUsersTableQuery)
  .then(() => console.log("✅ Tabela Users jest gotowa!"))
  .catch((err) => console.error("❌ Błąd przy tworzeniu tabeli Users:", err.message));

// // 🔹 Sprawdzenie i utworzenie folderu `uploads/` jeśli nie istnieje
// const uploadDir = "uploads/";
// if (!fs.existsSync(uploadDir)) {
//   fs.mkdirSync(uploadDir, { recursive: true });
//   console.log("📂 Folder 'uploads/' został utworzony.");
// }

// // 🔹 Konfiguracja Multer
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, "uploads/");
// //   },
// //   filename: (req, file, cb) => {
// //     const uniqueSuffix = Date.now() + path.extname(file.originalname);
// //     cb(null, uniqueSuffix);
// //   },
// // });

// // const upload = multer({ storage: storage }).single("image");


// app.use(cors()); // Allow request from any IP

// const upload = multer({ 
//    dest: 'files/', // Location where files will be saved
// });

// app.post('/upload', upload.any(), function(req, res) {

//    console.log(req.body); // Text input
//    console.log(req.files); // Metadata about files (name, size, etc.)

// });

const upload = multer({ 
    dest: 'files/', // Location where files will be saved
  });

// Get user's profile image
module.exports.getUserImage = async (req, res) => {
  const { username } = req.params;
  
  try {
    const [rows] = await db.promise().query("SELECT profile_picture FROM Users WHERE login = ?", [username]);
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const fileName = rows[0].profile_picture;
    
    // If using default image or file doesn't exist, return 404
    if (fileName === 'default.png') {
      return res.status(404).json({ message: "No custom profile picture" });
    }
    
    const filePath = path.join(__dirname, '../files', fileName);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Image file not found" });
    }
    
    res.sendFile(filePath);
  } catch (error) {
    console.error("Error fetching user image:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Upload user's profile image
module.exports.uploadUserImage = async (req, res) => {
  const uploadSingle = multer({ dest: 'files/' }).single('image');
  
  uploadSingle(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: "Upload error", error: err.message });
    }
    
    const { username } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const fileName = req.file.filename;
    
    try {
      // Get old profile picture to delete it
      const [rows] = await db.promise().query("SELECT profile_picture FROM Users WHERE login = ?", [username]);
      
      if (rows.length === 0) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: "User not found" });
      }
      
      const oldFileName = rows[0].profile_picture;
      
      // Update database with new file name
      await db.promise().query("UPDATE Users SET profile_picture = ? WHERE login = ?", [fileName, username]);
      
      // Delete old file if it exists and is not default
      if (oldFileName !== 'default.png') {
        const oldFilePath = path.join(__dirname, '../files', oldFileName);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      
      res.status(200).json({ 
        message: "Profile picture updated successfully",
        filename: fileName 
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      console.error("Error updating profile picture:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  });
};

module.exports.register = (req, res) => {
  const upload = multer({ 
    dest: 'files/', // Location where files will be saved
  });
    upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ message: "Błąd przesyłania pliku", error: err.message });
    }
    console.log(req.body);
    const { login, email, password } = req.body;
      const role = false;
      console.log("email",email);
    
    const fileName = req.file ? req.file.filename : "default.png"; // Jeśli nie ma pliku, użyj domyślnego zdjęcia

    try {
      // Sprawdzenie, czy użytkownik już istnieje
      const [rows] = await db.promise().query("SELECT * FROM Users WHERE email = ?", [email]);
      if (rows.length > 0) {
        return res.status(400).json({ message: "Użytkownik już istnieje" });
      }

      // Haszowanie hasła
      const hashedPassword = await bcrypt.hash(password, 10);

      // Wstawianie użytkownika do bazy danych
      const insertQuery = `
        INSERT INTO Users (login, email, password, role, profile_picture)
        VALUES (?, ?, ?, ?, ?)
      `;
      await db.promise().query(insertQuery, [login, email, hashedPassword, role, fileName]);

      // Tworzenie tokena JWT
      const token = jwt.sign({ email, role }, process.env.JWT_SECRET, { expiresIn: "1h" });

      res.status(200).json({
        message: "Rejestracja zakończona sukcesem",
        token,
        user: { login, email, role, profile_picture: fileName },
      });
    } catch (dbError) {
      console.error("Błąd bazy danych:", dbError);
      res.status(500).json({ message: "Błąd serwera", error: dbError.message });
    }
  });
};

// app.post("/user/register", upload, async (req, res) => {
//   // Zapisane dane z formularza (login, email, password)
//   const { login, email, password } = req.body;
  
//   // Jeśli nie ma zdjęcia, przypisujemy domyślne
//   const fileName = req.file ? req.file.filename : "default.png";

//   try {
//     // Sprawdzenie, czy użytkownik już istnieje w bazie danych
//     const [rows] = await db.promise().query("SELECT * FROM Users WHERE email = ?", [email]);

//     if (rows.length > 0) {
//       return res.status(400).json({ message: "Użytkownik już istnieje" });
//     }

//     // Haszowanie hasła
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Wstawianie nowego użytkownika do bazy danych
//     const insertQuery = `
//       INSERT INTO Users (login, email, password, role, profile_picture)
//       VALUES (?, ?, ?, ?, ?)
//     `;
//     await db.promise().query(insertQuery, [login, email, hashedPassword, false, fileName]);

//     // Tworzenie tokena JWT (na potrzeby autoryzacji)
//     const token = jwt.sign({ email, role: false }, process.env.JWT_SECRET, { expiresIn: "1h" });

//     // Zwracamy odpowiedź z tokenem JWT i danymi użytkownika
//     res.status(200).json({
//       message: "Rejestracja zakończona sukcesem",
//       token,
//       user: { login, email, profile_picture: fileName },
//     });
//   } catch (error) {
//     console.error("Błąd przy rejestracji:", error);
//     res.status(500).json({ message: "Błąd serwera", error: error.message });
//   }
// });


// // const storage = multer.diskStorage({
// //     destination: function (req, file, cb) {
// //         cb(null, './uploads'); // Katalog, w którym będą przechowywane zdjęcia
// //     },
// //     filename: function (req, file, cb) {
// //         cb(null, Date.now() + path.extname(file.originalname)); // Unikalna nazwa pliku
// //     }
// // });

// // const upload = multer({ storage: storage });

// // module.exports.register = async (req, res) => {
// //     const { login, email, password } = req.body;
// //     const role = false;
// //     //let profilePictureName = null; // Zmienna na nazwę pliku

// //     try {
// //         // Sprawdzamy, czy użytkownik już istnieje
// //         const [rows] = await db.promise().query('SELECT * FROM Users WHERE email = ?', [email]);

// //         if (rows.length > 0) {
// //             return res.status(400).json({
// //                 status: 400,
// //                 message: "User already exists",
// //             });
// //         }

// //         // Haszowanie hasła
// //         const saltRounds = 10;
// //         const hashedPassword = await bcrypt.hash(password, saltRounds);

// //         // Jeśli zdjęcie jest przesyłane, zapisujemy jego nazwę
// //         // if (req.file) {
// //         //     profilePictureName = path.basename(req.file.path); // Zapisujemy tylko nazwę pliku
// //         // }

// //         // Tworzenie nowego użytkownika
// //         const insertQuery = `
// //             INSERT INTO Users (login, email, password, role)
// //             VALUES (?, ?, ?, ?)
// //         `;
// //         const values = [login, email, hashedPassword, role];

// //         const [result] = await db.promise().query(insertQuery, values);
// //         console.log(result);

// //         res.status(200).json({
// //             status: 200,
// //             message: "User registered successfully",
// //         });
// //     } catch (err) {
// //         res.status(400).json({
// //             status: 400,
// //             message: err.message,
// //         });
// //     }
// // };

// // module.exports.register = async (req, res) => {
// //   const { login, email, password } = req.body;
// //   const role = false;

// //   try {
// //       // Sprawdzamy, czy użytkownik już istnieje
// //       const [rows] = await db.promise().query('SELECT * FROM Users WHERE email = ?', [email]);

// //       if (rows.length > 0) {
// //           return res.status(400).json({
// //               status: 400,
// //               message: "User already exists",
// //           });
// //       }

// //       // Haszowanie hasła
// //       const saltRounds = 10;
// //       const hashedPassword = await bcrypt.hash(password, saltRounds);

// //       // Tworzenie nowego użytkownika
// //       const insertQuery = `
// //           INSERT INTO Users (login, email, password, role)
// //           VALUES (?, ?, ?, ?)
// //       `;
// //       const values = [login, email, hashedPassword, role];

// //       const [result] = await db.promise().query(insertQuery, values);
// // console.log(result); 

// //       res.status(200).json({
// //           status: 200,
// //           message: "User registered successfully",
// //       });
// //   } catch (err) {
// //       res.status(400).json({
// //           status: 400,
// //           message: err.message,
// //       });
// //   }
// // };
// // Logowanie użytkownika 
// /*
// module.exports.login = async (req, res) => {
//   const { login, password } = req.body;

//   try {
//       // Znajdź użytkownika na podstawie loginu
//       const [rows] = await db.promise().query('SELECT * FROM Users WHERE login = ?', [login]);

//       if (rows.length === 0) {
//           return res.status(400).json({
//               status: 400,
//               message: "User not found",
//           });
//       }

//       const user = rows[0];

//       // Porównanie hasła
//       const isMatch = await bcrypt.compare(password, user.password);
//       if (!isMatch) {
//           return res.status(400).json({
//               status: 400,
//               message: "Invalid password",
//           });
//       }

//       // Generowanie tokenu JWT
//       const accessToken = jwt.sign(
//           {
//               login: user.login,
//               email: user.email,
//               role: user.role,
//           },
//           process.env.TOKEN_SECRET,
//           { expiresIn: "1h" }
//       );

//       // Przechowywanie tokenu w ciasteczku
//       res.cookie("JWT", accessToken, {
//           maxAge: 600000, // 10 minut
//           secure: false,
//           httpOnly: true,
//       });

//       res.status(200).json({
//           status: 200,
//           message: "Login successful",
//           accessToken: accessToken,
//       });
//   } catch (err) {
//       res.status(500).json({
//           status: 500,
//           message: err.message,
//       });
//   }
// };*/

// // aktorzy Kto kierowca pasazer
// // co sie dzieje (zmiana, odwolanie)
// // procesy -> powiadomienia (artefakty, sms)
// // api 