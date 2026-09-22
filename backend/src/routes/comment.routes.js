const express = require("express");

const pool = require("../config/db");
const authenticate = require("../middleware/auth.middleware");

const router = express.Router();




// CREATE COMMENT
router.post(
  "/tasks/:taskId/comments",
  authenticate,
  async (req, res) => {
    try {
      const { taskId } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json({
          message: "Comment content is required",
        });
      }

      // Find task and its organization
      const taskResult = await pool.query(
        `SELECT
           t.id,
           p.organization_id
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         WHERE t.id = $1`,
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      const task = taskResult.rows[0];

      // Check organization membership
      const membershipResult = await pool.query(
        `SELECT role
         FROM memberships
         WHERE user_id = $1
         AND organization_id = $2`,
        [req.user.id, task.organization_id]
      );

      if (membershipResult.rows.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }

      const result = await pool.query(
        `INSERT INTO comments (
          task_id,
          user_id,
          content
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          task_id,
          user_id,
          content,
          created_at`,
        [
          taskId,
          req.user.id,
          content.trim(),
        ]
      );

      res.status(201).json({
        message: "Comment added successfully",
        comment: result.rows[0],
      });
    } catch (error) {
      console.error("Create comment error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);







// GET ALL COMMENTS
router.get(
  "/tasks/:taskId/comments",
  authenticate,
  async (req, res) => {
    try {
      const { taskId } = req.params;

      // Find task and its organization
      const taskResult = await pool.query(
        `SELECT
           t.id,
           p.organization_id
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         WHERE t.id = $1`,
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      const task = taskResult.rows[0];

      // Check organization membership
      const membershipResult = await pool.query(
        `SELECT role
         FROM memberships
         WHERE user_id = $1
         AND organization_id = $2`,
        [req.user.id, task.organization_id]
      );

      if (membershipResult.rows.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }

      const result = await pool.query(
        `SELECT
           c.id,
           c.task_id,
           c.user_id,
           u.name AS user_name,
           c.content,
           c.created_at
         FROM comments c
         JOIN users u ON u.id = c.user_id
         WHERE c.task_id = $1
         ORDER BY c.created_at ASC`,
        [taskId]
      );

      res.json({
        taskId: Number(taskId),
        comments: result.rows,
      });
    } catch (error) {
      console.error("Get comments error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);








// DELETE COMMENT
router.delete(
  "/tasks/:taskId/comments/:commentId",
  authenticate,
  async (req, res) => {
    try {
      const { taskId, commentId } = req.params;

      // Find task and organization
      const taskResult = await pool.query(
        `SELECT
           t.id,
           p.organization_id
         FROM tasks t
         JOIN projects p ON p.id = t.project_id
         WHERE t.id = $1`,
        [taskId]
      );

      if (taskResult.rows.length === 0) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      const task = taskResult.rows[0];

      // Check membership
      const membershipResult = await pool.query(
        `SELECT role
         FROM memberships
         WHERE user_id = $1
         AND organization_id = $2`,
        [req.user.id, task.organization_id]
      );

      if (membershipResult.rows.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }

      const role = membershipResult.rows[0].role;

      // Find comment
      const commentResult = await pool.query(
        `SELECT id, user_id
         FROM comments
         WHERE id = $1
         AND task_id = $2`,
        [commentId, taskId]
      );

      if (commentResult.rows.length === 0) {
        return res.status(404).json({
          message: "Comment not found",
        });
      }

      const comment = commentResult.rows[0];

      // MEMBER can only delete their own comment
      if (
        role === "MEMBER" &&
        comment.user_id !== req.user.id
      ) {
        return res.status(403).json({
          message: "Members can only delete their own comments",
        });
      }

      await pool.query(
        `DELETE FROM comments
         WHERE id = $1
         AND task_id = $2`,
        [commentId, taskId]
      );

      res.json({
        message: "Comment deleted successfully",
      });
    } catch (error) {
      console.error("Delete comment error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);




module.exports = router;