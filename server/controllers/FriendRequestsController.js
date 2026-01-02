const db = require("../database/db");

// 🔸 Tworzenie tabeli FriendRequests
const createFriendRequestsTableQuery = `
CREATE TABLE IF NOT EXISTS FriendRequests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  from_user VARCHAR(100) NOT NULL,
  to_user VARCHAR(100) NOT NULL,
  status ENUM('pending','accepted','rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_request (from_user, to_user)
);
`;

db.promise()
  .query(createFriendRequestsTableQuery)
  .then(() => console.log("✅ Tabela FriendRequests gotowa!"))
  .catch((err) =>
    console.error("❌ Błąd przy tworzeniu tabeli FriendRequests:", err.message)
  );

// Helper: dodaje znajomego do tabeli Friends (kopiuje logikę z FriendsController)
const addToFriends = async (user, friend) => {
  const [rows] = await db
    .promise()
    .query("SELECT friends FROM Friends WHERE username = ?", [user]);

  if (rows.length === 0) {
    await db
      .promise()
      .query("INSERT INTO Friends (username, friends) VALUES (?, ?)", [
        user,
        JSON.stringify([friend]),
      ]);
  } else {
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

// POST /friend/requests  — wysyłanie zaproszenia
module.exports.createRequest = async (req, res) => {
  const { from_user, to_user } = req.body;

  if (!from_user || !to_user) {
    return res.status(400).json({ status: 400, message: "Brak danych" });
  }

  if (from_user === to_user) {
    return res
      .status(400)
      .json({
        status: 400,
        message: "Nie możesz wysłać zaproszenia do siebie",
      });
  }

  try {
    // czy użytkownik istnieje
    const [userCheck] = await db
      .promise()
      .query("SELECT * FROM Users WHERE login = ?", [to_user]);
    if (userCheck.length === 0) {
      return res
        .status(404)
        .json({ status: 404, message: "Odbiorca nie istnieje" });
    }

    // czy już są znajomi
    const [friendsRows] = await db
      .promise()
      .query("SELECT friends FROM Friends WHERE username = ?", [from_user]);
    const friends = friendsRows.length
      ? JSON.parse(friendsRows[0].friends || "[]")
      : [];
    if (friends.includes(to_user)) {
      return res
        .status(400)
        .json({ status: 400, message: "Jesteście już znajomymi" });
    }

    // czy już istnieje pending request
    const [existing] = await db
      .promise()
      .query(
        "SELECT * FROM FriendRequests WHERE from_user = ? AND to_user = ? AND status = 'pending'",
        [from_user, to_user]
      );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ status: 400, message: "Zaproszenie już wysłane" });
    }

    await db
      .promise()
      .query("INSERT INTO FriendRequests (from_user, to_user) VALUES (?, ?)", [
        from_user,
        to_user,
      ]);

    res.status(200).json({ status: 200, message: "Zaproszenie wysłane" });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// GET /friend/requests/incoming/:username
module.exports.getIncoming = async (req, res) => {
  const { username } = req.params;
  try {
    const [rows] = await db
      .promise()
      .query(
        "SELECT * FROM FriendRequests WHERE to_user = ? ORDER BY created_at DESC",
        [username]
      );
    res.status(200).json({ status: 200, data: rows });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// GET /friend/requests/outgoing/:username
module.exports.getOutgoing = async (req, res) => {
  const { username } = req.params;
  try {
    const [rows] = await db
      .promise()
      .query(
        "SELECT * FROM FriendRequests WHERE from_user = ? ORDER BY created_at DESC",
        [username]
      );
    res.status(200).json({ status: 200, data: rows });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// POST /friend/requests/:id/accept
module.exports.acceptRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM FriendRequests WHERE id = ?", [id]);
    if (rows.length === 0)
      return res
        .status(404)
        .json({ status: 404, message: "Zaproszenie nie znalezione" });

    const request = rows[0];
    if (request.status !== "pending")
      return res
        .status(400)
        .json({
          status: 400,
          message: "Zaproszenie nie jest w stanie oczekującym",
        });

    // Dodaj do Friends symetrycznie
    await addToFriends(request.from_user, request.to_user);
    await addToFriends(request.to_user, request.from_user);

    // Usuń zaproszenie po zaakceptowaniu
    await db.promise().query("DELETE FROM FriendRequests WHERE id = ?", [id]);

    res.status(200).json({ status: 200, message: "Zaproszenie zaakceptowane" });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// POST /friend/requests/:id/reject
module.exports.rejectRequest = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM FriendRequests WHERE id = ?", [id]);
    if (rows.length === 0)
      return res
        .status(404)
        .json({ status: 404, message: "Zaproszenie nie znalezione" });

    if (rows[0].status !== "pending")
      return res
        .status(400)
        .json({
          status: 400,
          message: "Zaproszenie nie jest w stanie oczekującym",
        });

    await db
      .promise()
      .query("UPDATE FriendRequests SET status = 'rejected' WHERE id = ?", [
        id,
      ]);

    res.status(200).json({ status: 200, message: "Zaproszenie odrzucone" });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};

// DELETE /friend/requests/:id
module.exports.deleteRequest = async (req, res) => {
  const { id } = req.params;
  try {
    await db.promise().query("DELETE FROM FriendRequests WHERE id = ?", [id]);
    res.status(200).json({ status: 200, message: "Zaproszenie usunięte" });
  } catch (err) {
    res.status(400).json({ status: 400, message: err.message });
  }
};
