const pool = require("../config/db");

const checkOrganizationMember = async (req, res, next) => {
  try {
    const organizationId = req.params.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        message: "Organization ID is required",
      });
    }

    const result = await pool.query(
      `SELECT role
       FROM memberships
       WHERE user_id = $1
       AND organization_id = $2`,
      [req.user.id, organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        message: "You are not a member of this organization",
      });
    }

    req.organization = {
      id: Number(organizationId),
      role: result.rows[0].role,
    };

    next();
  } catch (error) {
    console.error("Organization membership error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = checkOrganizationMember;