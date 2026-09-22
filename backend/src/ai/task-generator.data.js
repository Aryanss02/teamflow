const pool = require("../config/db");

const createGeneratedTasks = async (
  projectId,
  userId,
  tasks
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const createdTasks = [];

    for (const task of tasks) {
      const result = await client.query(
        `INSERT INTO tasks (
          project_id,
          title,
          description,
          priority,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5)
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
          task.title,
          task.description,
          task.priority,
          userId,
        ]
      );

      createdTasks.push(result.rows[0]);
    }

    await client.query("COMMIT");

    return createdTasks;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createGeneratedTasks,
};