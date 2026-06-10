// netlify/functions/toggle-vote.js
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

  const { comment_id } = body;
  if (!comment_id) {
    return { statusCode: 400, body: JSON.stringify({ error: 'comment_id required' }) };
  }

  try {
    // Check if vote already exists
    const { data: existing } = await supabase
      .from('comment_votes')
      .select('id')
      .eq('comment_id', comment_id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Already voted — remove vote
      await supabase
        .from('comment_votes')
        .delete()
        .eq('comment_id', comment_id)
        .eq('user_id', user.id);

      // Decrement upvotes on comment
      await supabase.rpc('decrement_upvotes', { row_id: comment_id });

      return {
        statusCode: 200,
        body: JSON.stringify({ action: 'removed' })
      };

    } else {
      // Not voted — add vote
      await supabase
        .from('comment_votes')
        .insert({ comment_id, user_id: user.id });

      // Increment upvotes on comment
      await supabase.rpc('increment_upvotes', { row_id: comment_id });

      return {
        statusCode: 200,
        body: JSON.stringify({ action: 'added' })
      };
    }

  } catch (err) {
    console.error('toggle-vote error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to toggle vote' })
    };
  }
};