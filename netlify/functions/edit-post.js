// netlify/functions/edit-post.js
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

  const { type, id, content, title } = body;
  // type = 'thread' or 'comment'

  if (!type || !id || (!content && !title)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'type, id, and content are required' }) };
  }

  try {
    if (type === 'thread') {
      const updates = {};
      if (title?.trim()) updates.title = title.trim();
      if (content?.trim()) updates.body = content.trim();

      const { error } = await supabase
        .from('threads')
        .update(updates)
        .eq('id', id)
        .eq('author_id', user.id); // extra safety check

      if (error) throw error;

    } else if (type === 'comment') {
      const { error } = await supabase
        .from('comments')
        .update({ body: content.trim() })
        .eq('id', id)
        .eq('author_id', user.id);

      if (error) throw error;

    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid type' }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    console.error('edit-post error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to edit. Please try again.' })
    };
  }
};