const express = require("express");

const router = express.Router();

const pool = require("../config/db");
const authenticate = require("../middleware/auth.middleware");

router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        name,
        email
       FROM users
       ORDER BY name ASC`
    );

    res.json({
      users: result.rows,
    });
  } catch (error) {
    console.error("Get users error:", error.message);

    res.status(500).json({
      message: "Failed to fetch users",
    });
  }
});

module.exports = router;