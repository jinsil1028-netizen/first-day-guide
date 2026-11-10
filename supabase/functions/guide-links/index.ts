const maxEnvelopeLength = 4_100_000;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const restUrl = Deno.env.get('SUPABASE_URL') + '/rest/v1';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const databaseHeaders = {
  apikey: serviceKey,
  Authorization: 'Bearer ' + serviceKey,
  'Content-Type': 'application/json',
};
const responseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Cache-Control': 'no-store',
};

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: responseHeaders });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: responseHeaders });

  try {
    if (request.method === 'POST') {
      if (Number(request.headers.get('content-length')) > maxEnvelopeLength) {
        return json({ error: 'Guide is too large' }, 413);
      }
      const envelope = await request.text();
      if (envelope.length < 38 || envelope.length > maxEnvelopeLength || !/^[A-Za-z0-9_-]+$/.test(envelope)) {
        return json({ error: 'Invalid guide' }, 400);
      }
      const result = await fetch(restUrl + '/rpc/save_guide_link', {
        method: 'POST',
        headers: databaseHeaders,
        body: JSON.stringify({ envelope }),
      });
      if (result.status === 429) return json({ error: 'Guide storage limit reached' }, 429);
      if (!result.ok) return json({ error: 'Could not save guide' }, 502);
      return json({ id: await result.json() }, 201);
    }

    if (request.method === 'GET') {
      const id = new URL(request.url).searchParams.get('id');
      if (!id || !uuidPattern.test(id)) return json({ error: 'Invalid guide link' }, 400);
      const result = await fetch(restUrl + '/guide_links?select=encrypted_guide&id=eq.' + id, {
        headers: databaseHeaders,
      });
      if (!result.ok) return json({ error: 'Could not load guide' }, 502);
      const [row] = await result.json();
      return row ? json({ envelope: row.encrypted_guide }) : json({ error: 'Guide not found' }, 404);
    }

    return json({ error: 'Method not allowed' }, 405);
  } catch {
    return json({ error: 'Guide storage unavailable' }, 502);
  }
});
