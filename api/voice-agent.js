import fetch from 'node-fetch';

const VOYAGE_API_KEY = process.env.VOYAGE_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST allowed' });
    return;
  }

  const { user_query, resident_id } = req.body;

  if (!user_query || !resident_id) {
    res.status(400).json({ error: 'Missing user_query or resident_id' });
    return;
  }

  try {
    // 1. Maak embedding aan bij Voyage.ai
    const embedResponse = await fetch('https://api.voyage.ai/embed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: user_query,
      }),
    });

    const embedData = await embedResponse.json();
    const embedding = embedData.embedding;

    // 2. Zoek relevante herinneringen in Supabase
    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/reminders?resident_id=eq.${resident_id}&embedding=embedding_search.${embedding}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const reminders = await supabaseResponse.json();

    // 3. Geef de herinneringen terug
    res.status(200).json({ reminders });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}