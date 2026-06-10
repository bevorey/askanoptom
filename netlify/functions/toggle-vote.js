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

  // Use service role key for direct DB writes — bypasses RLS for upvote count
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  // Use anon client with user token to verify identity
  const supabaseUser = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const { data: { user }, error: authErr } = await supabaseUser.auth.getUser();
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
    const { data: existing } = await supabaseAdmin
      .from('comment_votes')
      .select('id')
      .eq('comment_id', comment_id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Remove vote and decrement
      await supabaseAdmin
        .from('comment_votes')
        .delete()
        .eq('comment_id', comment_id)
        .eq('user_id', user.id);

      await supabaseAdmin
        .from('comments')
        .update({ upvotes: supabaseAdmin.sql`greatest(upvotes - 1, 0)` })
        .eq('id', comment_id);

      // Fetch updated count
      const { data: updated } = await supabaseAdmin
        .from('comments')
        .select('upvotes')
        .eq('id', comment_id)
        .single();

      return {
        statusCode: 200,
        body: JSON.stringify({ action: 'removed', upvotes: updated?.upvotes ?? 0 })
      };

    } else {
      // Add vote and increment
      await supabaseAdmin
        .from('comment_votes')
        .insert({ comment_id, user_id: user.id });

      // Get current count and increment
      const { data: current } = await supabaseAdmin
        .from('comments')
        .select('upvotes')
        .eq('id', comment_id)
        .single();

      const newCount = (current?.upvotes || 0) + 1;

      await supabaseAdmin
        .from('comments')
        .update({ upvotes: newCount })
        .eq('id', comment_id);

      return {
        statusCode: 200,
        body: JSON.stringify({ action: 'added', upvotes: newCount })
      };
    }

  } catch (err) {
    console.error('toggle-vote error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to toggle vote: ' + err.message })
    };
  }
};