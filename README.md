# In Your Face (IYF)

A chat app where a huge animated character face reacts to your conversation in real time. Built with Next.js + Claude API, styled in pixel/retro aesthetic.

## Features

- Animated SVG face with 8 emotions: NEUTRAL, HAPPY, SAD, ANGRY, SURPRISED, EXCITED, CONFUSED, THINKING
- Talking jaw animation while the AI streams its response
- Eye blinking
- Streaming responses via Claude claude-sonnet-4-6
- Press Start 2P pixel font
- Deploys to Vercel in one click

## Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Run dev server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

Push to GitHub, then import the repo on [vercel.com](https://vercel.com). Set the `ANTHROPIC_API_KEY` environment variable in the Vercel project settings.

## Project Structure

```
app/
  page.tsx          # Main layout (face + chat side by side)
  api/chat/route.ts # Streaming Claude API route
components/
  Face.tsx          # Animated SVG face
  Chat.tsx          # Chat UI with SSE streaming
```
