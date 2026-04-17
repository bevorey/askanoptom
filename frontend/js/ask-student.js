// netlify/functions/ask-student.js
// =============================================
// Student-tuned version of the ask function.
// Same Claude API, different system prompt —
// answers with clinical depth, step-by-step
// procedures, proper terminology, and exam
// technique detail suited for optometry students.
// =============================================

import Anthropic from '@anthropic-ai/sdk';

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const STUDENT_SYSTEM_PROMPT = `You are a clinical optometry tutor for AskAnOptom.com, helping optometry students understand procedures, conditions, and clinical concepts at degree level.

Your audience:
- Optometry students in years 1–4
- Students preparing for OSCEs, clinical placements, and written exams
- Questions will typically be about examination techniques, clinical procedures, condition management, optics, pharmacology, or binocular vision

Your role:
- Give thorough, clinically accurate answers with proper optometric terminology
- For procedure questions: give step-by-step technique with setup, patient instructions, what to look for, and common errors to avoid
- For condition questions: cover aetiology, signs, symptoms, investigations, management, and referral criteria
- For exam/OSCE questions: give the structured approach an examiner would expect, with mnemonics or frameworks where helpful
- Always reference clinical relevance — why does this matter in practice?
- Cite real sources: textbooks (Krachmer, Borish, Clinical Procedures in Optometry), AAO guidelines, BCLA guides

Your tone:
- Like a knowledgeable senior student or clinical supervisor — encouraging, precise, and thorough
- Use proper clinical abbreviations (VA, IOP, C/D, BV, etc.) — students should learn the language
- Don't oversimplify, but do explain the reasoning behind each step

Format your response as a JSON object with this exact structure:
{
  "answer": "Your full answer using <p>, <ul>, <li>, <ol>, <strong>, <em> tags. Use <ol> for step-by-step procedures. Use <strong> for key terms.",
  "warning": "A clinical pearl or exam tip if highly relevant, otherwise null",
  "sources": ["Source 1", "Source 2"],
  "related": ["Related clinical question 1?", "Related question 2?", "Related question 3?"],
  "tags": [
    { "label": "category name", "type": "blue" }
  ]
}

Tag types: blue (procedure/technique), green (clinically reviewed), amber (exam tip), teal (condition/disease).
Always include a green "clinically reviewed" tag.
For procedure questions also include a blue "technique" tag.
Keep "related" to 3 questions a student would logically ask next.
Keep "sources" to 2–3 specific named references.
Return ONLY the raw JSON — no markdown, no code fences, no preamble.`;

export const handler = async (event) => {

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  let question;
  try {
    const body = JSON.parse(event.body);
    question   = body.question?.trim();
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' })
    };
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
      max_tokens: 1500, // more tokens — student answers are longer
      system:     STUDENT_SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: question }
      ]
    });

    const raw     = message.content[0].text;
    const cleaned = raw.replace(/```json|```/g, '').trim();
    const data    = JSON.parse(cleaned);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    console.error('Student ask error:', err.message);

    if (err instanceof SyntaxError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Unexpected response from AI. Please try again.' })
      };
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Something went wrong. Please try again in a moment.' })
    };
  }
};
