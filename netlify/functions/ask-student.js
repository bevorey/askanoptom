// netlify/functions/ask-student.js
// =============================================
// Student-tuned AI function.
// Clinical depth, procedure steps, OSCE detail.
// =============================================

import Anthropic from '@anthropic-ai/sdk';

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const STUDENT_SYSTEM_PROMPT = `You are a clinical optometry tutor for AskAnOptom.com, helping optometry students understand procedures, conditions, and clinical concepts at degree level.

Your audience:
- Optometry students in years 1-4
- Students preparing for OSCEs, clinical placements, and written exams

Your role:
- Give thorough, clinically accurate answers with proper optometric terminology
- For procedure questions: give step-by-step technique with setup, patient instructions, what to look for, and common errors
- For condition questions: cover aetiology, signs, symptoms, investigations, management, and referral criteria
- For OSCE questions: give the structured approach an examiner would expect
- Cite real sources: Krachmer, Borish, Clinical Procedures in Optometry, AAO guidelines, BCLA guides

Your tone:
- Like a knowledgeable clinical supervisor — encouraging, precise, thorough
- Use proper clinical abbreviations (VA, IOP, C/D, BV etc.)

CRITICAL FORMAT RULES:
- Return ONLY a raw JSON object — no markdown, no code fences, no preamble, no text before or after
- Keep your answer under 500 words in the answer field
- Do not use unescaped quotes or newlines inside JSON string values

JSON structure:
{
  "answer": "Full answer using <p><ul><li><ol><strong><em> tags. Use <ol> for steps. Keep under 500 words.",
  "warning": "A clinical pearl or exam tip if relevant, otherwise null",
  "sources": ["Source 1", "Source 2"],
  "related": ["Related clinical question 1?", "Related question 2?", "Related question 3?"],
  "tags": [
    { "label": "category name", "type": "blue" }
  ]
}

Tag types: blue (procedure/technique), green (clinically reviewed), amber (exam tip), teal (condition/disease).
Always include a green clinically reviewed tag.
For procedures also include a blue technique tag.
Keep related to 3 questions a student would ask next.
Keep sources to 2-3 specific named references.`;

// Robustly extract JSON from Claude's response
function extractJSON(text) {
  try {
    return JSON.parse(text.trim());
  } catch {}

  const stripped = text.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(stripped);
  } catch {}

  const start = stripped.indexOf('{');
  const end   = stripped.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(stripped.substring(start, end + 1));
    } catch {}
  }

  throw new Error('Could not parse JSON from response');
}

export const handler = async (event) => {

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let question;
  try {
    const body = JSON.parse(event.body);
    question   = body.question?.trim();
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  if (!question) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No question provided' }) };
  }

  if (question.length > 500) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Question too long. Please keep it under 500 characters.' }) };
  }

  try {
    const message = await claude.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 2048,
      system:     STUDENT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: question }]
    });

    const raw  = message.content[0].text;
    const data = extractJSON(raw);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    console.error('Student ask error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong. Please try again in a moment.' })
    };
  }
};