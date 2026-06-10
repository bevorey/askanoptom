// netlify/functions/get-threads.js
import { createClient } from '@supabase/supabase-js';

export const handler = async (event) => {

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );

  const specialty = event.queryStringParameters?.specialty || null;
  const thread_id = event.queryStringParameters?.thread_id || null;

  try {
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

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thread, comments })
      };
    }

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