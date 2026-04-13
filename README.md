# In Your Face (IYF)

<img width="746" height="662" alt="image" src="https://github.com/user-attachments/assets/a308c431-a331-464f-9257-17578e01e113" />

A chat app where a huge animated character face reacts to your conversation in real time. Built with Next.js + Claude API, styled in a pixel/retro aesthetic.

## Features

- **Animated SVG face** with 9 emotions: NEUTRAL, HAPPY, DELIGHTED, SAD, ANGRY, SURPRISED, EXCITED, CONFUSED, THINKING
- **Per-emotion animation config** — each emotion has its own blink rate, gaze range, eyebrow angle, pupil position, mouth shape, and expression speed
- **Talking jaw animation** plays while Claude streams its response
- **Dynamic gaze** — pupils drift naturally, varying by emotion
- **Streaming responses** via Claude claude-sonnet-4-6 (SSE)
- **Emotion detection** — Claude appends an emotion tag to every response; the face updates automatically
- **Debug buttons** at the bottom to manually toggle emotions (HAPPY/SAD, HAPPY/ANGRY, HAPPY/DELIGHTED, cycle all)
- Press Start 2P pixel font throughout
- Deploys to Vercel in one click

## Setup

1. Clone the repo
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

Push to GitHub, then import the repo on [vercel.com](https://vercel.com). Add `ANTHROPIC_API_KEY` in the Vercel project's environment variable settings.

## Project Structure

```
app/
  page.tsx            # Main layout — face left, chat right, debug buttons bottom
  api/chat/route.ts   # Streaming SSE route calling Claude claude-sonnet-4-6
components/
  Face.tsx            # Animated SVG face (9 emotions, gaze, blink, talking jaw)
  Chat.tsx            # Chat UI with live SSE streaming and emotion parsing
```

## Emotions

| Emotion   | Triggered by Claude when…                        |
|-----------|--------------------------------------------------|
| NEUTRAL   | baseline / unclear tone                          |
| HAPPY     | positive, friendly exchanges                     |
| DELIGHTED | extra enthusiastic or celebratory responses      |
| SAD       | empathetic or downbeat topics                    |
| ANGRY     | frustrated or confrontational tone               |
| SURPRISED | unexpected or shocking information               |
| EXCITED   | hype, big news, enthusiasm                       |
| CONFUSED  | unclear questions or contradictions              |
| THINKING  | pondering, reasoning through something           |
