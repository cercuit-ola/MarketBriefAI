import { useState } from "react";

// When deployed on Vercel, API routes are on the same domain
const API = "";

const PROVIDERS = [
  { id: "anthropic", label: "Anthropic Claude", color: "#c9784c", hint: "Get free key → console.anthropic.com" },
  { id: "gemini",    label: "Google Gemini",    color: "#4285f4", hint: "FREE 1M tokens/day → aistudio.google.com" },
  { id: "deepseek",  label: "DeepSeek",         color: "#6c5ce7", hint: "Ultra cheap $0.14/1M → platform.deepseek.com" },
];

const SLIDES = [
  { id: "summary",       label: "Summary",    icon: "📋" },
  { id: "sp500",         label: "S&P 500",    icon: "📈" },
  { id: "nigeria",       label: "NGX",        icon: "🇳🇬" },
  { id: "global",        label: "Global",     icon: "🌍" },
  { id: "news",          label: "News",       icon: "📰" },
  { id: "opportunities", label: "Picks",      icon: "💡" },
];

const LOADING_STEPS = [
  "Scanning S&P 500 data...",
  "Analyzing NGX All-Share Index...",
  "Fetching global indices...",
  "Reading world news feeds...",
  "Identifying investment signals...",
  "Composing your morning briefing...",
];

