const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const db = mysql.createPool({
  connectionLimit: 10, // Liczba połączeń w puli
  host: "localhost", //'database-1.c7guqe88wzlr.us-east-1.rds.amazonaws.com',// //
  user: "root", //"admin",
  password: "", //"admin123",
  database: "app_db",
  port: 3307,
});

// const db = mysql.createPool({
//     connectionLimit: 10, // Liczba połączeń w puli
//     host: 'localhost', // Zmiana na lokalny serwer MySQL w XAMPP
//     user: 'root', // Domyślny użytkownik MySQL w XAMPP to 'root'
//     password: '', // Domyślnie XAMPP nie ma hasła dla użytkownika 'root'
//     database: 'yt', // Nazwa bazy danych
//     port: 3306 // Standardowy port MySQL
// });
module.exports = db;
