// ── HELT CORE UTILITIES ──────────────────────────────────────
const TG_TOKEN  = "7637224975:AAH7Al4buvRmfwW3LUZ-REvloF9rZgoAStU";
const TG_CHAT   = "-1002886209903";
const EXAM_VER  = "HELT-2025";
const EXAM_NAME = "HopeBridge English Language Test";

// ── SESSION ──────────────────────────────────────────────────
const S = {
  set(k, v)  { try { sessionStorage.setItem(k, typeof v==='object'?JSON.stringify(v):String(v)); } catch{} },
  get(k, fb) { try { const v=sessionStorage.getItem(k); if(v===null) return fb??null; try{return JSON.parse(v);}catch{return v;} } catch{return fb??null;} },
  del(k)     { try { sessionStorage.removeItem(k); } catch{} }
};

function getCandidate() { return S.get('candidate', {}); }

function candidateBlock(c) {
  return [
    `📋 *${EXAM_NAME} — ${EXAM_VER}*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Full Name:* ${c.fullName||'—'}`,
    `👨 *Father's Name:* ${c.fatherName||'—'}`,
    `🪪 *ID / Tazkira:* ${c.idNumber||'—'}`,
    `📧 *Email:* ${c.email||'—'}`,
    `🆔 *Exam ID:* \`${c.examId||'—'}\``,
    `📅 *Time (AFT):* ${new Date().toLocaleString('en-GB',{timeZone:'Asia/Kabul'})}`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
  ].join('\n');
}

// ── TELEGRAM ─────────────────────────────────────────────────
async function tgText(text) {
  const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ chat_id:TG_CHAT, text, parse_mode:'Markdown' })
  });
  return r.ok;
}

async function tgPhoto(dataUrl, caption) {
  const fd = new FormData();
  fd.append('chat_id', TG_CHAT);
  fd.append('photo', dataURLtoBlob(dataUrl), 'photo.jpg');
  fd.append('caption', caption);
  fd.append('parse_mode', 'Markdown');
  const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendPhoto`, { method:'POST', body:fd });
  return r.ok;
}

async function tgDoc(blob, filename, caption) {
  const fd = new FormData();
  fd.append('chat_id', TG_CHAT);
  fd.append('document', blob, filename);
  fd.append('caption', caption);
  fd.append('parse_mode', 'Markdown');
  const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendDocument`, { method:'POST', body:fd });
  return r.ok;
}

function dataURLtoBlob(dataURL) {
  const [header, data] = dataURL.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const bstr = atob(data);
  const u8 = new Uint8Array(bstr.length);
  for (let i=0; i<bstr.length; i++) u8[i] = bstr.charCodeAt(i);
  return new Blob([u8], {type:mime});
}

// ── AI PRE-SCORING ────────────────────────────────────────────
// Calls Anthropic API to score writing & speaking (kept internal, never shown to candidate)
async function aiScoreWriting(prompt, response, wordCount) {
  try {
    const sysPrompt = `You are a strict CEFR-certified language examiner for the ${EXAM_NAME}. Score the following writing response on a scale of 0–25 based on:
- Task Achievement (0–7): Does the response fully address the prompt with relevant ideas and examples?
- Coherence & Cohesion (0–6): Is it logically organised with clear paragraphing and linking devices?
- Lexical Resource (0–6): Is vocabulary varied, precise, and used accurately?
- Grammatical Range & Accuracy (0–6): Is grammar complex, accurate, and well-controlled?

Return ONLY a JSON object (no markdown, no explanation): {"score":N,"breakdown":{"task":N,"coherence":N,"lexical":N,"grammar":N},"band":"A1|A2|B1|B2|C1|C2","comments":"brief 2-sentence examiner note"}`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: sysPrompt,
        messages: [{ role:'user', content:`Prompt: ${prompt}\n\nWord Count: ${wordCount}\n\nResponse:\n${response}` }]
      })
    });
    const d = await r.json();
    const raw = d.content?.[0]?.text || '{}';
    return JSON.parse(raw.replace(/```json|```/g,'').trim());
  } catch(e) {
    return { score: null, band: null, comments: 'AI scoring unavailable', error: e.message };
  }
}

