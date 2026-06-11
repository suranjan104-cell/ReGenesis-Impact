// Cloudflare Pages Function — Sage AI proxy
// Deployed automatically at https://www.regenesisimpact.in/sage
// Requires: ANTHROPIC_API_KEY environment variable in Cloudflare Pages settings
//
// Setup: Cloudflare Pages dashboard → Settings → Environment variables
//        → Add variable: ANTHROPIC_API_KEY = <your key>

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const apiKey = env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return json({ error: 'Sage AI is not configured — ask the site owner to add ANTHROPIC_API_KEY.' }, 503);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'Invalid request.' }, 400); }

  const { system, messages = [], max_tokens = 1024 } = body;

  let upstream;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: MODEL, max_tokens, system, messages }),
    });
  } catch {
    return json({ error: 'Sage AI is temporarily unreachable — please try again.' }, 502);
  }

  const data = await upstream.json();

  if (!upstream.ok) {
    return json({ error: data?.error?.message ?? 'Upstream error', upstream_status: upstream.status }, upstream.status);
  }

  // Return in OpenAI-compatible format so existing client code works unchanged
  const text = data.content?.[0]?.text ?? '';
  return json({
    choices: [{ message: { role: 'assistant', content: text } }],
    model: data.model,
    usage: data.usage,
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}
