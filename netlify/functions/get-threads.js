// netlify/functions/get-threads.js
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {

  // Use auth token if provided (to know which votes belong to current user)
  const token = event.headers.authorization?.replace('Bearer ', '');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
  );

  const specialty = event.queryStringParameters?.specialty || null;
  const thread_id = event.queryStringParameters?.thread_id || null;

  try {
    // Single thread with comments
    if (thread_id) {
      const { data: thread, error: tErr } = await supabase
        .from('threads')
        .select(`*, profiles(full_name, credential, country, avatar_initials)`)
        .eq('id', thread_id)
        .single();

      if (tErr) throw tErr;

      const { data: comments, error: cErr } = await supabase
        .from('comments')
        .select(`*, profiles(full_name, credential, country, avatar_initials)`)
        .eq('thread_id', thread_id)
        .order('created_at', { ascending: true });

      if (cErr) throw cErr;

      // Get current user's votes for these comments
      let userVotes = new Set();
      if (token) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const commentIds = (comments || []).map(c => c.id);
          if (commentIds.length > 0) {
            const { data: votes } = await supabase
              .from('comment_votes')
              .select('comment_id')
              .eq('user_id', user.id)
              .in('comment_id', commentIds);
            (votes || []).forEach(v => userVotes.add(v.comment_id));
          }
        }
      }

      // Attach voted flag to each comment
      const enrichedComments = (comments || []).map(c => ({
        ...c,
        user_has_voted: userVotes.has(c.id)
      }));

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread, comments: enrichedComments })
      };
    }

    // Thread list
    let query = supabase
      .from('threads')
      .select(`*, profiles(full_name, credential, country, avatar_initials)`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (specialty) query = query.eq('specialty', specialty);

    const { data: threads, error } = await query;
    if (error) throw error;

    const ids = threads.map(t => t.id);
    const { data: counts } = await supabase
      .from('comments')
      .select('thread_id')
      .in('thread_id', ids);

    const countMap = {};
    (counts || []).forEach(c => {
      countMap[c.thread_id] = (countMap[c.thread_id] || 0) + 1;
    });

    const enriched = threads.map(t => ({
      ...t,
      comment_count: countMap[t.id] || 0
    }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threads: enriched })
    };

  } catch (err) {
    console.error('get-threads error:', err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};