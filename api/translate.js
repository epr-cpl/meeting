// api/translate.js
// Vercel serverless function — proxies translation requests to DeepL.
// The DeepL API key lives only in the Vercel environment variable DEEPL_API_KEY,
// never in this file and never sent to the browser.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.DEEPL_API_KEY) {
      return res.status(500).json({ error: 'DEEPL_API_KEY is not set in Vercel environment variables' });
    }

    const { text, targetLang, htmlTags } = req.body || {};
    if (!text) {
      return res.status(400).json({ error: 'No text provided' });
    }

    const params = {
      text: [text],
      target_lang: targetLang || 'EN',
    };
    if (htmlTags) {
      // Preserves <b>, <ul>, <a>, etc. inside the text while translating the wording.
      params.tag_handling = 'html';
    }

    const response = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${process.env.DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.message || 'DeepL request failed' });
    }

    return res.status(200).json({ translation: data.translations[0].text });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
