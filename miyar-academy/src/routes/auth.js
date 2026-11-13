const express = require("express");
const bcrypt = require("bcryptjs");
const { query } = require("../db");
const { signToken } = require("../middleware/auth");

const router = express.Router();

router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body || {};
    if (!username || !email || !password) {
      return res.status(400).json({ error: "username و email و password مطلوبة" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
    }
    const allowedRoles = ["Student", "Instructor", "Admin"];
    const assignedRole = allowedRoles.includes(role) ? role : "Student";
    const password_hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, created_at`,
      [username, email, password_hash, assignedRole]
    );
    const user = rows[0];
    res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    if (err.code === "23505" || err.code === "23P01") {
      return res.status(409).json({ error: "اسم المستخدم أو البريد الإلكتروني مستخدم مسبقًا" });
    }
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "email و password مطلوبة" });
    }
    const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }
    res.json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
      token: signToken(user),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
