# Walkie Talkie

Push-to-talk web app for friends. Join a room code, hold the button (or spacebar) to talk.
Audio goes peer-to-peer over WebRTC; the Node server only passes connection messages.

## Run locally

    npm install
    npm start

Open http://localhost:3000 in two tabs and join the same room code.

## Deploy on Render (free)

1. Create a GitHub repo and push this folder to it.
2. On https://render.com choose New > Web Service (or Blueprint) and connect the repo.
3. Render reads `render.yaml`. Build command: `npm install`, start command: `npm start`.
4. When it finishes, share the `https://....onrender.com` link and a room code with friends.

Notes:
- Microphones only work on HTTPS (or localhost). Render gives you HTTPS automatically.
- The free plan sleeps after inactivity, so the first load can take about 30-60 seconds.
- If someone connects but hears nothing, their network may need a TURN relay server.
