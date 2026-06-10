// netlify/functions/post-comment.js
// =============================================
// Posts a comment on a thread
// Requires a valid Supabase auth token
// =============================================

export const handler = async (event) => {

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { createClient } = await import('@supabase/supabase-js');

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

  const { thread_id, body: commentBody } = body;

  if (!thread_id || !commentBody?.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'thread_id and body are required' }) };
  }

  if (commentBody.length > 2000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Comment too long — max 2000 characters' }) };
  }

  try {
    // Ensure profile exists
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
        credential: '',
        country: ''
      });
    }

    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        thread_id,
        author_id: user.id,
        body: commentBody.trim()
      })
      .select(`*, profiles(full_name, credential, country, avatar_initials)`)
      .single();

    if (error) throw error;

    return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    };

  } catch (err) {
    console.error('post-comment error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to post comment. Please try again.' })
    };
  }
};