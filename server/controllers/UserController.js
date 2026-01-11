const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const db = require("../database/db");
var express = require("express");
var app = express();
dotenv.config();

// Get user's profile image
module.exports.getUserImage = async (req, res) => {
  const { username } = req.params;

  try {
    const [rows] = await db
      .promise()
      .query("SELECT profile_picture FROM Users WHERE login = ?", [username]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const fileName = rows[0].profile_picture;

    // If using default image or file doesn't exist, return 404
    if (fileName === "default.png") {
      return res.status(404).json({ message: "No custom profile picture" });
    }

    const filePath = path.join(__dirname, "../files", fileName);

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
  try {
    const { username } = req.params;

    if (!req.files || !req.files[0]) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileName = req.files[0].filename;

    // Get old profile picture to delete it
    const [rows] = await db
      .promise()
      .query("SELECT profile_picture FROM Users WHERE login = ?", [username]);

    if (rows.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.files[0].path);
      return res.status(404).json({ message: "User not found" });
    }

    const oldFileName = rows[0].profile_picture;

    // Update database with new file name
    await db
      .promise()
      .query("UPDATE Users SET profile_picture = ? WHERE login = ?", [
        fileName,
        username,
      ]);

    // Delete old file if it exists and is not default
    if (oldFileName !== "default.png") {
      const oldFilePath = path.join(__dirname, "../files", oldFileName);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    res.status(200).json({
      message: "Profile picture updated successfully",
      filename: fileName,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports.register = async (req, res) => {
  try {
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);

    const { login, email, password } = req.body;
    const role = false;

    const fileName =
      req.files && req.files[0] ? req.files[0].filename : "default.png";

    // Sprawdzenie, czy użytkownik już istnieje
    const [rows] = await db
      .promise()
      .query("SELECT * FROM Users WHERE email = ? OR login = ?", [
        email,
        login,
      ]);
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
    const result = await db
      .promise()
      .query(insertQuery, [login, email, hashedPassword, role, fileName]);
    console.log("✅ Użytkownik dodany do bazy:", result);

    // 🔹 Automatyczne dodanie test_user2 do znajomych
    try {
      const TEST_USER = "test_user2";

      // Sprawdzenie czy test_user2 istnieje
      const [testUserCheck] = await db
        .promise()
        .query("SELECT * FROM Users WHERE login = ?", [TEST_USER]);

      if (testUserCheck.length > 0) {
        // Dodaj test_user2 do znajomych nowego użytkownika
        const [newUserFriends] = await db
          .promise()
          .query("SELECT friends FROM Friends WHERE username = ?", [login]);

        if (newUserFriends.length === 0) {
          // Tworzenie nowego wpisu w tabeli Friends
          await db
            .promise()
            .query("INSERT INTO Friends (username, friends) VALUES (?, ?)", [
              login,
              JSON.stringify([TEST_USER]),
            ]);
        } else {
          // Dopisanie do istniejącej listy
          const friendsList = JSON.parse(newUserFriends[0].friends || "[]").map(
            (f) => f.trim()
          );
          if (!friendsList.includes(TEST_USER)) {
            friendsList.push(TEST_USER);
            await db
              .promise()
              .query("UPDATE Friends SET friends = ? WHERE username = ?", [
                JSON.stringify(friendsList),
                login,
              ]);
          }
        }

        // Dodaj nowego użytkownika do listy znajomych test_user2
        const [testUserFriends] = await db
          .promise()
          .query("SELECT friends FROM Friends WHERE username = ?", [TEST_USER]);

        if (testUserFriends.length === 0) {
          await db
            .promise()
            .query("INSERT INTO Friends (username, friends) VALUES (?, ?)", [
              TEST_USER,
              JSON.stringify([login]),
            ]);
        } else {
          const testFriendsList = JSON.parse(
            testUserFriends[0].friends || "[]"
          ).map((f) => f.trim());
          if (!testFriendsList.includes(login)) {
            testFriendsList.push(login);
            await db
              .promise()
              .query("UPDATE Friends SET friends = ? WHERE username = ?", [
                JSON.stringify(testFriendsList),
                TEST_USER,
              ]);
          }
        }

        console.log(
          `✅ Użytkownik ${login} dodany do znajomych z ${TEST_USER}`
        );
      }
    } catch (friendError) {
      console.error(
        "⚠️ Błąd przy dodawaniu test_user2 do znajomych:",
        friendError.message
      );
      // Błąd przy dodawaniu znajomego nie zatrzymuje rejestracji
    }

    // Tworzenie tokena JWT
    const token = jwt.sign({ email, role }, process.env.TOKEN_SECRET, {
      expiresIn: "1h",
    });

    res.status(200).json({
      message: "Rejestracja zakończona sukcesem",
      token,
      user: { login, email, role, profile_picture: fileName },
    });
  } catch (dbError) {
    console.error("❌ Błąd bazy danych:", dbError);
    res.status(500).json({ message: "Błąd serwera", error: dbError.message });
  }
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
