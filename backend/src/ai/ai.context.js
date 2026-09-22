const buildProjectContext = (projectData) => {
  const {
    project,
    role,
    tasks,
    comments,
    statistics,
  } = projectData;

  return {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      created_at: project.created_at,
    },

    current_user: {
      organization_role: role,
    },

    statistics,

    tasks: tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      assigned_to: task.assigned_to,
      due_date: task.due_date,
    })),

    comments: comments.map((comment) => ({
      id: comment.id,
      task_id: comment.task_id,
      content: comment.content,
      user_name: comment.user_name,
      created_at: comment.created_at,
    })),
  };
};

module.exports = {
  buildProjectContext,
};