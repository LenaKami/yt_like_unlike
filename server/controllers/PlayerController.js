const mysql = require('mysql2');
const db = require("../database/db");


const createPlayerTableQuery = `
  CREATE TABLE IF NOT EXISTS PlayerYT (
    _id INT AUTO_INCREMENT PRIMARY KEY,
    linkyt VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    likes JSON NOT NULL,
    unlikes JSON NOT NULL,
    countlike INT DEFAULT 0,
    countunlike INT DEFAULT 0
  );
`;


db.promise().query(createPlayerTableQuery)
    .then(() => console.log("✅ Tabela PlayerYT jest gotowa!"))
    .catch(err => console.error("❌ Błąd przy tworzeniu tabeli PlayrYT:", err.message));


// Test połączenia
db.getConnection((err, connection) => {
    if (err) {
        console.error("❌ (player) Błąd połączenia z bazą danych:", err.message);
        return;
    }
    console.log("✅ Połączono z MySQL!");
    connection.release(); 
});

module.exports.addPlayerYT = async (req, res) => {
    const { linkyt, category } = req.body;

    try {
        const [rows] = await db.promise().query('SELECT * FROM PlayerYT WHERE linkyt = ?', [linkyt]);

        if (rows.length > 0) {
            return res.status(400).json({
                status: 400,
                message: "Player already exists",
            });
        }

        const insertQuery = `
            INSERT INTO PlayerYT (linkyt, category, likes, unlikes)
            VALUES (?, ?, '[]', '[]')
        `;
        const values = [linkyt, category];

        await db.promise().query(insertQuery, values);

        res.status(200).json({
            status: 200,
            message: "Player added successfully",
        });
    } catch (err) {
        res.status(400).json({
            status: 400,
            message: err.message,
        });
    }
};

module.exports.updatePlayerYT = async (req, res) => {
    const { id } = req.params;
    const { linkyt, category } = req.body;
console.log(id);
    try {
        const [rows] = await db.promise().query('SELECT * FROM PlayerYT WHERE _id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "Player not found",
            });
        }

        const updateQuery = `
            UPDATE PlayerYT SET linkyt = ?, category = ? WHERE _id = ?
        `;
        const values = [linkyt, category, id];

        await db.promise().query(updateQuery, values);

        res.status(200).json({
            status: 200,
            message: "Player updated successfully",
        });
    } catch (err) {
        res.status(400).json({
            status: 400,
            message: err.message,
        });
    }
};

module.exports.deletePlayerYT = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.promise().query('SELECT * FROM PlayerYT WHERE _id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "Player not found",
            });
        }

        const deleteQuery = 'DELETE FROM PlayerYT WHERE _id = ?';
        await db.promise().query(deleteQuery, [id]);

        res.status(200).json({
            status: 200,
            message: "Player deleted successfully",
        });
    } catch (err) {
        res.status(400).json({
            status: 400,
            message: err.message,
        });
    }
};

module.exports.getAllPlayersYT = async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM PlayerYT');
        res.status(200).json({
            status: 200,
            data: rows,
        });
    } catch (err) {
        res.status(400).json({
            status: 400,
            message: err.message,
        });
    }
};

module.exports.getPlayerYT = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.promise().query('SELECT * FROM PlayerYT WHERE _id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "Player not found",
            });
        }

        res.status(200).json({
            status: 200,
            data: rows[0],
        });
    } catch (err) {
        res.status(400).json({
            status: 400,
            message: err.message,
        });
    }
};

module.exports.likePlayerYT = async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;
    console.log(username)

    try {
        const [rows] = await db.promise().query('SELECT * FROM PlayerYT WHERE _id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "Player not found",
            });
        }

        const player = rows[0];
        const likes = JSON.parse(player.likes);
        const unlikes = JSON.parse(player.unlikes);

        if (likes.includes(username)) {
            likes.splice(likes.indexOf(username), 1);  
        } else {
            likes.push(username); 
        }

        if (unlikes.includes(username)) {
            unlikes.splice(unlikes.indexOf(username), 1);  
        }

        const countlike = likes.length;
        const countunlike = unlikes.length;
        const updateQuery = `
            UPDATE PlayerYT
            SET likes = ?, unlikes = ?, countlike = ?, countunlike = ?
            WHERE _id = ?
        `;
        const values = [JSON.stringify(likes), JSON.stringify(unlikes), countlike, countunlike, id];

        await db.promise().query(updateQuery, values);

        res.status(200).json({
            status: 200,
            message: "Player is liked successfully",
        });
    } catch (err) {
        res.status(400).json({
            status: 400,
            message: err.message,
        });
    }
};

module.exports.unlikePlayerYT = async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;

    try {
        const [rows] = await db.promise().query('SELECT * FROM PlayerYT WHERE _id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                status: 404,
                message: "Player not found",
            });
        }

        const player = rows[0];
        const likes = JSON.parse(player.likes);
        const unlikes = JSON.parse(player.unlikes);

        if (unlikes.includes(username)) {
            unlikes.splice(unlikes.indexOf(username), 1); 
        } else {
            unlikes.push(username);  
        }

        if (likes.includes(username)) {
            likes.splice(likes.indexOf(username), 1); 
        }

        const countlike = likes.length;
        const countunlike = unlikes.length;

        const updateQuery = `
            UPDATE PlayerYT
            SET likes = ?, unlikes = ?, countlike = ?, countunlike = ?
            WHERE _id = ?
        `;
        const values = [JSON.stringify(likes), JSON.stringify(unlikes), countlike, countunlike, id];

        await db.promise().query(updateQuery, values);

        res.status(200).json({
            status: 200,
            message: "Player is disliked successfully",
        });
    } catch (err) {
        res.status(400).json({
            status: 400,
            message: err.message,
        });
    }
};