export default function App() {
  const [provider, setProvider]         = useState("gemini");
  const [apiKey, setApiKey]             = useState("");
  const [email, setEmail]               = useState("");
  const [smtpUser, setSmtpUser]         = useState("");
  const [smtpPass, setSmtpPass]         = useState("");
  const [tab, setTab]                   = useState("dashboard");
  const [loading, setLoading]           = useState(false);
  const [loadMsg, setLoadMsg]           = useState("");
  const [briefing, setBriefing]         = useState(null);
  const [activeSlide, setActiveSlide]   = useState("summary");
  const [toast, setToast]               = useState(null);
  const [showSmtp, setShowSmtp]         = useState(false);

  const flash = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const animateLoader = () => {
    let i = 0;
    setLoadMsg(LOADING_STEPS[0]);
    const iv = setInterval(() => {
      i = (i + 1) % LOADING_STEPS.length;
      setLoadMsg(LOADING_STEPS[i]);
    }, 2000);
    return iv;
  };

  const generate = async () => {
    if (!apiKey.trim()) return flash("Enter your AI API key in Settings first", "err");
    setLoading(true); setBriefing(null);
    const iv = animateLoader();
    try {
      const res = await fetch(`${API}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, apiKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generation failed");
      setBriefing(json.data);
      setActiveSlide("summary");
      flash("Briefing generated ✓");
    } catch (e) {
      flash(e.message, "err");
    } finally { clearInterval(iv); setLoading(false); }
  };

  const sendNow = async () => {
    if (!apiKey.trim()) return flash("Enter AI API key first", "err");
    if (!email.trim()) return flash("Enter recipient email", "err");
    if (!smtpUser.trim() || !smtpPass.trim()) return flash("Enter Gmail credentials in Settings → Email section", "err");
    setLoading(true);
    const iv = animateLoader();
    try {
      const res = await fetch(`${API}/api/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, provider, apiKey, smtpUser, smtpPass }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");
      setBriefing(json.data);
      setActiveSlide("summary");
      flash(`📧 Sent to ${email} ✓`);
    } catch (e) {
      flash(e.message, "err");
    } finally { clearInterval(iv); setLoading(false); }
  };

  const prov = PROVIDERS.find(p => p.id === provider);

  return (
    <div style={s.root}>
      <style>{css}</style>

      {/* ── MASTHEAD ── */}
      <header style={s.masthead}>
        <div style={s.eyebrow}>AI-POWERED FINANCIAL INTELLIGENCE</div>
        <h1 style={s.title}>The Market <em style={{color:"#c9a84c"}}>Brief</em></h1>
        <div style={s.dateline}>
          {new Date().toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}).toUpperCase()}
        </div>
        <div style={s.subline}>S&amp;P 500 · NGX NIGERIA · GLOBAL MARKETS · WORLD NEWS · OPPORTUNITIES</div>
      </header>

      {/* ── TOP NAV ── */}
      <nav style={s.nav}>
        <button style={{...s.navBtn, ...(tab==="dashboard" ? s.navActive : {})}} onClick={()=>setTab("dashboard")}>📊 Dashboard</button>
        <button style={{...s.navBtn, ...(tab==="settings"  ? s.navActive : {})}} onClick={()=>setTab("settings")}>⚙️ Settings</button>
        <div style={{flex:1}}/>
        <div style={s.provPill} onClick={()=>setTab("settings")}>
          <span style={{width:8,height:8,borderRadius:"50%",background:prov.color,display:"inline-block",marginRight:6}}/>
          {prov.label}
        </div>
      </nav>

      {/* ══════════════ SETTINGS TAB ══════════════ */}
      {tab === "settings" && (
        <div style={s.settingsWrap}>

          {/* AI Provider */}
          <div style={s.card}>
            <div style={s.cardHead}>🤖 AI Provider</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
              {PROVIDERS.map(p => (
                <button key={p.id}
                  style={{...s.provBtn, ...(provider===p.id ? {background:p.color,color:"white",borderColor:p.color} : {})}}
                  onClick={()=>setProvider(p.id)}>
                  {p.label}
                </button>
              ))}
            </div>
            <label style={s.lbl}>API Key</label>
            <input style={s.inp} type="password" placeholder="Paste your API key here" value={apiKey} onChange={e=>setApiKey(e.target.value)}/>
            <div style={s.hint}>💡 {prov.hint}</div>
          </div>

          {/* Email */}
          <div style={s.card}>
            <div style={s.cardHead}>📧 Email Settings</div>
            <label style={s.lbl}>Recipient Email</label>
            <input style={s.inp} type="email" placeholder="who receives the briefing" value={email} onChange={e=>setEmail(e.target.value)}/>

            <button style={{...s.smtpToggle}} onClick={()=>setShowSmtp(!showSmtp)}>
              {showSmtp ? "▲ Hide" : "▼ Show"} Gmail Sender Credentials
            </button>

            {showSmtp && (
              <>
                <label style={s.lbl}>Gmail Address (sender)</label>
                <input style={s.inp} type="email" placeholder="yourgmail@gmail.com" value={smtpUser} onChange={e=>setSmtpUser(e.target.value)}/>
                <label style={s.lbl}>Gmail App Password</label>
                <input style={s.inp} type="password" placeholder="xxxx xxxx xxxx xxxx" value={smtpPass} onChange={e=>setSmtpPass(e.target.value)}/>
                <div style={s.hint}>
                  ⚙️ Need a Gmail App Password?<br/>
                  Google Account → Security → 2-Step Verification → App Passwords → Create one for "Mail"
                </div>
              </>
            )}
          </div>

          {/* Vercel Cron Info */}
          <div style={s.card}>
            <div style={s.cardHead}>⏰ Daily 9AM Email (Vercel Cron)</div>
            <div style={{fontFamily:"monospace",fontSize:12,lineHeight:1.9,color:"#2c2c3a"}}>
              <div style={{background:"#0a0a0f",color:"#c9a84c",padding:"12px 16px",marginBottom:14,fontFamily:"monospace",fontSize:11}}>
                vercel.json already configures:<br/>
                <span style={{color:"white"}}>cron: "0 8 * * *"  → 9AM WAT daily</span>
              </div>
              <b>To activate the daily email:</b><br/>
              1. Deploy this project to Vercel<br/>
              2. Go to Vercel Dashboard → Settings → Environment Variables<br/>
              3. Add these variables:<br/>
              <div style={{background:"#f5f0e8",border:"1px solid #d4cfc4",padding:"10px 14px",margin:"10px 0",fontSize:11}}>
                <b>CRON_SECRET</b> = any random string (e.g. abc123xyz)<br/>
                <b>SMTP_USER</b> = your gmail address<br/>
                <b>SMTP_PASS</b> = your gmail app password<br/>
                <b>SUBSCRIBERS</b> = <span style={{color:"#c0392b"}}>[{`{"email":"you@email.com","provider":"gemini","apiKey":"AIza..."}`}]</span>
              </div>
              4. Redeploy — emails go out at 9AM WAT every day automatically ✓
            </div>
          </div>

        </div>
      )}

      {/* ══════════════ DASHBOARD TAB ══════════════ */}
      {tab === "dashboard" && (
        <div>
          {/* Status ticker */}
          {loading && (
            <div style={s.ticker}>
              <div style={s.tickerDot} className="pulse"/>
              <span style={{fontFamily:"monospace",fontSize:11}}>{loadMsg}</span>
            </div>
          )}

          {/* Action bar */}
          <div style={s.actionBar}>
            <div style={{fontFamily:"monospace",fontSize:11,color:"#7a7a8a",flex:1}}>
              {briefing ? `Generated ${new Date().toLocaleTimeString()}` : "Ready to generate your briefing"}
            </div>
            <button style={s.btnGold} onClick={generate} disabled={loading}>
              {loading ? "Working..." : "⚡ Generate"}
            </button>
            <button style={s.btnDark} onClick={sendNow} disabled={loading}>
              📧 Send to Email
            </button>
          </div>

          {/* Empty */}
          {!briefing && !loading && (
            <div style={s.empty}>
              <div style={{fontSize:56}}>📊</div>
              <div style={s.emptyTitle}>Your morning briefing awaits</div>
              <div style={s.emptySub}>Set your AI key in ⚙️ Settings, then hit Generate</div>
            </div>
          )}

          {/* Loader */}
          {loading && (
            <div style={s.loader}>
              <div style={s.ring} className="spin"/>
              <div style={{fontFamily:"monospace",fontSize:11,color:"#7a7a8a",marginTop:16}} className="blink">{loadMsg}_</div>
            </div>
          )}

          {/* Slides */}
          {briefing && !loading && (
            <>
              <div style={s.tabs}>
                {SLIDES.map(sl => (
                  <button key={sl.id}
                    style={{...s.tab, ...(activeSlide===sl.id ? s.tabActive : {})}}
                    onClick={()=>setActiveSlide(sl.id)}>
                    {sl.icon} {sl.label}
                  </button>
                ))}
              </div>
              <div className="fadeIn">
                {activeSlide==="summary"       && <SummarySlide  d={briefing.summary}/>}
                {activeSlide==="sp500"         && <SP500Slide    d={briefing.sp500}/>}
                {activeSlide==="nigeria"       && <NGXSlide      d={briefing.nigeria}/>}
                {activeSlide==="global"        && <GlobalSlide   d={briefing.global}/>}
                {activeSlide==="news"          && <NewsSlide     d={briefing.news}/>}
                {activeSlide==="opportunities" && <OppSlide      d={briefing.opportunities}/>}
              </div>
            </>
          )}
        </div>
      )}

      {toast && (
        <div style={{...s.toast, borderLeftColor: toast.type==="err" ? "#c0392b" : "#c9a84c"}}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

// ── SHARED COMPONENTS ──────────────────────────────────────────────────────────

function Badge({signal}) {
  const map = { bullish:{bg:"#e8f5e9",fg:"#1a6b3a"}, bearish:{bg:"#fdecea",fg:"#c0392b"}, neutral:{bg:"#fef9e7",fg:"#c9a84c"} };
  const c = map[signal] || map.neutral;
  return <span style={{background:c.bg,color:c.fg,padding:"2px 10px",fontFamily:"monospace",fontSize:10,fontWeight:700,letterSpacing:1,textTransform:"uppercase"}}>{signal||"neutral"}</span>;
}

function Slide({category, headline, footer, children}) {
  return (
    <div style={s.card2}>
      <div style={s.slideHdr}>
        <div>
          <div style={s.slideCat}>{category}</div>
          <div style={s.slideH}>{headline}</div>
        </div>
        <div style={{fontFamily:"monospace",fontSize:10,color:"#7a7a8a",textAlign:"right",flexShrink:0}}>
          {new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}<br/>
          {new Date().toLocaleDateString("en-US",{month:"short",day:"numeric"})}
        </div>
      </div>
      <div style={s.slideBody}>{children}</div>
      <div style={s.slideFoot}>
        <span style={{fontFamily:"monospace",fontSize:10,color:"#7a7a8a"}}>THE MARKET BRIEF · AI-GENERATED</span>
        <span style={{fontFamily:"monospace",fontSize:10,color:"#7a7a8a"}}>{footer}</span>
      </div>
    </div>
  );
}

function Block({label, value, change, dir, accent, children}) {
  const col = accent || (dir==="up" ? "#1a6b3a" : dir==="down" ? "#c0392b" : "#d4cfc4");
  return (
    <div style={{borderLeft:`3px solid ${col}`,paddingLeft:16}}>
      {label  && <div style={s.dLbl}>{label}</div>}
      {value  && <div style={s.dVal}>{value}</div>}
      {change && <div style={{fontFamily:"monospace",fontSize:13,fontWeight:700,color:dir==="up"?"#1a6b3a":dir==="down"?"#c0392b":"#7a7a8a"}}>{change}</div>}
      {children}
    </div>
  );
}

function Bullets({items}) {
  return (
    <ul style={{listStyle:"none",padding:0,margin:"10px 0 0"}}>
      {(items||[]).map((it,i) => (
        <li key={i} style={{fontFamily:"Georgia,serif",fontSize:13,lineHeight:1.6,padding:"6px 0",borderBottom:"1px solid #f0ece4",display:"flex",gap:8,color:"#2c2c3a"}}>
          <span style={{color:"#c9a84c",fontFamily:"monospace",fontSize:12,flexShrink:0}}>→</span>{it}
        </li>
      ))}
    </ul>
  );
}

function SummarySlide({d}) {
  return (
    <Slide category="Executive Summary" headline={d?.headline||"Market Briefing"} footer={`MOOD: ${(d?.mood||"").toUpperCase()}`}>
      <Block label="S&P 500 Snapshot" dir="neutral" accent="#c9a84c">
        <div style={s.dTxt}>{d?.sp500_snapshot}</div>
      </Block>
      <Block label="NGX Nigeria Snapshot" dir="neutral" accent="#c9a84c">
        <div style={s.dTxt}>{d?.ngx_snapshot}</div>
        <div style={{marginTop:8}}><Badge signal={d?.signal}/></div>
      </Block>
      <div style={{gridColumn:"1/-1"}}>
        <div style={s.dLbl}>Top Story</div>
        <div style={s.dTxt}>{d?.top_story}</div>
      </div>
    </Slide>
  );
}

function SP500Slide({d}) {
  return (
    <Slide category="S&P 500 Index" headline={d?.headline||"S&P 500"} footer="NYSE / CBOE">
      <Block label="Current Level" value={d?.level} change={d?.change} dir={d?.direction}>
        <div style={{marginTop:8}}><Badge signal={d?.signal}/></div>
      </Block>
      <div>
        <div style={s.dLbl}>Analysis</div>
        <div style={s.dTxt}>{d?.trend}</div>
        <Bullets items={d?.sectors}/>
      </div>
    </Slide>
  );
}

function NGXSlide({d}) {
  return (
    <Slide category="Nigerian Stock Exchange (NGX)" headline={d?.headline||"NGX"} footer="LAGOS — NGX GROUP">
      <Block label="All-Share Index" value={d?.allshare} change={d?.change} dir={d?.direction}>
        <div style={{marginTop:8}}><Badge signal={d?.signal}/></div>
      </Block>
      <div>
        <div style={s.dLbl}>Top Movers</div>
        <Bullets items={d?.top_movers}/>
        <div style={{marginTop:12,...s.dTxt}}>{d?.analysis}</div>
      </div>
    </Slide>
  );
}

function GlobalSlide({d}) {
  return (
    <Slide category="Global Markets" headline={d?.headline||"Global Overview"} footer="WORLD INDICES">
      <div style={{gridColumn:"1/-1",display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:16}}>
        {(d?.indices||[]).map((idx,i) => (
          <Block key={i} label={idx.name} value={idx.value} change={idx.change} dir={idx.dir}/>
        ))}
      </div>
      <div style={{gridColumn:"1/-1"}}>
        <div style={s.dLbl}>Global Picture</div>
        <div style={s.dTxt}>{d?.summary}</div>
      </div>
    </Slide>
  );
}

function NewsSlide({d}) {
  return (
    <Slide category="World News & Macro" headline={d?.headline||"Today's Headlines"} footer="CURATED BY AI">
      <div style={{gridColumn:"1/-1"}}>
        {(d?.stories||[]).map((st,i) => (
          <div key={i} style={{borderLeft:"3px solid #c9a84c",paddingLeft:14,marginBottom:18}}>
            <div style={{fontFamily:"Georgia,serif",fontSize:15,fontWeight:700,marginBottom:4}}>{st.title}</div>
            <div style={{fontFamily:"Georgia,serif",fontSize:13,color:"#7a7a8a",lineHeight:1.6}}>{st.impact}</div>
          </div>
        ))}
      </div>
    </Slide>
  );
}

function OppSlide({d}) {
  return (
    <Slide category="Investment Opportunities" headline={d?.headline||"Today's Picks"} footer="NOT FINANCIAL ADVICE">
      <div style={{gridColumn:"1/-1"}}>
        {(d?.picks||[]).map((p,i) => (
          <div key={i} style={{borderBottom:"1px solid #e8e4dc",padding:"14px 0"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,flexWrap:"wrap",gap:8}}>
              <div>
                <span style={{fontFamily:"monospace",fontWeight:700,fontSize:17}}>{p.ticker}</span>
                <span style={{fontFamily:"sans-serif",color:"#7a7a8a",fontSize:13,marginLeft:10}}>{p.name}</span>
              </div>
              <Badge signal={p.signal}/>
            </div>
            <div style={s.dTxt}>{p.thesis}</div>
          </div>
        ))}
        <div style={{fontFamily:"monospace",fontSize:10,color:"#7a7a8a",marginTop:14,lineHeight:1.7}}>{d?.disclaimer}</div>
      </div>
    </Slide>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────────
const s = {
  root:        {maxWidth:1080,margin:"0 auto",padding:"0 20px 80px",background:"#f5f0e8",minHeight:"100vh",fontFamily:"Georgia,serif"},
  masthead:    {borderBottom:"3px double #0a0a0f",padding:"28px 0 14px",textAlign:"center"},
  eyebrow:     {fontFamily:"monospace",fontSize:10,letterSpacing:3,color:"#7a7a8a",textTransform:"uppercase",marginBottom:6},
  title:       {fontFamily:"Georgia,serif",fontSize:50,lineHeight:1,letterSpacing:-1,margin:0},
  dateline:    {fontFamily:"monospace",fontSize:11,color:"#7a7a8a",marginTop:8},
  subline:     {fontFamily:"monospace",fontSize:10,color:"#7a7a8a",letterSpacing:3,textTransform:"uppercase",borderTop:"1px solid #d4cfc4",borderBottom:"1px solid #d4cfc4",padding:"5px 0",marginTop:10},
  nav:         {display:"flex",gap:4,padding:"12px 0",borderBottom:"1px solid #d4cfc4",alignItems:"center",flexWrap:"wrap"},
  navBtn:      {background:"none",border:"none",fontFamily:"monospace",fontSize:11,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",padding:"8px 16px",color:"#7a7a8a"},
  navActive:   {color:"#0a0a0f",borderBottom:"2px solid #c9a84c"},
  provPill:    {fontFamily:"monospace",fontSize:10,background:"#0a0a0f",color:"#c9a84c",padding:"5px 12px",cursor:"pointer",letterSpacing:1},
  settingsWrap:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20,padding:"24px 0"},
  card:        {background:"white",border:"1px solid #d4cfc4",padding:24},
  cardHead:    {fontFamily:"Georgia,serif",fontSize:18,marginBottom:16,borderBottom:"1px solid #e8e4dc",paddingBottom:8},
  lbl:         {display:"block",fontFamily:"monospace",fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"#7a7a8a",marginBottom:6,marginTop:12},
  inp:         {width:"100%",border:"1px solid #d4cfc4",padding:"10px 12px",fontFamily:"monospace",fontSize:12,outline:"none",background:"#faf8f4",color:"#0a0a0f",boxSizing:"border-box"},
  hint:        {fontFamily:"monospace",fontSize:10,color:"#7a7a8a",marginTop:6,lineHeight:1.7},
  smtpToggle:  {marginTop:14,background:"none",border:"1px dashed #d4cfc4",padding:"6px 12px",fontFamily:"monospace",fontSize:10,cursor:"pointer",color:"#7a7a8a",width:"100%",textAlign:"left"},
  provBtn:     {border:"1px solid #d4cfc4",background:"white",padding:"7px 14px",fontFamily:"monospace",fontSize:11,cursor:"pointer",color:"#0a0a0f"},
  ticker:      {background:"#0a0a0f",color:"#c9a84c",padding:"8px 16px",display:"flex",gap:8,alignItems:"center",margin:"0 -20px"},
  tickerDot:   {width:6,height:6,borderRadius:"50%",background:"#c9a84c",flexShrink:0},
  actionBar:   {display:"flex",gap:12,alignItems:"center",padding:"16px 0",borderBottom:"1px solid #d4cfc4",flexWrap:"wrap"},
  btnGold:     {background:"#c9a84c",color:"#0a0a0f",border:"none",padding:"11px 28px",fontFamily:"monospace",fontSize:11,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",fontWeight:700},
  btnDark:     {background:"#0a0a0f",color:"#f5f0e8",border:"none",padding:"11px 24px",fontFamily:"monospace",fontSize:11,letterSpacing:1,textTransform:"uppercase",cursor:"pointer"},
  empty:       {padding:"80px 20px",textAlign:"center",border:"2px dashed #d4cfc4",background:"white",marginTop:32},
  emptyTitle:  {fontFamily:"Georgia,serif",fontSize:22,marginTop:14},
  emptySub:    {fontFamily:"monospace",fontSize:12,color:"#7a7a8a",marginTop:8},
  loader:      {padding:"80px",textAlign:"center"},
  ring:        {width:40,height:40,border:"2px solid #d4cfc4",borderTopColor:"#c9a84c",borderRadius:"50%",margin:"0 auto"},
  tabs:        {display:"flex",gap:0,overflowX:"auto",borderBottom:"2px solid #0a0a0f",marginTop:24},
  tab:         {padding:"8px 16px",fontFamily:"monospace",fontSize:10,letterSpacing:1,textTransform:"uppercase",border:"none",background:"none",cursor:"pointer",color:"#7a7a8a",whiteSpace:"nowrap",borderBottom:"3px solid transparent",marginBottom:-2},
  tabActive:   {color:"#0a0a0f",borderBottomColor:"#c9a84c",fontWeight:700},
  card2:       {background:"white",border:"1px solid #d4cfc4"},
  slideHdr:    {borderBottom:"2px solid #0a0a0f",padding:"20px 28px",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12},
  slideCat:    {fontFamily:"monospace",fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#c9a84c",marginBottom:4},
  slideH:      {fontFamily:"Georgia,serif",fontSize:26,lineHeight:1.2},
  slideBody:   {padding:28,display:"grid",gridTemplateColumns:"1fr 1fr",gap:24},
  slideFoot:   {borderTop:"1px solid #d4cfc4",padding:"10px 28px",display:"flex",justifyContent:"space-between"},
  dLbl:        {fontFamily:"monospace",fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"#7a7a8a",marginBottom:6},
  dVal:        {fontFamily:"Georgia,serif",fontSize:32,lineHeight:1,marginBottom:4},
  dTxt:        {fontFamily:"Georgia,serif",fontSize:13,lineHeight:1.7,color:"#2c2c3a"},
  toast:       {position:"fixed",bottom:24,right:24,background:"#0a0a0f",color:"#f5f0e8",padding:"14px 24px",fontFamily:"monospace",fontSize:12,letterSpacing:1,borderLeft:"4px solid #c9a84c",zIndex:100,maxWidth:360},
};

const css = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #f5f0e8; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes spin   { to { transform: rotate(360deg); } }
  @keyframes blink  { 50% { opacity: 0; } }
  @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  .pulse { animation: pulse 1.5s ease-in-out infinite; }
  .spin  { animation: spin 0.8s linear infinite; }
  .blink { animation: blink 1s step-end infinite; }
  .fadeIn { animation: fadeIn 0.3s ease; }
  button:disabled { opacity: 0.5; cursor: not-allowed !important; }
  @media(max-width:640px){
    h1 { font-size: 34px !important; }
    div[style*="gridTemplateColumns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
    div[style*="repeat(2,1fr)"] { grid-template-columns: 1fr !important; }
  }
`;
