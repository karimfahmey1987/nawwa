// Vercel Serverless Function: /api/coach
// Securely proxies AI Coach conversations using server-side environment variables
// (GEMINI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY) with zero-config fallback.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { messages = [], systemPrompt = '', userText = '' } = req.body || {};

    // 1. Google Gemini API (Server Env Key)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const geminiContents = [
          { role: 'user', parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}` }] },
          {
            role: 'model',
            parts: [{ text: 'Understood. I will coach warmly, naturally, and use action tags when helpful.' }]
          },
          ...messages
            .filter((m) => m.role !== 'system')
            .map((m) => ({
              role: m.role === 'user' ? 'user' : 'model',
              parts: [{ text: m.content }]
            }))
        ];

        const gRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(
            geminiKey
          )}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: geminiContents })
          }
        );

        if (gRes.ok) {
          const gData = await gRes.json();
          const reply = gData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return res.status(200).json({ reply, provider: 'gemini' });
          }
        }
      } catch (_) {}
    }

    // 2. Groq or OpenAI API (Server Env Key)
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const activeKey = groqKey || openaiKey;

    if (activeKey) {
      try {
        const baseUrl = groqKey
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://api.openai.com/v1/chat/completions';
        const model = groqKey ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

        const oRes = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${activeKey}`
          },
          body: JSON.stringify({ model, messages, temperature: 0.7 })
        });

        if (oRes.ok) {
          const oData = await oRes.json();
          const reply = oData?.choices?.[0]?.message?.content;
          if (reply) {
            return res.status(200).json({ reply, provider: groqKey ? 'groq' : 'openai' });
          }
        }
      } catch (_) {}
    }

    // 3. Free Cloud OpenAI-Compatible Fallback
    const pRes = await fetch('https://text.pollinations.ai/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai',
        messages: messages.length ? messages : [{ role: 'user', content: userText }],
        temperature: 0.75
      })
    });

    if (pRes.ok) {
      const pData = await pRes.json();
      const reply = pData?.choices?.[0]?.message?.content;
      if (reply) {
        return res.status(200).json({ reply, provider: 'cloud-free' });
      }
    }

    return res.status(200).json({ reply: null, provider: 'fallback' });
  } catch (err) {
    return res.status(200).json({ reply: null, error: String(err.message || err) });
  }
}
