// netlify/functions/get-config.js
// Returns public Supabase config to the frontend
// Safe to expose — anon key is designed to be public

export const handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      supabaseUrl:  process.env.SUPABASE_URL,
      supabaseAnon: process.env.SUPABASE_ANON_KEY
    })
  };
};