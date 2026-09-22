const ALLOWED_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const validateGeneratedTasks = (data) => {
  if (!data || !Array.isArray(data.tasks)) {
    throw new Error("Invalid AI task format");
  }

  if (data.tasks.length < 1 || data.tasks.length > 10) {
    throw new Error("AI must generate between 1 and 10 tasks");
  }

  const validatedTasks = data.tasks.map((task, index) => {
    if (!task || typeof task !== "object") {
      throw new Error(`Invalid task at index ${index}`);
    }

    if (
      typeof task.title !== "string" ||
      !task.title.trim()
    ) {
      throw new Error(`Task ${index + 1} has an invalid title`);
    }

    if (
      typeof task.description !== "string" ||
      !task.description.trim()
    ) {
      throw new Error(
        `Task ${index + 1} has an invalid description`
      );
    }

    if (!ALLOWED_PRIORITIES.includes(task.priority)) {
      throw new Error(
        `Task ${index + 1} has an invalid priority`
      );
    }

    return {
      title: task.title.trim(),
      description: task.description.trim(),
      priority: task.priority,
    };
  });

  return validatedTasks;
};

module.exports = {
  validateGeneratedTasks,
};