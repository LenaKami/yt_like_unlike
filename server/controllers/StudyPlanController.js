const db = require('../database/db');

// Ensure study-related tables exist
const createStudyPlanTableQuery = `
  CREATE TABLE IF NOT EXISTS StudyPlans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_login VARCHAR(100) NOT NULL,
    title VARCHAR(255) DEFAULT 'Mój plan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

const createLessonsTableQuery = `
  CREATE TABLE IF NOT EXISTS Lessons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_at DATETIME,
    duration_minutes INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES StudyPlans(id) ON DELETE CASCADE
  );
`;

db.promise()
  .query(createStudyPlanTableQuery)
  .then(() => console.log("✅ Tabela StudyPlans jest gotowa!"))
  .catch((err) => console.error("❌ Błąd przy tworzeniu tabeli StudyPlans:", err.message));

// Ensure unique index on user_login to prevent duplicate plans per user
db.promise()
  .query('ALTER TABLE StudyPlans ADD UNIQUE INDEX unique_user_login (user_login)')
  .then(() => console.log('✅ Indeks unique_user_login dodany'))
  .catch(() => {});

db.promise()
  .query(createLessonsTableQuery)
  .then(() => console.log("✅ Tabela Lessons jest gotowa!"))
  .catch((err) => console.error("❌ Błąd przy tworzeniu tabeli Lessons:", err.message));

module.exports = {
  // Create a new study plan for a user
  addPlan: async (req, res) => {
    try {
      const { user_login, title } = req.body;
      if (!user_login) return res.status(400).json({ status: 400, message: 'Brak user_login' });
      // Try to insert only if not exists (works even without unique index)
      const insertQuery = `
        INSERT INTO StudyPlans (user_login, title)
        SELECT ?, ? FROM DUAL
        WHERE NOT EXISTS (SELECT 1 FROM StudyPlans WHERE user_login = ?)
      `;
      await db.promise().query(insertQuery, [user_login, title || 'Mój plan', user_login]);
      // return the plan (either existing or newly created)
      const [rows] = await db.promise().query('SELECT * FROM StudyPlans WHERE user_login = ?', [user_login]);
      if (rows && rows.length > 0) return res.status(200).json({ status: 200, data: { id: rows[0].id }, message: 'Plan gotowy' });
      // fallback
      res.status(500).json({ status: 500, message: 'Nie udało się utworzyć planu' });
    } catch (err) {
      console.error('addPlan error:', err);
      res.status(500).json({ status: 500, message: err.message });
    }
  },

  // Get all plans for a user
  getPlansForUser: async (req, res) => {
    try {
      const username = req.params.username;
      const [rows] = await db.promise().query('SELECT * FROM StudyPlans WHERE user_login = ?', [username]);
      res.status(200).json({ status: 200, data: rows });
    } catch (err) {
      res.status(500).json({ status: 500, message: err.message });
    }
  },

  // Delete a plan (and cascade lessons)
  deletePlan: async (req, res) => {
    try {
      const id = req.params.id;
      await db.promise().query('DELETE FROM StudyPlans WHERE id = ?', [id]);
      res.status(200).json({ status: 200, message: 'Plan usunięty' });
    } catch (err) {
      res.status(500).json({ status: 500, message: err.message });
    }
  },

  // Add lesson to a plan
  addLesson: async (req, res) => {
    try {
      let { plan_id, title, description, scheduled_at, duration_minutes } = req.body;
      if (!plan_id || !title) return res.status(400).json({ status: 400, message: 'Brak plan_id lub title' });
      // normalize plan_id to integer
      plan_id = parseInt(plan_id, 10);
      if (isNaN(plan_id)) return res.status(400).json({ status: 400, message: 'Nieprawidłowe plan_id' });
      // normalize datetime: accept both 'T' and space
      if (scheduled_at && typeof scheduled_at === 'string') {
        scheduled_at = scheduled_at.replace('T', ' ');
      }
      const [result] = await db.promise().query(
        'INSERT INTO Lessons (plan_id, title, description, scheduled_at, duration_minutes) VALUES (?,?,?,?,?)',
        [plan_id, title, description || null, scheduled_at || null, duration_minutes || 0]
      );
      res.status(200).json({ status: 200, data: { id: result.insertId }, message: 'Lekcja dodana' });
    } catch (err) {
      console.error('addLesson error:', err);
      res.status(500).json({ status: 500, message: err.message });
    }
  },

  // Get lessons for a plan
  getLessonsForPlan: async (req, res) => {
    try {
      const planId = req.params.planId;
      const [rows] = await db.promise().query('SELECT * FROM Lessons WHERE plan_id = ? ORDER BY scheduled_at ASC, created_at ASC', [planId]);
      res.status(200).json({ status: 200, data: rows });
    } catch (err) {
      res.status(500).json({ status: 500, message: err.message });
    }
  },

  // Update lesson
  updateLesson: async (req, res) => {
    try {
      const id = req.params.id;
      const { title, description, scheduled_at, duration_minutes, completed } = req.body;
      const [rows] = await db.promise().query('SELECT * FROM Lessons WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ status: 404, message: 'Lekcja nie znaleziona' });
      await db.promise().query(
        'UPDATE Lessons SET title = ?, description = ?, scheduled_at = ?, duration_minutes = ?, completed = ? WHERE id = ?',
        [title || rows[0].title, description || rows[0].description, scheduled_at || rows[0].scheduled_at, duration_minutes ?? rows[0].duration_minutes, completed ?? rows[0].completed, id]
      );
      res.status(200).json({ status: 200, message: 'Lekcja zaktualizowana' });
    } catch (err) {
      res.status(500).json({ status: 500, message: err.message });
    }
  },

  // Delete lesson
  deleteLesson: async (req, res) => {
    try {
      const id = req.params.id;
      await db.promise().query('DELETE FROM Lessons WHERE id = ?', [id]);
      res.status(200).json({ status: 200, message: 'Lekcja usunięta' });
    } catch (err) {
      res.status(500).json({ status: 500, message: err.message });
    }
  }
};
