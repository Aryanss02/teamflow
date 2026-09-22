const express = require("express");

const authenticate = require("../middleware/auth.middleware");

const { generateAIResponse } = require("../ai/ai.service");

const { getProjectData } = require("../ai/ai.data");

const {
  generateTasksFromRequirement,
} = require("../ai/task-generator.service");

const {
  createGeneratedTasks,
} = require("../ai/task-generator.data");

const {
  buildProjectContext,
} = require("../ai/ai.context");









const router = express.Router();










// AI TEST
router.get("/test", authenticate, async (req, res) => {
  try {
    const answer = await generateAIResponse(
      "Explain what TeamFlow is in one short paragraph."
    );

    res.json({
      message: "AI is working",
      answer,
    });
  } catch (error) {
    console.error("AI test error:", error);

    res.status(500).json({
      message: "AI service failed",
    });
  }
});





// PROJECT DATA TEST
router.get(
  "/project/:projectId/data",
  authenticate,
  async (req, res) => {
    try {
      const projectId = Number(req.params.projectId);

      if (Number.isNaN(projectId)) {
        return res.status(400).json({
          message: "Invalid project ID",
        });
      }

      const data = await getProjectData(
        projectId,
        req.user.id
      );

      res.json(data);
    } catch (error) {
      console.error("AI data error:", error);

      if (error.message === "Project not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "User is not a member of this organization"
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: "Failed to retrieve project data",
      });
    }
  }
);





// PROJECT-AWARE AI, project ask
router.post(
  "/projects/:projectId/ask",
  authenticate,
  async (req, res) => {
    try {
      const projectId = Number(req.params.projectId);
      const { question } = req.body;

      if (Number.isNaN(projectId)) {
        return res.status(400).json({
          message: "Invalid project ID",
        });
      }

      if (!question || !question.trim()) {
        return res.status(400).json({
          message: "Question is required",
        });
      }

      // Get only data the authenticated user can access
      const projectData = await getProjectData(
        projectId,
        req.user.id
      );

      // Convert database data into AI context
      const projectContext =
        buildProjectContext(projectData);

      // Build context for AI
      const prompt = `
You are answering a question about a TeamFlow project.

Use ONLY the project information provided below.

PROJECT:
${JSON.stringify(projectData.project, null, 2)}

USER ROLE:
${projectData.role}

TASKS:
${JSON.stringify(projectData.tasks, null, 2)}

COMMENTS:
${JSON.stringify(projectData.comments, null, 2)}

USER QUESTION:
${question}

INSTRUCTIONS FOR YOUR RESPONSE:

- Answer the user's question directly.
- Speak naturally, like a helpful teammate.
- Keep the answer short but useful.
- Use simple Markdown formatting only.
- You may use **bold** for task names when useful.
- Do NOT use Markdown tables.
- Do NOT use headings, code blocks, or complex Markdown.
- Use simple bullet points starting with "-".
- Do NOT expose database IDs unless the user specifically asks for them.
- Do NOT mention fields such as project_id, user_id, created_by, or database status values unless the user specifically asks about technical details.
- When talking about tasks, use their titles.
- When listing multiple tasks, use simple bullet points starting with "-".
- Include a short description when it helps answer the question.
- Do not unnecessarily repeat the project name.
- Do not create information that is not present in the provided data.
- If the answer cannot be determined from the provided data, say that the information is not available.
- Do not give a formal report or database-style response.

Examples of the desired style:

Question: What tasks are pending?

Good answer:
There are 2 tasks still pending:

- Build the login page — Create the frontend login form.
- Add authentication API — Implement the backend authentication endpoint.

Question: How is the project going?

Good answer:
The project currently has 3 tasks. One is completed, one is in progress, and one is still pending.

Now answer the user's question.

`;

      const answer = await generateAIResponse(prompt);

      res.json({
        projectId,
        question,
        answer,
      });

    } catch (error) {
      console.error("Project AI error:", error);

      if (error.message === "Project not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "User is not a member of this organization"
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: "Failed to process AI request",
      });
    }
  }
);






