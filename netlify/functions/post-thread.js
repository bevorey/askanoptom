// netlify/functions/post-thread.js
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Not authenticated' }) };
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid session' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { title, specialty, body: threadBody } = body;

  if (!title?.trim() || !threadBody?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Title and body are required' }) };
  }

  if (title.length > 200) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Title too long' }) };
  }

  if (threadBody.length > 3000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Body too long — max 3000 characters' }) };
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anonymous';
      const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      await supabase.from('profiles').insert({
        id: user.id,
        full_name: name,
        avatar_initials: initials,
        credential: user.user_metadata?.credential || '',
        country: ''
      });
    }

    const { data: thread, error } = await supabase
      .from('threads')
      .insert({
        author_id: user.id,
        title: title.trim(),
        specialty: specialty || 'General',
        body: threadBody.trim()
      })
      .select()
      .single();

    if (error) throw error;

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ thread })
    };

  } catch (err) {
    console.error('post-thread error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to post thread. Please try again.' })
    };
  }
};