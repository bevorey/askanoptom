// netlify/functions/ask.js
// =============================================
// This file IS your backend.
// Netlify runs it as a secure serverless function.
// It receives a question, calls Claude, returns an answer.
//
// Live at: https://askanoptom.com/.netlify/functions/ask
// =============================================

import Anthropic from '@anthropic-ai/sdk';

const claude = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const SYSTEM_PROMPT = `You are an AI assistant for AskAnOptom.com, a trusted eye care resource.
Your knowledge base is curated by Dr. B. Reyaz, OD, a licensed optometrist based in Trinidad & Tobago.

Your role:
- Answer questions about eye health, conditions, symptoms, lenses, and treatments
- Write in clear, plain English that a patient can understand
- Add clinical depth where relevant for students or professionals
- Always cite the type of source your answer is based on (e.g. "According to AAO guidelines...")
- For serious or urgent symptoms, always advise the reader to seek professional care promptly

Your tone:
- Warm, clear, and trustworthy — like a knowledgeable friend who happens to be an eye doctor
- Never alarmist, but never dismissive of serious symptoms
- Concise — lead with the answer, then add detail

Format your response as a JSON object with this exact structure:
{
  "answer": "Your full answer using only <p>, <ul>, <li>, <strong>, <em> tags",
  "warning": "A short urgent warning if the question involves red-flag symptoms, otherwise null",
  "sources": ["Source 1", "Source 2"],
  "related": ["Related question 1?", "Related question 2?", "Related question 3?"],
  "tags": [
    { "label": "category name", "type": "blue" }
  ]
}

Tag types: blue (conditions/anatomy), green (clinically reviewed), amber (patient guide).
Always include a green "clinically reviewed" tag.
Keep "related" to 3 short questions a curious patient might ask next.
Keep "sources" to 2-3 real named references (textbooks, guidelines, journals).
Return ONLY the raw JSON object — no markdown, no code fences, no preamble.`;

export const handler = async (event) => {

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Parse the request body
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

  // Validate
  if (!question) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'No question provided' })
    };
  }

  if (question.length > 500) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Question too long. Please keep it under 500 characters.' })
    };
  }

  // Call Claude
  try {
    const message = await claude.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system:     SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: question }
      ]
    });

    const raw  = message.content[0].text;
    const data = JSON.parse(raw);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };

  } catch (err) {
    console.error('Error:', err.message);

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
