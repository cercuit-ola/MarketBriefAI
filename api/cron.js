// api/cron.js — Called by Vercel Cron at 9AM daily
// Reads subscribers from env var, generates + emails each one
const axios = require("axios");
const nodemailer = require("nodemailer");

// Re-use the same fetchBriefing + buildHTML logic
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
  throw new Error("Unknown provider");
}

function parseJSON(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  const s = clean.indexOf("{"), e = clean.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("No JSON");
  return JSON.parse(clean.slice(s, e + 1));
}

function buildHTML(data) {
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
  const badge = (sig) => {
    const c = { bullish: "background:#e8f5e9;color:#1a6b3a", bearish: "background:#fdecea;color:#c0392b", neutral: "background:#fef9e7;color:#c9a84c" };
    return `<span style="${c[sig] || c.neutral};padding:2px 8px;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;font-family:monospace">${sig || "neutral"}</span>`;
  };
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f0e8;font-family:Georgia,serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td>
<table width="660" align="center" cellpadding="0" cellspacing="0" style="background:#f5f0e8;margin:0 auto">
<tr><td style="padding:32px 28px">
<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:3px double #0a0a0f;padding-bottom:16px;margin-bottom:20px">
<tr><td style="text-align:center;font-family:monospace;font-size:10px;letter-spacing:3px;color:#7a7a8a;text-transform:uppercase">AI-POWERED FINANCIAL INTELLIGENCE</td></tr>
<tr><td style="text-align:center;font-size:44px;color:#0a0a0f">The Market <em style="color:#c9a84c">Brief</em></td></tr>
<tr><td style="text-align:center;font-family:monospace;font-size:11px;color:#7a7a8a;padding-top:6px">${dateStr.toUpperCase()}</td></tr>
</table>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;margin-bottom:20px">
<tr><td style="padding:16px 20px">
<div style="font-family:monospace;font-size:9px;color:#c9a84c;letter-spacing:3px;text-transform:uppercase">TODAY'S SIGNAL</div>
<div style="font-size:20px;color:#f5f0e8;font-style:italic;margin-top:4px">${data.summary?.headline || ""}</div>
<div style="margin-top:8px">${badge(data.summary?.mood)}</div>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d4cfc4;background:white;margin-bottom:20px">
<tr>
<td width="50%" style="padding:14px 18px;border-right:1px solid #d4cfc4;vertical-align:top">
<div style="font-family:monospace;font-size:9px;letter-spacing:2px;color:#7a7a8a;text-transform:uppercase">S&amp;P 500</div>
<div style="font-size:30px;color:#0a0a0f;margin-top:4px">${data.sp500?.level || "—"}</div>
<div style="font-family:monospace;font-size:12px;font-weight:700;color:${data.sp500?.direction === "up" ? "#1a6b3a" : "#c0392b"}">${data.sp500?.change || "—"}</div>
<div style="font-size:12px;color:#2c2c3a;margin-top:8px;line-height:1.6">${data.sp500?.trend || ""}</div>
</td>
<td width="50%" style="padding:14px 18px;vertical-align:top">
<div style="font-family:monospace;font-size:9px;letter-spacing:2px;color:#7a7a8a;text-transform:uppercase">NGX ALL-SHARE</div>
<div style="font-size:30px;color:#0a0a0f;margin-top:4px">${data.nigeria?.allshare || "—"}</div>
<div style="font-family:monospace;font-size:12px;font-weight:700;color:${data.nigeria?.direction === "up" ? "#1a6b3a" : "#c0392b"}">${data.nigeria?.change || "—"}</div>
<div style="font-size:12px;color:#2c2c3a;margin-top:8px;line-height:1.6">${data.nigeria?.analysis || ""}</div>
</td>
</tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d4cfc4;background:white;margin-bottom:20px">
<tr><td style="padding:12px 18px;border-bottom:2px solid #0a0a0f">
<div style="font-family:monospace;font-size:9px;letter-spacing:3px;color:#c9a84c;text-transform:uppercase">GLOBAL MARKETS</div>
<div style="font-size:17px">${data.global?.headline || ""}</div>
</td></tr>
<tr><td style="padding:14px 18px">
${(data.global?.indices || []).map(i => `<table width="100%" cellpadding="0" cellspacing="0" style="border-bottom:1px solid #f0ece4"><tr><td style="padding:6px 0;font-family:monospace;font-size:12px">${i.name}</td><td style="text-align:center;font-size:15px">${i.value}</td><td style="text-align:right;font-family:monospace;font-size:12px;font-weight:700;color:${i.dir === "up" ? "#1a6b3a" : "#c0392b"}">${i.change}</td></tr></table>`).join("")}
<div style="font-size:13px;color:#2c2c3a;line-height:1.7;margin-top:10px">${data.global?.summary || ""}</div>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d4cfc4;background:white;margin-bottom:20px">
<tr><td style="padding:12px 18px;border-bottom:2px solid #0a0a0f">
<div style="font-family:monospace;font-size:9px;letter-spacing:3px;color:#c9a84c;text-transform:uppercase">WORLD NEWS</div>
<div style="font-size:17px">${data.news?.headline || ""}</div>
</td></tr>
<tr><td style="padding:14px 18px">
${(data.news?.stories || []).map(s => `<div style="border-left:3px solid #c9a84c;padding:6px 0 6px 12px;margin-bottom:12px"><div style="font-size:13px;font-weight:700;color:#0a0a0f">${s.title}</div><div style="font-size:12px;color:#7a7a8a;line-height:1.6;margin-top:3px">${s.impact}</div></div>`).join("")}
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d4cfc4;background:white;margin-bottom:20px">
<tr><td style="padding:12px 18px;border-bottom:2px solid #0a0a0f">
<div style="font-family:monospace;font-size:9px;letter-spacing:3px;color:#c9a84c;text-transform:uppercase">INVESTMENT OPPORTUNITIES</div>
<div style="font-size:17px">${data.opportunities?.headline || ""}</div>
</td></tr>
<tr><td style="padding:14px 18px">
${(data.opportunities?.picks || []).map(p => `<div style="border-bottom:1px solid #e8e4dc;padding:10px 0"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-family:monospace;font-size:13px;font-weight:700">${p.ticker}</td><td style="font-size:11px;color:#7a7a8a;text-align:center">${p.name}</td><td style="text-align:right">${badge(p.signal)}</td></tr></table><div style="font-size:12px;color:#2c2c3a;line-height:1.7;margin-top:6px">${p.thesis}</div></div>`).join("")}
<div style="font-family:monospace;font-size:10px;color:#7a7a8a;margin-top:12px">${data.opportunities?.disclaimer || ""}</div>
</td></tr></table>
<table width="100%" cellpadding="0" cellspacing="0" style="border-top:3px double #0a0a0f;padding-top:14px">
<tr><td style="text-align:center;font-family:monospace;font-size:10px;color:#7a7a8a;line-height:1.9">
THE MARKET BRIEF · AI-GENERATED DAILY INTELLIGENCE<br>
Generated ${new Date().toLocaleTimeString()} · Data is indicative only<br>
<span style="color:#c9a84c">Not financial advice. Always do your own research.</span>
</td></tr></table>
</td></tr></table>
</td></tr></table></body></html>`;
}

module.exports = async (req, res) => {
  // Vercel cron sends a GET request with authorization header
  // Protect with a secret token stored in env vars
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Read config from Vercel Environment Variables
  // SUBSCRIBERS = JSON array: [{"email":"x@x.com","provider":"gemini","apiKey":"AIza..."}]
  // SMTP_USER = your gmail
  // SMTP_PASS = your gmail app password
  const { SUBSCRIBERS, SMTP_USER, SMTP_PASS } = process.env;

  if (!SUBSCRIBERS || !SMTP_USER || !SMTP_PASS) {
    return res.status(500).json({ error: "Missing env vars: SUBSCRIBERS, SMTP_USER, SMTP_PASS" });
  }

  let subscribers;
  try {
    subscribers = JSON.parse(SUBSCRIBERS);
  } catch {
    return res.status(500).json({ error: "SUBSCRIBERS env var is not valid JSON" });
  }

  const results = [];
  for (const sub of subscribers) {
    try {
      const data = await fetchBriefing(sub.provider, sub.apiKey);
      const html = buildHTML(data);
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: SMTP_USER, pass: SMTP_PASS },
      });
      await transporter.sendMail({
        from: `"The Market Brief 📊" <${SMTP_USER}>`,
        to: sub.email,
        subject: `📊 Market Brief — ${new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`,
        html,
      });
      results.push({ email: sub.email, status: "sent" });
    } catch (err) {
      results.push({ email: sub.email, status: "error", error: err.message });
    }
  }

  res.json({ success: true, results, timestamp: new Date().toISOString() });
};
