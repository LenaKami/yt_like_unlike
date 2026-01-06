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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
    // 🔹 Sprawdzenie czy friend_username istnieje
    const [userCheck] = await db
      .promise()
      .query("SELECT * FROM Users WHERE login = ?", [friend_username]);

    if (userCheck.length === 0) {
      return res
        .status(404)
        .json({ status: 404, message: "Użytkownik nie istnieje" });
    }

    // 🔹 Helper: Dodaje friend do listy usera
    const addToFriends = async (user, friend) => {
      const [rows] = await db
        .promise()
        .query("SELECT friends FROM Friends WHERE username = ?", [user]);

      if (rows.length === 0) {
        // 🆕 Brak znajomych → Tworzymy wpis z 1 znajomym
        await db
          .promise()
          .query("INSERT INTO Friends (username, friends) VALUES (?, ?)", [
            user,
            JSON.stringify([friend]),
          ]);
      } else {
        // 🔄 Są znajomi → Dopisujemy kolejnego
        const list = JSON.parse(rows[0].friends || "[]").map((f) => f.trim());

        if (!list.includes(friend)) {
          list.push(friend);

          await db
            .promise()
            .query("UPDATE Friends SET friends = ? WHERE username = ?", [
              JSON.stringify(list),
              user,
            ]);
        }
      }
    };

    // 🔹 Dodaj znajomość symetrycznie
    await addToFriends(username, friend_username);
    await addToFriends(friend_username, username);

    res.status(200).json({
      status: 200,
      message: `🤝 Dodano znajomych: ${username} ⇄ ${friend_username}`,
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

// 🔹 Pobieranie aktywnych (online) znajomych — last_active w Users
module.exports.getOnlineFriends = async (req, res) => {
  const { username } = req.params;

  try {
    const [rows] = await db
      .promise()
      .query("SELECT friends FROM Friends WHERE username = ?", [username]);

    if (rows.length === 0) {
      return res.status(200).json({ status: 200, data: [] });
    }

    const friends = JSON.parse(rows[0].friends || "[]").map((f) => f.trim());

    if (friends.length === 0) {
      return res.status(200).json({ status: 200, data: [] });
    }

    // Pobierz użytkowników z last_active w ostatnich 2 minutach
    const placeholders = friends.map(() => "?").join(",");
    const query = `SELECT login, email, profile_picture, last_active FROM Users WHERE login IN (${placeholders}) AND last_active >= DATE_SUB(NOW(), INTERVAL 2 MINUTE)`;

    const [onlineRows] = await db.promise().query(query, friends);

    res.status(200).json({ status: 200, data: onlineRows });
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
module.exports.shareFileWithFriends = async (req, res) => {
  const { file_id } = req.body;
  const { username } = req.params;

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

    // 🔹 Pobranie wszystkich znajomych
    const [friendRows] = await db
      .promise()
      .query("SELECT friends FROM Friends WHERE username = ?", [username]);

    const friends =
      friendRows.length > 0
        ? JSON.parse(friendRows[0].friends || "[]").map((f) => f.trim())
        : [];

    if (friends.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Nie masz żadnych znajomych do udostępnienia pliku.",
      });
    }

    // 🔹 Pobranie istniejących udostępnień
    const [existingShares] = await db
      .promise()
      .query("SELECT shared_with FROM FileShares WHERE file_id = ?", [file_id]);

    const alreadyShared = existingShares.map((s) => s.shared_with);

    const newShared = friends.filter((f) => !alreadyShared.includes(f));

    // 🔹 Jeśli wszystkim już udostępniono
    if (newShared.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Plik jest już udostępniony wszystkim znajomym.",
      });
    }

    // 🔹 Dodanie wpisów dla wszystkich nowych znajomych
    const insertValues = newShared.map((friend) => [file_id, friend]);

    await db
      .promise()
      .query("INSERT INTO FileShares (file_id, shared_with) VALUES ?", [
        insertValues,
      ]);

    res.status(200).json({
      status: 200,
      message: "Plik udostępniony następującym znajomym:",
      shared_to: newShared,
    });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Cofanie udostępnienia
module.exports.unshareFileWithFriends = async (req, res) => {
  const { file_id } = req.body;
  const { username } = req.params;

  try {
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
    // 🔹 Pobranie listy użytkowników, którym plik był udostępniony
    const [sharedRows] = await db
      .promise()
      .query("SELECT shared_with FROM FileShares WHERE file_id = ?", [file_id]);

    if (sharedRows.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Ten plik nie był udostępniony żadnemu znajomemu.",
      });
    }

    const sharedTo = sharedRows.map((row) => row.shared_with);

    // 🔹 Usunięcie WSZYSTKICH udostępnień tego pliku
    await db
      .promise()
      .query("DELETE FROM FileShares WHERE file_id = ?", [file_id]);

    res.status(200).json({
      status: 200,
      message: "❌ Udostępnienie cofnięte wszystkim znajomym.",
      unshared_from: sharedTo,
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

// 🔹 Pobieranie 3 najnowszych plików udostępnionych przez znajomych użytkownika
module.exports.getRecentSharedByFriends = async (req, res) => {
  const { username } = req.params;
  try {
    // Debug: sprawdź co jest w FileShares dla tego użytkownika
    const [allShares] = await db
      .promise()
      .query(`SELECT * FROM FileShares WHERE shared_with = ?`, [username]);
    console.log(
      `[getRecentSharedByFriends] Shares for ${username}:`,
      allShares.length
    );

    // Pobierz 3 najnowsze pliki udostępnione dla tego użytkownika w ciągu ostatnich 7 dni
    const [files] = await db.promise().query(
      `SELECT f.id, f.username, f.filename, f.category, f.filepath, fs.created_at AS shared_at
       FROM Files f
       INNER JOIN FileShares fs ON f.id = fs.file_id
       WHERE fs.shared_with = ?
         AND fs.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       ORDER BY fs.created_at DESC
       LIMIT 3`,
      [username]
    );

    console.log(
      `[getRecentSharedByFriends] User: ${username}, Found files:`,
      files.length
    );

    res.status(200).json({ status: 200, data: files || [] });
  } catch (err) {
    console.error("[getRecentSharedByFriends] Error:", err.message);
    res.status(400).json({ status: 400, message: err.message });
  }
};

// 🔹 Udostępnianie pliku wybranym użytkownikom
module.exports.shareFileWithUsers = async (req, res) => {
  const { file_id, usernames } = req.body; // usernames to tablica loginów

  if (!file_id || !Array.isArray(usernames) || usernames.length === 0) {
    return res.status(400).json({
      status: 400,
      message: "Wymagane: file_id i usernames (tablica)",
    });
  }

  try {
    // Sprawdź czy plik istnieje
    const [files] = await db
      .promise()
      .query("SELECT * FROM Files WHERE id = ?", [file_id]);

    if (files.length === 0) {
      return res.status(404).json({
        status: 404,
        message: "Plik nie istnieje",
      });
    }

    // Sprawdź które użytkownicy istnieją
    const placeholders = usernames.map(() => "?").join(",");
    const [existingUsers] = await db
      .promise()
      .query(
        `SELECT login FROM Users WHERE login IN (${placeholders})`,
        usernames
      );

    const validUsernames = existingUsers.map((u) => u.login);

    if (validUsernames.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Żaden z podanych użytkowników nie istnieje",
      });
    }

    // Sprawdź już istniejące udostępnienia
    const [existingShares] = await db
      .promise()
      .query("SELECT shared_with FROM FileShares WHERE file_id = ?", [file_id]);

    const alreadyShared = existingShares.map((s) => s.shared_with);
    const newShared = validUsernames.filter((u) => !alreadyShared.includes(u));

    if (newShared.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Plik jest już udostępniony wybranym użytkownikom",
      });
    }

    // Dodaj nowe udostępnienia
    const insertValues = newShared.map((username) => [file_id, username]);
    await db
      .promise()
      .query("INSERT INTO FileShares (file_id, shared_with) VALUES ?", [
        insertValues,
      ]);

    res.status(200).json({
      status: 200,
      message: "✅ Plik udostępniony pomyślnie",
      shared_to: newShared,
    });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};
