// api/generate.js — Vercel Serverless Function
const axios = require("axios");

async function fetchBriefing(provider, apiKey) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const prompt = `You are a financial intelligence agent. Today is ${today}.
Generate a morning market briefing. Respond ONLY with valid JSON (no markdown), exactly this structure:
{
  "summary": {"headline":"6-word headline","mood":"bullish|bearish|neutral","sp500_snapshot":"one sentence","ngx_snapshot":"one sentence","top_story":"one sentence"},
  "sp500": {"headline":"text","level":"XXXX.XX","change":"+X.XX%","direction":"up|down|neutral","trend":"2 sentences","sectors":["s1","s2","s3"],"signal":"bullish|bearish|neutral"},
  "nigeria": {"headline":"text","allshare":"XXXXXX.XX","change":"+X.XX%","direction":"up|down|neutral","top_movers":["m1","m2"],"analysis":"2 sentences","signal":"bullish|bearish|neutral"},
  "global": {"headline":"text","indices":[{"name":"Dow Jones","value":"XXXXX","change":"+X.X%","dir":"up"},{"name":"NASDAQ","value":"XXXXX","change":"+X.X%","dir":"up"},{"name":"FTSE 100","value":"XXXXX","change":"-X.X%","dir":"down"},{"name":"Crude Oil","value":"$XX.XX","change":"+X.X%","dir":"up"}],"summary":"2 sentences"},
  "news": {"headline":"text","stories":[{"title":"s1","impact":"i1"},{"title":"s2","impact":"i2"},{"title":"s3","impact":"i3"}]},
  "opportunities": {"headline":"text","picks":[{"ticker":"T1","name":"Co1","thesis":"2 sentences","signal":"bullish"},{"ticker":"T2","name":"Co2","thesis":"2 sentences","signal":"neutral"},{"ticker":"NGX:T3","name":"Nigerian Co","thesis":"2 sentences","signal":"bullish"}],"disclaimer":"For informational purposes only. Not financial advice."}
}`;

  if (provider === "anthropic") {
    const res = await axios.post(
      "https://api.anthropic.com/v1/messages",
      { model: "claude-haiku-4-5-20251001", max_tokens: 2000, messages: [{ role: "user", content: prompt }] },
      { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "Content-Type": "application/json" } }
    );
    return parseJSON(res.data.content[0].text);
  }
  if (provider === "gemini") {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      { contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 2000 } }
    );
    return parseJSON(res.data.candidates[0].content.parts[0].text);
  }
  if (provider === "deepseek") {
    const res = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      { model: "deepseek-chat", messages: [{ role: "user", content: prompt }], max_tokens: 2000 },
      { headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" } }
    );
    return parseJSON(res.data.choices[0].message.content);
  }
  throw new Error("Unknown provider: " + provider);
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found");
  return JSON.parse(clean.slice(start, end + 1));
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { provider, apiKey } = req.body;
  if (!provider || !apiKey) return res.status(400).json({ error: "provider and apiKey required" });

  try {
    const data = await fetchBriefing(provider, apiKey);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
