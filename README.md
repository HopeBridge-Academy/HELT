# HELT — HopeBridge English Language Test

**Standardised, CEFR-Aligned, 4-Skill English Language Proficiency Examination**

## Live Deployment

This site is hosted via GitHub Pages. Access at:  
`https://<your-username>.github.io/<repository-name>/`

---

## Structure

```
index.html          → Candidate Registration
rules.html          → Rules & Instructions (TOEFL-style)
exam-writing.html   → Section I: Writing (30 min)
exam-reading.html   → Section II: Reading (25 min)
exam-listening.html → Section III: Listening (20 min)
exam-speaking.html  → Section IV: Speaking — 2 Tasks (15 min)
exam-payment.html   → Payment Submission
complete.html       → Confirmation & Certificate Preview

css/style.css       → Global stylesheet
js/utils.js         → Core utilities (Telegram, AI scoring, timer, recording)
js/questions.js     → Question bank (3 rotating sets: A, B, C)
assets/logo.png     → ← REPLACE WITH YOUR ACTUAL LOGO FILE
```

---

## Setup Instructions

### 1. Add Your Logo
Place your logo image file at `assets/logo.png`.  
The site already references this path. If no image is found, a text fallback "H" is displayed.

### 2. Deploy to GitHub Pages
1. Create a new GitHub repository
2. Upload all files maintaining the directory structure
3. Go to **Settings → Pages → Source: main branch / root**
4. Your exam will be live within minutes

### 3. Telegram Integration
Already configured. Submissions are sent to:
- Chat ID: `-1002886209903`
- The bot token is embedded in `js/utils.js`

To change the Telegram destination, edit `js/utils.js`:
```js
const TG_TOKEN = "your-bot-token";
const TG_CHAT  = "your-chat-id";
```

---

## What Gets Sent to Telegram

| Event | Content Sent |
|-------|-------------|
| Writing submission | Full essay text + AI pre-score + candidate selfie |
| Speaking Task 1 | Audio recording (.webm) + AI pre-score |
| Speaking Task 2 | Audio recording (.webm) + AI pre-score |
| Payment proof | Receipt photo/PDF + all candidate details |
| Screen recording | Session video (.webm) sent with payment |

---

## Exam Features

- ✅ TOEFL-style linear navigation (no going back)
- ✅ Per-section countdown timers with auto-submit
- ✅ Screen + microphone recording throughout
- ✅ Tab-switching detection with warnings
- ✅ Listening audio plays maximum **2 times**
- ✅ Speaking section has **2 mandatory tasks**
- ✅ AI pre-scoring for Writing & Speaking (Claude Sonnet API)
- ✅ All scores withheld from candidate until final release
- ✅ Rotating question sets (A/B/C) based on registration time
- ✅ Payment via AFpay QR or Ghazanfar Bank (I099520000097)
- ✅ Selfie / identity photo captured at registration
- ✅ All data sent to Telegram for examiner review
- ✅ Copy/paste, right-click, PrintScreen disabled
- ✅ Responsive on mobile and desktop

---

## Scoring

| Section | Marks | Method |
|---------|-------|--------|
| Writing | 25 | AI pre-score → Human examiner final |
| Reading | 25 | Automatic (5 MCQ × 5 marks) |
| Listening | 25 | Automatic (5 MCQ × 5 marks) |
| Speaking | 25 | AI pre-score → Human examiner final |
| **Total** | **100** | **Released together after 2 working days** |

## Proficiency Levels

| Score | Level | CEFR |
|-------|-------|------|
| 85–100 | Advanced | C1–C2 |
| 65–84 | Intermediate | B1–B2 |
| 40–64 | Basic | A2–B1 |
| 0–39 | Elementary | A1 |

---

*HELT — HopeBridge English Language Test · Version 2025.1*
