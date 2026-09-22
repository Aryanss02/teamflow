const pool = require("../config/db");

const getProjectData = async (projectId, userId) => {
  // 1. Check that the project exists
  const projectResult = await pool.query(
    `SELECT 
        p.id,
        p.name,
        p.description,
        p.organization_id,
        p.created_at
     FROM projects p
     WHERE p.id = $1`,
    [projectId]
  );

  if (projectResult.rows.length === 0) {
    throw new Error("Project not found");
  }

  const project = projectResult.rows[0];

  // 2. Check that the user belongs to the project organization
  const membershipResult = await pool.query(
    `SELECT role
     FROM memberships
     WHERE user_id = $1
     AND organization_id = $2`,
    [userId, project.organization_id]
  );

  if (membershipResult.rows.length === 0) {
    throw new Error("User is not a member of this organization");
  }

  // 3. Get tasks
  const tasksResult = await pool.query(
    `SELECT
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.assigned_to,
        t.created_by,
        t.due_date,
        t.created_at,
        t.updated_at
     FROM tasks t
     WHERE t.project_id = $1
     ORDER BY t.created_at DESC`,
    [projectId]
  );

  // 4. Get comments
  const commentsResult = await pool.query(
    `SELECT
        c.id,
        c.content,
        c.created_at,
        c.user_id,
        u.name AS user_name
     FROM comments c
     JOIN users u ON u.id = c.user_id
     JOIN tasks t ON t.id = c.task_id
     WHERE t.project_id = $1
     ORDER BY c.created_at DESC`,
    [projectId]
  );

  const statisticsResult = await pool.query(
  `
  SELECT
    COUNT(*)::INTEGER AS total_tasks,
    COUNT(*) FILTER (
      WHERE status = 'TODO'
    )::INTEGER AS todo_tasks,
    COUNT(*) FILTER (
      WHERE status = 'IN_PROGRESS'
    )::INTEGER AS in_progress_tasks,
    COUNT(*) FILTER (
      WHERE status = 'DONE'
    )::INTEGER AS completed_tasks,
    COUNT(*) FILTER (
      WHERE priority = 'HIGH'
    )::INTEGER AS high_priority_tasks,
    COUNT(*) FILTER (
      WHERE due_date < CURRENT_DATE
      AND status != 'DONE'
    )::INTEGER AS overdue_tasks
  FROM tasks
  WHERE project_id = $1
  `,
  [projectId]
);

const statistics = statisticsResult.rows[0];

  // 5. Return controlled project data
  return {
  project,
  role: membershipResult.rows[0].role,
  tasks: tasksResult.rows,
  comments: commentsResult.rows,
  statistics,
};
};

module.exports = {
  getProjectData,
};