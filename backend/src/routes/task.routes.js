const express = require("express");

const pool = require("../config/db");
const authenticate = require("../middleware/auth.middleware");

const router = express.Router();

// CREATE TASK
router.post(
  "/projects/:projectId/tasks",
  authenticate,
  async (req, res) => {
    try {
      const { projectId } = req.params;

      const {
        title,
        description,
        priority,
        assigned_to,
        due_date,
      } = req.body;

      if (!title || !title.trim()) {
        return res.status(400).json({
          message: "Task title is required",
        });
      }

      const allowedPriorities = ["LOW", "MEDIUM", "HIGH"];

      if (priority && !allowedPriorities.includes(priority)) {
        return res.status(400).json({
          message: "Priority must be LOW, MEDIUM or HIGH",
        });
      }
      if (due_date && isNaN(Date.parse(due_date))) {
          return res.status(400).json({
            message: "Invalid due date",
          });
        }

      // Check whether project exists
      const projectResult = await pool.query(
        `SELECT id, organization_id
         FROM projects
         WHERE id = $1`,
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const project = projectResult.rows[0];

      // Check whether user belongs to project's organization
      const membershipResult = await pool.query(
        `SELECT role
         FROM memberships
         WHERE user_id = $1
         AND organization_id = $2`,
        [req.user.id, project.organization_id]
      );

      if (membershipResult.rows.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }

      // If assigning task, check that assigned user is a member
      if (assigned_to) {
        const assignedUserResult = await pool.query(
          `SELECT id
           FROM memberships
           WHERE user_id = $1
           AND organization_id = $2`,
          [assigned_to, project.organization_id]
        );

        if (assignedUserResult.rows.length === 0) {
          return res.status(400).json({
            message: "Assigned user is not a member of this organization",
          });
        }
      }

      const result = await pool.query(
        `INSERT INTO tasks (
          project_id,
          title,
          description,
          priority,
          assigned_to,
          created_by,
          due_date
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          project_id,
          title,
          description,
          status,
          priority,
          assigned_to,
          created_by,
          due_date,
          created_at,
          updated_at`,
        [
          projectId,
          title.trim(),
          description?.trim() || null,
          priority || "MEDIUM",
          assigned_to || null,
          req.user.id,
          due_date || null,
        ]
      );

      res.status(201).json({
        message: "Task created successfully",
        task: result.rows[0],
      });
    } catch (error) {
      console.error("Create task error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);




// GET ALL TASKS FOR A PROJECT
router.get(
  "/projects/:projectId/tasks",
  authenticate,
  async (req, res) => {
    try {
      const { projectId } = req.params;

      // Check whether project exists
      const projectResult = await pool.query(
        `SELECT id, organization_id
         FROM projects
         WHERE id = $1`,
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const project = projectResult.rows[0];

      // Check whether user belongs to project's organization
      const membershipResult = await pool.query(
        `SELECT role
         FROM memberships
         WHERE user_id = $1
         AND organization_id = $2`,
        [req.user.id, project.organization_id]
      );

      if (membershipResult.rows.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }

      const result = await pool.query(
        `SELECT
           id,
           project_id,
           title,
           description,
           status,
           priority,
           assigned_to,
           created_by,
           due_date,
           created_at,
           updated_at
         FROM tasks
         WHERE project_id = $1
         ORDER BY created_at DESC`,
        [projectId]
      );

      res.json({
        projectId: Number(projectId),
        tasks: result.rows,
      });
    } catch (error) {
      console.error("Get tasks error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);




// GET SINGLE TASK
router.get(
  "/projects/:projectId/tasks/:taskId",
  authenticate,
  async (req, res) => {
    try {
      const { projectId, taskId } = req.params;

      // Check whether project exists
      const projectResult = await pool.query(
        `SELECT id, organization_id
         FROM projects
         WHERE id = $1`,
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const project = projectResult.rows[0];

      // Check whether user belongs to project's organization
      const membershipResult = await pool.query(
        `SELECT role
         FROM memberships
         WHERE user_id = $1
         AND organization_id = $2`,
        [req.user.id, project.organization_id]
      );

      if (membershipResult.rows.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }

      // Get task
      const result = await pool.query(
        `SELECT
           id,
           project_id,
           title,
           description,
           status,
           priority,
           assigned_to,
           created_by,
           due_date,
           created_at,
           updated_at
         FROM tasks
         WHERE id = $1
         AND project_id = $2`,
        [taskId, projectId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      res.json({
        task: result.rows[0],
      });
    } catch (error) {
      console.error("Get task error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);





// UPDATE TASK
router.patch(
  "/projects/:projectId/tasks/:taskId",
  authenticate,
  async (req, res) => {
    try {
      const { projectId, taskId } = req.params;

      const {
        title,
        description,
        status,
        priority,
        assigned_to,
        due_date,
      } = req.body;

      // Check project
      const projectResult = await pool.query(
        `SELECT id, organization_id
         FROM projects
         WHERE id = $1`,
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const project = projectResult.rows[0];

      // Check organization membership
      const membershipResult = await pool.query(
        `SELECT role
         FROM memberships
         WHERE user_id = $1
         AND organization_id = $2`,
        [req.user.id, project.organization_id]
      );

      if (membershipResult.rows.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }

      // Check task
      const taskResult = await pool.query(
        `SELECT id
         FROM tasks
         WHERE id = $1
         AND project_id = $2`,
        [taskId, projectId]
      );

      if (taskResult.rows.length === 0) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      // Validate status
      const allowedStatuses = [
        "TODO",
        "IN_PROGRESS",
        "DONE",
      ];

      if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Status must be TODO, IN_PROGRESS or DONE",
        });
      }

      // Validate priority
      const allowedPriorities = [
        "LOW",
        "MEDIUM",
        "HIGH",
      ];

      if (priority && !allowedPriorities.includes(priority)) {
        return res.status(400).json({
          message: "Priority must be LOW, MEDIUM or HIGH",
        });
      }
      if (due_date && isNaN(Date.parse(due_date))) {
  return res.status(400).json({
    message: "Invalid due date",
  });
}

      // Validate title
      if (title !== undefined && !title.trim()) {
        return res.status(400).json({
          message: "Task title cannot be empty",
        });
      }

      // Validate assignee
      if (assigned_to !== undefined && assigned_to !== null) {
        const assignedUserResult = await pool.query(
          `SELECT id
           FROM memberships
           WHERE user_id = $1
           AND organization_id = $2`,
          [assigned_to, project.organization_id]
        );

        if (assignedUserResult.rows.length === 0) {
          return res.status(400).json({
            message: "Assigned user is not a member of this organization",
          });
        }
      }

      const result = await pool.query(
        `UPDATE tasks
         SET
           title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           assigned_to = COALESCE($5, assigned_to),
due_date = COALESCE($6, due_date),
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $7
         AND project_id = $8
         RETURNING
           id,
           project_id,
           title,
           description,
           status,
           priority,
           assigned_to,
           created_by,
           due_date,
           created_at,
           updated_at`,
        [
          title !== undefined ? title.trim() : null,
          description !== undefined ? description.trim() : null,
          status || null,
          priority || null,
          assigned_to !== undefined ? assigned_to : null,
          due_date !== undefined ? due_date : null,
          taskId,
          projectId,
        ]
      );

      res.json({
        message: "Task updated successfully",
        task: result.rows[0],
      });
    } catch (error) {
      console.error("Update task error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);



// DELETE TASK
router.delete(
  "/projects/:projectId/tasks/:taskId",
  authenticate,
  async (req, res) => {
    try {
      const { projectId, taskId } = req.params;

      // Check project
      const projectResult = await pool.query(
        `SELECT id, organization_id
         FROM projects
         WHERE id = $1`,
        [projectId]
      );

      if (projectResult.rows.length === 0) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const project = projectResult.rows[0];

      // Check organization membership and role
      const membershipResult = await pool.query(
        `SELECT role
         FROM memberships
         WHERE user_id = $1
         AND organization_id = $2`,
        [req.user.id, project.organization_id]
      );

      if (membershipResult.rows.length === 0) {
        return res.status(403).json({
          message: "You are not a member of this organization",
        });
      }

      const role = membershipResult.rows[0].role;

      // Check task
      const taskResult = await pool.query(
        `SELECT id, title, created_by
         FROM tasks
         WHERE id = $1
         AND project_id = $2`,
        [taskId, projectId]
      );

      if (taskResult.rows.length === 0) {
        return res.status(404).json({
          message: "Task not found",
        });
      }

      const task = taskResult.rows[0];

      // OWNER and ADMIN can delete any task.
      // MEMBER can only delete their own task.
      if (
        role === "MEMBER" &&
        task.created_by !== req.user.id
      ) {
        return res.status(403).json({
          message: "Members can only delete tasks they created",
        });
      }

      const result = await pool.query(
        `DELETE FROM tasks
         WHERE id = $1
         AND project_id = $2
         RETURNING id, title`,
        [taskId, projectId]
      );

      res.json({
        message: "Task deleted successfully",
        task: result.rows[0],
      });
    } catch (error) {
      console.error("Delete task error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);



module.exports = router;