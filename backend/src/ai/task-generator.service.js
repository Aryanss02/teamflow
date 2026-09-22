const Groq = require("groq-sdk");

const { AI_MODEL } = require("./ai.config");

const groq = new Groq({
  apiKey: process.env.AI_API_KEY,
});

const {
  validateGeneratedTasks,
} = require("./task-generator.validator");

const generateTasksFromRequirement = async (requirement) => {
  const prompt = `
You are TeamFlow AI, a project management assistant.

Convert the user's project requirement into a practical list of development tasks.

USER REQUIREMENT:
${requirement}

Return ONLY valid JSON.

The JSON must have this exact structure:

{
  "tasks": [
    {
      "title": "string",
      "description": "string",
      "priority": "LOW | MEDIUM | HIGH"
    }
  ]
}

Rules:

1. Generate 3 to 10 practical tasks.
2. Each task must have a clear and actionable title.
3. Keep descriptions concise.
4. Priority must be exactly LOW, MEDIUM, or HIGH.
5. Do not include project_id.
6. Do not include user IDs.
7. Do not include status.
8. Do not include created_by.
9. Do not include markdown.
10. Return JSON only.
`;

  try {
    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You generate structured project tasks. Always return valid JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    });

    const content = completion.choices[0].message.content;

    const parsedResult = JSON.parse(content);

const validatedTasks = validateGeneratedTasks(
  parsedResult
);

return {
  tasks: validatedTasks,
};
  } catch (error) {
    console.error("Task generator error:", error.message);

    throw new Error("Failed to generate tasks");
  }
};

module.exports = {
  generateTasksFromRequirement,
};