//project summary
router.post(
  "/projects/:projectId/summary",
  authenticate,
  async (req, res) => {
    try {
      const projectId = Number(req.params.projectId);

      if (Number.isNaN(projectId)) {
        return res.status(400).json({
          message: "Invalid project ID",
        });
      }

      // Get project data and verify user access
      const projectData = await getProjectData(
        projectId,
        req.user.id
      );

      // Convert project data into AI-friendly context
      const projectContext = buildProjectContext(
        projectData
      );

      const prompt = `
You are TeamFlow AI.

Create a concise project status summary using ONLY the project context provided below.

PROJECT CONTEXT:

${JSON.stringify(projectContext, null, 2)}

Create a summary that includes:

1. What the project is about.
2. Current task progress.
3. Important priority information.
4. Any overdue tasks.
5. Any useful observations from the available data.


Rules:
- Use only the provided project context.
- Do not invent information.
- Do not invent users, tasks, dates, or progress.
- If information is unavailable, do not make assumptions.
- Keep the summary concise and natural.
RESPONSE FORMAT:
- Use **bold** for section headings and important task names.
- Use simple bullet points starting with "-".
- Do not use headings with #.
- Do not use Markdown tables.
- Do not use asterisks for anything except **bold text**.
- Do not use code blocks.
- Keep the summary concise and easy to scan.
- Do not mention database IDs.
- Use natural language.
`;

      const summary = await generateAIResponse(prompt);

      res.json({
        projectId,
        summary,
      });

    } catch (error) {
      console.error(
        "AI project summary error:",
        error
      );

      if (error.message === "Project not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "User is not a member of this organization"
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: "Failed to generate project summary",
      });
    }
  }
);




//generate-tasks
router.post(
  "/projects/:projectId/generate-tasks",
  authenticate,
  async (req, res) => {
    try {
      const projectId = Number(req.params.projectId);
      const { requirement } = req.body;

      if (Number.isNaN(projectId)) {
        return res.status(400).json({
          message: "Invalid project ID",
        });
      }

      if (!requirement || !requirement.trim()) {
        return res.status(400).json({
          message: "Requirement is required",
        });
      }

      // Verify that the user can access this project
      await getProjectData(
        projectId,
        req.user.id
      );

      // Generate tasks using AI
      const result = await generateTasksFromRequirement(
        requirement
      );

      res.json({
  message: "Tasks generated successfully",
  projectId,
  requirement,
  tasks: result.tasks,
});

    } catch (error) {
      console.error("Generate tasks error:", error);

      if (error.message === "Project not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "User is not a member of this organization"
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: "Failed to generate tasks",
      });
    }
  }
);





router.post(
  "/projects/:projectId/create-generated-tasks",
  authenticate,
  async (req, res) => {
    try {
      const projectId = Number(req.params.projectId);
      const { tasks } = req.body;

      if (Number.isNaN(projectId)) {
        return res.status(400).json({
          message: "Invalid project ID",
        });
      }

      if (!Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({
          message: "Tasks are required",
        });
      }

      if (tasks.length > 10) {
        return res.status(400).json({
          message: "Maximum 10 tasks can be created at once",
        });
      }

      // Verify project access
      await getProjectData(
        projectId,
        req.user.id
      );

      // Validate the tasks again
      const { validateGeneratedTasks } = require(
        "../ai/task-generator.validator"
      );

      const validatedTasks = validateGeneratedTasks({
        tasks,
      });

      const createdTasks = await createGeneratedTasks(
        projectId,
        req.user.id,
        validatedTasks
      );

      res.status(201).json({
        message: "Approved tasks created successfully",
        projectId,
        tasks: createdTasks,
      });

    } catch (error) {
      console.error(
        "Create generated tasks error:",
        error
      );

      if (error.message === "Project not found") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message ===
        "User is not a member of this organization"
      ) {
        return res.status(403).json({
          message: error.message,
        });
      }

      res.status(500).json({
        message: "Failed to create generated tasks",
      });
    }
  }
);


module.exports = router;