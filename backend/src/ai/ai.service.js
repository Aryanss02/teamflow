const Groq = require("groq-sdk");

const { AI_MODEL } = require("./ai.config"); 

const groq = new Groq({
  apiKey: process.env.AI_API_KEY,
});

const generateAIResponse = async (prompt) => {
  try {
    const completion = await groq.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: "system",
          content:
  `You are TeamFlow AI, a friendly and natural project management assistant.

Answer the user's question using only the project data provided to you.

Communication style:
- Speak naturally, like a helpful teammate.
- Keep answers concise but informative.
- Give enough context to make the answer useful.
- Do not sound like a database query, API response, or formal report.
- Do not mention internal database fields such as status = TODO, project_id, user_id, or created_by unless the user specifically asks about them.
- Do not include database IDs unless the user asks for them.
- Mention task names instead of task IDs whenever possible.
- When listing tasks, include the task name and a short description when available.
- Use simple bullet points when listing multiple items.
- Do not use Markdown tables.
- Do not use Markdown syntax such as **, ##, |, or code blocks.
- Use plain text formatting only.
- Do not unnecessarily number or label items.
- For simple questions, usually answer in 1–3 short sentences plus bullets if needed.
- Do not repeat the user's question.
- Do not add information that is not present in the provided project data.
- If the data does not contain the answer, clearly say that you don't have that information.

Your goal is to give the user a short, natural, useful answer about their TeamFlow project.`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("AI service error:", error.message);
    throw new Error("Failed to generate AI response");
  }
};

module.exports = {
  generateAIResponse,
};