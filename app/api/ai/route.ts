import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    const text = response.output_text;

    return Response.json({ text });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    return Response.json({ error: "AI failed" }, { status: 500 });
  }
}
