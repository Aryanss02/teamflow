const express = require("express");

const pool = require("../config/db");
const authenticate = require("../middleware/auth.middleware");
const checkOrganizationMember = require("../middleware/organization.middleware");
const requireRole = require("../middleware/role.middleware");




const router = express.Router();



// CREATE ORGANIZATION
router.post("/", authenticate, async (req, res) => {
  const client = await pool.connect();

  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Organization name is required",
      });
    }

    await client.query("BEGIN");

    // Create organization
    const organizationResult = await client.query(
      `INSERT INTO organizations (name, created_by)
       VALUES ($1, $2)
       RETURNING id, name, created_by, created_at`,
      [name.trim(), req.user.id]
    );

    const organization = organizationResult.rows[0];

    // Make creator the OWNER
    await client.query(
      `INSERT INTO memberships (user_id, organization_id, role)
       VALUES ($1, $2, 'OWNER')`,
      [req.user.id, organization.id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Organization created successfully",
      organization,
      role: "OWNER",
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create organization error:", error);

    res.status(500).json({
      message: "Server error",
    });
  } finally {
    client.release();
  }
});


router.get("/", authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        o.id,
        o.name,
        o.created_by,
        o.created_at,
        m.role
       FROM organizations o
       JOIN memberships m
         ON m.organization_id = o.id
       WHERE m.user_id = $1
       ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json({
      organizations: result.rows,
    });
  } catch (error) {
    console.error("Get organizations error:", error.message);

    res.status(500).json({
      message: "Failed to fetch organizations",
    });
  }
});




// GET ORGANIZATION
router.get(
  "/:organizationId",
  authenticate,
  checkOrganizationMember,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT id, name, created_by, created_at
         FROM organizations
         WHERE id = $1`,
        [req.organization.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          message: "Organization not found",
        });
      }

      res.json({
        organization: result.rows[0],
        role: req.organization.role,
      });
    } catch (error) {
      console.error("Get organization error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);




// GET ORGANIZATION MEMBERS
router.get(
  "/:organizationId/members",
  authenticate,
  checkOrganizationMember,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT
           u.id,
           u.name,
           u.email,
           m.role,
           m.created_at AS joined_at
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.organization_id = $1
         ORDER BY m.created_at ASC`,
        [req.organization.id]
      );

      res.json({
        organizationId: req.organization.id,
        members: result.rows,
      });
    } catch (error) {
      console.error("Get members error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);




// ADD MEMBER
router.post(
  "/:organizationId/members",
  authenticate,
  checkOrganizationMember,
  requireRole("OWNER", "ADMIN"),
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          message: "Email is required",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();





      //<<----------------------------------------Check if user exists--------------------------------------->>
      const userResult = await pool.query(
        `SELECT id, name, email
         FROM users
         WHERE email = $1`,
        [normalizedEmail]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({
          message: "User not found",
        });
      }

      const user = userResult.rows[0];





      //<<---------------------------------------Check if already a member-------------------------------------------->>
      const membershipResult = await pool.query(
        `SELECT id
         FROM memberships
         WHERE user_id = $1
         AND organization_id = $2`,
        [user.id, req.organization.id]
      );

      if (membershipResult.rows.length > 0) {
        return res.status(409).json({
          message: "User is already a member of this organization",
        });
      }



      
      //<<-------------------------------------------Add user as MEMBER-------------------------------------------------->>
      await pool.query(
        `INSERT INTO memberships (user_id, organization_id, role)
         VALUES ($1, $2, 'MEMBER')`,
        [user.id, req.organization.id]
      );

      res.status(201).json({
        message: "Member added successfully",
        member: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: "MEMBER",
        },
      });
    } catch (error) {
      console.error("Add member error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);





// CHANGE MEMBER ROLE
router.patch(
  "/:organizationId/members/:userId/role",
  authenticate,
  checkOrganizationMember,
  requireRole("OWNER"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;

      const allowedRoles = ["ADMIN", "MEMBER"];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          message: "Role must be ADMIN or MEMBER",
        });
      }

      // Check target user is a member
      const memberResult = await pool.query(
        `SELECT u.id, u.name, u.email, m.role
         FROM memberships m
         JOIN users u ON u.id = m.user_id
         WHERE m.user_id = $1
         AND m.organization_id = $2`,
        [userId, req.organization.id]
      );

      if (memberResult.rows.length === 0) {
        return res.status(404).json({
          message: "User is not a member of this organization",
        });
      }

      const member = memberResult.rows[0];

      // Prevent changing the OWNER through this endpoint
      if (member.role === "OWNER") {
        return res.status(403).json({
          message: "Owner role cannot be changed",
        });
      }

      const result = await pool.query(
        `UPDATE memberships
         SET role = $1
         WHERE user_id = $2
         AND organization_id = $3
         RETURNING role`,
        [role, userId, req.organization.id]
      );

      res.json({
        message: "Member role updated successfully",
        member: {
          id: member.id,
          name: member.name,
          email: member.email,
          role: result.rows[0].role,
        },
      });
    } catch (error) {
      console.error("Change role error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);





// REMOVE MEMBER
router.delete(
  "/:organizationId/members/:userId",
  authenticate,
  checkOrganizationMember,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Find the target member
      const memberResult = await pool.query(
        `SELECT user_id, role
         FROM memberships
         WHERE user_id = $1
         AND organization_id = $2`,
        [userId, req.organization.id]
      );

      if (memberResult.rows.length === 0) {
        return res.status(404).json({
          message: "User is not a member of this organization",
        });
      }

      const targetMember = memberResult.rows[0];

      // Nobody can remove the OWNER
      if (targetMember.role === "OWNER") {
        return res.status(403).json({
          message: "Owner cannot be removed",
        });
      }

      // User cannot remove themselves
      if (Number(userId) === req.user.id) {
        return res.status(400).json({
          message: "You cannot remove yourself",
        });
      }

      // OWNER can remove anyone except OWNER
      if (req.organization.role === "OWNER") {
        // allowed
      }

      // ADMIN can only remove MEMBER
      else if (
        req.organization.role === "ADMIN" &&
        targetMember.role !== "MEMBER"
      ) {
        return res.status(403).json({
          message: "Admins can only remove members",
        });
      }

      // MEMBER cannot remove anyone
      else {
        return res.status(403).json({
          message: "You do not have permission to remove members",
        });
      }

      await pool.query(
        `DELETE FROM memberships
         WHERE user_id = $1
         AND organization_id = $2`,
        [userId, req.organization.id]
      );

      res.json({
        message: "Member removed successfully",
      });
    } catch (error) {
      console.error("Remove member error:", error);

      res.status(500).json({
        message: "Server error",
      });
    }
  }
);







module.exports = router;