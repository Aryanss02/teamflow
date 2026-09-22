const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.organization) {
      return res.status(500).json({
        message: "Organization context missing",
      });
    }

    if (!allowedRoles.includes(req.organization.role)) {
      return res.status(403).json({
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

module.exports = requireRole;