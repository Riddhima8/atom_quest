import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(req: Request) {
  try {
    const { action, payload } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured in .env' }, { status: 500 });
    }

    const groq = new Groq({ apiKey });

    if (action === 'generate_goal') {
      const prompt = `You are an expert OKR and Goal Setting assistant. The user wants to create a goal about: "${payload.prompt}".
Generate a structured SMART goal. Return ONLY a JSON object with the following keys, no markdown formatting, no backticks:
- title (string, concise)
- description (string, detailed)
- thrustArea (string, e.g. Sales, Engineering, Marketing, Operations, etc.)
- uom (string, EXACTLY one of: NUMERIC, PERCENTAGE, TIMELINE, ZERO)
- target (string, the target value based on uom, e.g. "10000", "50", "Q3", "0")`;

      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
      });

      const text = response.choices[0]?.message?.content || '{}';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      return NextResponse.json(JSON.parse(cleanJson));
    }

    if (action === 'summarize_checkins') {
      const prompt = `You are a manager's assistant. Summarize the following employee check-ins for the quarter:
${JSON.stringify(payload.checkIns)}
Keep it concise (2-3 sentences), professional, and highlight the overall progress and any areas of concern. Return plain text.`;

      const response = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
      });

      const text = response.choices[0]?.message?.content || '';
      return NextResponse.json({ summary: text });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('AI API Error:', error);
    return NextResponse.json({ error: error.message || 'AI request failed' }, { status: 500 });
  }
}