async function aiScoreSpeaking(topic, transcribedText) {
  try {
    const sysPrompt = `You are a strict CEFR-certified speaking examiner for the ${EXAM_NAME}. Score the following speaking transcript (0–25) on:
- Fluency & Coherence (0–7): Flow, hesitation, logical structure.
- Lexical Resource (0–6): Vocabulary range and accuracy.
- Grammatical Range & Accuracy (0–6): Grammar complexity and control.
- Pronunciation (0–6): Clarity and intelligibility (infer from transcript quality).

Return ONLY JSON: {"score":N,"breakdown":{"fluency":N,"lexical":N,"grammar":N,"pronunciation":N},"band":"A1|A2|B1|B2|C1|C2","comments":"2-sentence examiner note"}`;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: sysPrompt,
        messages: [{ role:'user', content:`Topic: ${topic}\n\nTranscript:\n${transcribedText||'(No transcript available — audio submitted separately)'}` }]
      })
    });
    const d = await r.json();
    const raw = d.content?.[0]?.text || '{}';
    return JSON.parse(raw.replace(/```json|```/g,'').trim());
  } catch(e) {
    return { score: null, band: null, comments: 'AI scoring unavailable' };
  }
}

// ── LOADING ───────────────────────────────────────────────────
function showLoad(msg='Please wait…') {
  let el = document.getElementById('loading');
  if (!el) {
    el = document.createElement('div'); el.id = 'loading';
    el.innerHTML = `<div class="spin"></div><p></p>`;
    document.body.appendChild(el);
  }
  el.querySelector('p').textContent = msg;
  el.classList.add('show');
}
function hideLoad() {
  const el = document.getElementById('loading');
  if (el) el.classList.remove('show');
}

// ── TIMER ─────────────────────────────────────────────────────
class Timer {
  constructor({ sec, onTick, onWarn, onEnd, warnAt=120 }) {
    this.left=sec; this.total=sec;
    this.onTick=onTick; this.onWarn=onWarn; this.onEnd=onEnd; this.warnAt=warnAt;
    this._id=null; this._warned=false;
  }
  start() {
    this._id = setInterval(() => {
      this.left--;
      this.onTick?.(this.left, this.total);
      if (!this._warned && this.left<=this.warnAt) { this._warned=true; this.onWarn?.(this.left); }
      if (this.left<=0) { this.stop(); this.onEnd?.(); }
    }, 1000);
  }
  stop() { clearInterval(this._id); }
  fmt(s) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
}

// ── WORD COUNT ────────────────────────────────────────────────
const wordCount = s => s.trim().split(/\s+/).filter(Boolean).length;

// ── EXAM ID ───────────────────────────────────────────────────
function makeExamId() {
  return `HELT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,5).toUpperCase()}`;
}

// ── VALIDATION ────────────────────────────────────────────────
function validateField(inp) {
  const v = inp.value.trim();
  const errEl = inp.parentElement.querySelector('.ferr');
  inp.classList.remove('err');
  if (errEl) errEl.classList.remove('show');
  if (inp.required && !v) {
    inp.classList.add('err');
    if (errEl) { errEl.textContent='This field is required.'; errEl.classList.add('show'); }
    return false;
  }
  if (inp.type==='email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
    inp.classList.add('err');
    if (errEl) { errEl.textContent='Enter a valid email address.'; errEl.classList.add('show'); }
    return false;
  }
  if (inp.dataset.min && v.length < +inp.dataset.min) {
    inp.classList.add('err');
    if (errEl) { errEl.textContent=`Minimum ${inp.dataset.min} characters.`; errEl.classList.add('show'); }
    return false;
  }
  return true;
}
function validateForm(form) {
  let ok = true;
  form.querySelectorAll('[required],[data-min]').forEach(el => { if (!validateField(el)) ok=false; });
  return ok;
}

// ── NAVIGATE ──────────────────────────────────────────────────
const goTo = p => window.location.href = p;

// ── ANTI-CHEAT ────────────────────────────────────────────────
function lockExam() {
  document.addEventListener('contextmenu', e=>e.preventDefault());
  document.addEventListener('copy',        e=>e.preventDefault());
  document.addEventListener('paste',       e=>e.preventDefault());
  document.addEventListener('cut',         e=>e.preventDefault());
  document.addEventListener('keydown', e => {
    if (e.key==='F12' || (e.ctrlKey&&e.shiftKey&&['I','J','C','K'].includes(e.key)) || (e.ctrlKey&&e.key==='U') || e.key==='PrintScreen') {
      e.preventDefault();
    }
  });
  // Visibility-change tab-switch detection
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      const n = (S.get('tabSwitches',0)|0) + 1;
      S.set('tabSwitches', n);
      if (n >= 2) showTabWarning(n);
    }
  });
}

