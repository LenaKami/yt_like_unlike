const db = require("../database/db");

// 🔸 Tworzenie tabeli Friends (lista znajomych w JSON)
const createFriendsTableQuery = `
CREATE TABLE IF NOT EXISTS Friends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  friends JSON DEFAULT '[]'
);
`;

// 🔸 Tworzenie tabeli FileShares
const createFileSharesTableQuery = `
CREATE TABLE IF NOT EXISTS FileShares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_id INT NOT NULL,
  shared_with VARCHAR(100) NOT NULL,
  FOREIGN KEY (file_id) REFERENCES Files(id) ON DELETE CASCADE
);
`;

db.promise()
  .query(createFriendsTableQuery)
  .then(() => console.log("✅ Tabela Friends gotowa!"))
  .catch((err) =>
    console.error("❌ Błąd przy tworzeniu tabeli Friends:", err.message)
  );

db.promise()
  .query(createFileSharesTableQuery)
  .then(() => console.log("✅ Tabela FileShares gotowa!"))
  .catch((err) =>
    console.error("❌ Błąd przy tworzeniu tabeli FileShares:", err.message)
  );

// 🔹 Dodawanie znajomego (symetrycznie)
module.exports.addFriend = async (req, res) => {
  const { username, friend_username } = req.body;

  if (username === friend_username) {
    return res
      .status(400)
      .json({ status: 400, message: "Nie możesz dodać siebie" });
  }

  try {
    // 🔹 Sprawdzenie czy friend_username istnieje w Users
    const [userCheck] = await db
      .promise()
      .query("SELECT * FROM Users WHERE login = ?", [friend_username]);

    if (userCheck.length === 0) {
      return res
        .status(404)
        .json({ status: 404, message: "Użytkownik nie istnieje" });
    }

    // 🔹 Funkcja pomocnicza: dodaje do listy JSON i tworzy wiersz jeśli brak
    const addToFriends = async (user, friend) => {
      const [rows] = await db
        .promise()
        .query("SELECT * FROM Friends WHERE username = ?", [user]);

      if (rows.length === 0) {
        await db
          .promise()
          .query("INSERT INTO Friends (username, friends) VALUES (?, ?)", [
            user,
            JSON.stringify([friend]),
          ]);
      } else {
        const currentFriends = JSON.parse(rows[0].friends || "[]");
        if (!currentFriends.includes(friend)) {
          currentFriends.push(friend);
          await db
            .promise()
            .query("UPDATE Friends SET friends = ? WHERE username = ?", [
              JSON.stringify(currentFriends),
              user,
            ]);
        }
      }
    };

    // 🔹 Dodaj symetrycznie: username ↔ friend_username
    await addToFriends(username, friend_username);
    await addToFriends(friend_username, username);

    res.status(200).json({
      status: 200,
      message: `✅ Znajomość między ${username} a ${friend_username} dodana pomyślnie`,
    });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Pobieranie listy znajomych
module.exports.getFriends = async (req, res) => {
  const { username } = req.params;

  try {
    const [rows] = await db
      .promise()
      .query("SELECT friends FROM Friends WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(200).json({ status: 200, data: [] });
    }

    const friends = JSON.parse(rows[0].friends || "[]");
    res.status(200).json({ status: 200, data: friends });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Usuwanie znajomego (symetrycznie)
module.exports.removeFriend = async (req, res) => {
  const { username } = req.params;
  const { friend_username } = req.body;

  try {
    const removeFromFriends = async (user, friend) => {
      const [rows] = await db
        .promise()
        .query("SELECT * FROM Friends WHERE username = ?", [user]);

      if (rows.length === 0) return;

      let currentFriends = JSON.parse(rows[0].friends || "[]");
      currentFriends = currentFriends.filter((f) => f !== friend);

      await db
        .promise()
        .query("UPDATE Friends SET friends = ? WHERE username = ?", [
          JSON.stringify(currentFriends),
          user,
        ]);
    };

    // 🔹 Usuń symetrycznie
    await removeFromFriends(username, friend_username);
    await removeFromFriends(friend_username, username);

    res.status(200).json({
      status: 200,
      message: `✅ Znajomość między ${username} a ${friend_username} usunięta`,
    });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Udostępnianie pliku znajomemu
// 🔹 Udostępnianie pliku znajomemu (tylko znajomemu)
module.exports.shareFileWithFriend = async (req, res) => {
  const { file_id, shared_with } = req.body;
  const { username } = req.params; // właściciel pliku
  console.log(username);

  try {
    // 🔹 Sprawdzenie czy plik istnieje i należy do username
    const [files] = await db
      .promise()
      .query("SELECT * FROM Files WHERE id = ? AND username = ?", [
        file_id,
        username,
      ]);

    if (files.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Plik nie istnieje lub nie należy do Ciebie",
      });
    }

    // 🔹 Sprawdzenie czy shared_with jest znajomym
    const [friendRows] = await db
      .promise()
      .query("SELECT friends FROM Friends WHERE username = ?", [username]);

    console.log(friendRows);

    const friends =
      friendRows.length > 0 ? JSON.parse(friendRows[0].friends || "[]") : [];

    console.log(friends);

    if (!friends.includes(shared_with)) {
      return res.status(400).json({
        status: 400,
        message: "Plik można udostępnić tylko znajomemu",
      });
    }

    // 🔹 Sprawdzenie czy już udostępniono
    const [shares] = await db
      .promise()
      .query("SELECT * FROM FileShares WHERE file_id = ? AND shared_with = ?", [
        file_id,
        shared_with,
      ]);

    if (shares.length > 0) {
      return res.status(400).json({
        status: 400,
        message: "Plik już udostępniony temu znajomemu",
      });
    }

    // 🔹 Dodanie wpisu w FileShares
    await db
      .promise()
      .query("INSERT INTO FileShares (file_id, shared_with) VALUES (?, ?)", [
        file_id,
        shared_with,
      ]);

    res.status(200).json({
      status: 200,
      message: `🔗 Plik udostępniony użytkownikowi ${shared_with}`,
    });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Cofanie udostępnienia
module.exports.unshareFileWithFriend = async (req, res) => {
  const { file_id, shared_with } = req.body;

  try {
    await db
      .promise()
      .query("DELETE FROM FileShares WHERE file_id = ? AND shared_with = ?", [
        file_id,
        shared_with,
      ]);

    res.status(200).json({
      status: 200,
      message: `🚫 Plik przestał być udostępniany użytkownikowi ${shared_with}`,
    });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Pobieranie plików udostępnionych danemu użytkownikowi
module.exports.getFilesSharedWithUser = async (req, res) => {
  const { username } = req.params;

  try {
    const [rows] = await db.promise().query(
      `SELECT f.*
       FROM Files f
       JOIN FileShares fs ON f.id = fs.file_id
       WHERE fs.shared_with = ?`,
      [username]
    );

    res.status(200).json({ status: 200, data: rows });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};
