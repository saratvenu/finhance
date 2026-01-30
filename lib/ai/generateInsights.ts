import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function generateInsights(context: any) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: "You generate financial insights in JSON format only."
      },
      {
        role: "user",
        content: JSON.stringify(context)
      }
    ],
  });

  return JSON.parse(completion.choices[0].message.content!);
}