function showTabWarning(n) {
  let el = document.getElementById('tab-warn-modal');
  if (!el) {
    el = document.createElement('div');
    el.id = 'tab-warn-modal';
    el.className = 'modal-bg';
    el.innerHTML = `<div class="modal-box">
      <div class="modal-title" style="color:var(--err);">⚠️ Security Warning</div>
      <p style="font-size:.88rem;color:var(--muted);margin-bottom:1.2rem;">
        You have switched tabs or windows <strong>${n} time(s)</strong>. This is recorded.<br><br>
        Continued tab switching may result in <strong>automatic disqualification</strong> as per HELT examination rules.
        Return immediately to the exam.
      </p>
      <button class="btn btn-primary btn-full" onclick="document.getElementById('tab-warn-modal').remove();">
        Return to Exam
      </button>
    </div>`;
    document.body.appendChild(el);
  }
}

// ── SCREEN + MIC RECORDING ────────────────────────────────────
// Records screen + mic simultaneously during exam
let _screenRecorder = null;
let _screenChunks   = [];
let _screenBlob     = null;

async function startScreenRecording() {
  try {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
      video: { mediaSource: 'screen', width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 5 } },
      audio: false
    });
    const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });

    const combined = new MediaStream([
      ...displayStream.getVideoTracks(),
      ...micStream.getAudioTracks()
    ]);

    _screenChunks = [];
    _screenRecorder = new MediaRecorder(combined, { mimeType: 'video/webm; codecs=vp8,opus' });
    _screenRecorder.ondataavailable = e => { if (e.data.size>0) _screenChunks.push(e.data); };
    _screenRecorder.onstop = () => {
      _screenBlob = new Blob(_screenChunks, { type:'video/webm' });
      S.set('screenRecorded', true);
    };
    _screenRecorder.start(5000); // chunk every 5s

    // Show indicator
    showRecIndicator();

    // Handle if user stops screen share manually
    displayStream.getVideoTracks()[0].addEventListener('ended', () => stopScreenRecording());
    return true;
  } catch(e) {
    console.warn('Screen recording unavailable:', e.message);
    // Try mic-only fallback
    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      _screenChunks = [];
      _screenRecorder = new MediaRecorder(micStream);
      _screenRecorder.ondataavailable = e => { if(e.data.size>0) _screenChunks.push(e.data); };
      _screenRecorder.onstop = () => { _screenBlob = new Blob(_screenChunks, {type:'audio/webm'}); };
      _screenRecorder.start(5000);
    } catch{}
    return false;
  }
}

function stopScreenRecording() {
  try {
    if (_screenRecorder && _screenRecorder.state !== 'inactive') _screenRecorder.stop();
  } catch{}
  hideRecIndicator();
}

function getScreenBlob() { return _screenBlob; }

function showRecIndicator() {
  if (document.getElementById('rec-ind')) return;
  const el = document.createElement('div');
  el.id = 'rec-ind';
  el.className = 'rec-indicator no-print';
  el.innerHTML = '<div class="rec-dot"></div> REC';
  document.body.appendChild(el);
}
function hideRecIndicator() {
  const el = document.getElementById('rec-ind');
  if (el) el.remove();
}

// ── TIMER UI HELPER ───────────────────────────────────────────
function updateTimerUI(left, total) {
  const fmt = `${String(Math.floor(left/60)).padStart(2,'0')}:${String(left%60).padStart(2,'0')}`;
  const el = document.getElementById('t-val');
  if (el) {
    el.textContent = fmt;
    el.className = 't-value';
    if (left<=60) el.classList.add('danger');
    else if (left<=120) el.classList.add('warn');
  }
  const bar = document.getElementById('t-fill');
  if (bar) bar.style.width = `${(left/total)*100}%`;
}

// ── PROFICIENCY BAND ──────────────────────────────────────────
function getProfLevel(score) {
  if (score>=85) return { level:'Advanced',     band:'C1–C2', color:'#1E7A4A' };
  if (score>=65) return { level:'Intermediate', band:'B1–B2', color:'#B5620A' };
  if (score>=40) return { level:'Basic',        band:'A2–B1', color:'#8A6A00' };
  return              { level:'Elementary',   band:'A1',    color:'#9B2316' };
}
