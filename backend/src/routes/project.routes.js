const express = require("express");

const pool = require("../config/db");
const authenticate = require("../middleware/auth.middleware");
const checkOrganizationMember = require("../middleware/organization.middleware");
const requireRole = require("../middleware/role.middleware");

const router = express.Router();

// CREATE PROJECT
router.post(
  "/organizations/:organizationId/projects",
  authenticate,
  checkOrganizationMember,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    try {
      const { name, description } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          message: "Project name is required",
        });
      }

      const result = await pool.query(
        `INSERT INTO projects (
          organization_id,
          name,
          description,
          created_by
        )
        VALUES ($1, $2, $3, $4)
        RETURNING id, organization_id, name, description, created_by, created_at`,
        [
          req.organization.id,
          name.trim(),
          description?.trim() || null,
          req.user.id,
        ]
      );

      res.status(201).json({
        message: "Project created successfully",
        project: result.rows[0],
      });
    } catch (error) {
      console.error("Create project error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);



// GET ALL PROJECTS
router.get(
  "/organizations/:organizationId/projects",
  authenticate,
  checkOrganizationMember,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
           id,
           organization_id,
           name,
           description,
           created_by,
           created_at
         FROM projects
         WHERE organization_id = $1
         ORDER BY created_at DESC`,
        [req.organization.id]
      );

      res.json({
        organizationId: req.organization.id,
        projects: result.rows,
      });
    } catch (error) {
      console.error("Get projects error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);



// GET SINGLE PROJECT
router.get(
  "/organizations/:organizationId/projects/:projectId",
  authenticate,
  checkOrganizationMember,
  async (req, res) => {
    try {
      const { projectId } = req.params;

      const result = await pool.query(
        `SELECT
           id,
           organization_id,
           name,
           description,
           created_by,
           created_at
         FROM projects
         WHERE id = $1
         AND organization_id = $2`,
        [projectId, req.organization.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      res.json({
        project: result.rows[0],
      });
    } catch (error) {
      console.error("Get project error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);


// UPDATE PROJECT
router.patch(
  "/organizations/:organizationId/projects/:projectId",
  authenticate,
  checkOrganizationMember,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    try {
      const { projectId } = req.params;
      const { name, description } = req.body;

      if (name !== undefined && !name.trim()) {
        return res.status(400).json({
          message: "Project name cannot be empty",
        });
      }

      const existingProject = await pool.query(
        `SELECT id
         FROM projects
         WHERE id = $1
         AND organization_id = $2`,
        [projectId, req.organization.id]
      );

      if (existingProject.rows.length === 0) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      const result = await pool.query(
        `UPDATE projects
         SET
           name = COALESCE($1, name),
           description = COALESCE($2, description)
         WHERE id = $3
         AND organization_id = $4
         RETURNING
           id,
           organization_id,
           name,
           description,
           created_by,
           created_at`,
        [
          name !== undefined ? name.trim() : null,
          description !== undefined ? description.trim() : null,
          projectId,
          req.organization.id,
        ]
      );

      res.json({
        message: "Project updated successfully",
        project: result.rows[0],
      });
    } catch (error) {
      console.error("Update project error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);







// DELETE PROJECT
router.delete(
  "/organizations/:organizationId/projects/:projectId",
  authenticate,
  checkOrganizationMember,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    try {
      const { projectId } = req.params;

      const result = await pool.query(
        `DELETE FROM projects
         WHERE id = $1
         AND organization_id = $2
         RETURNING id, name`,
        [projectId, req.organization.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Project not found",
        });
      }

      res.json({
        message: "Project deleted successfully",
        project: result.rows[0],
      });
    } catch (error) {
      console.error("Delete project error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);







module.exports = router;