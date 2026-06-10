// netlify/functions/get-config.js
// Returns public Supabase config to the frontend
// Safe to expose — anon key is designed to be public

export const handler = async () => {
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      supabaseUrl:  process.env.https://oxailghpsonsgubzsezf.supabase.co,
      supabaseAnon: process.env.sb_publishable_yQq9hHwJTCUyCsis1uaJnw_2hUoSQBA
    })
  };
};