# Deploy to a Linux VPS

This setup runs the bot as a persistent Docker container. It does not need a public IP endpoint; the bot connects outbound to Slack using Socket Mode.

## 1. Prepare the VPS

Use an Ubuntu or Debian VPS with Docker Engine and the Docker Compose plugin installed. Connect over SSH, then check Docker Compose:

```sh
docker --version
docker compose version
```

## 2. Copy the project

From PowerShell at the workspace root, run this and replace `user` and `YOUR_VPS_HOST` with your VPS SSH username and IP address or hostname:

```powershell
scp -r .\outputs\slack-gemini-bot user@YOUR_VPS_HOST:~/slack-gemini-bot
```

## 3. Add credentials on the VPS

In the SSH session:

```sh
cd ~/slack-gemini-bot
cp .env.example .env
nano .env
```

Enter `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, and `GEMINI_API_KEY`, then save and exit. Lock down the file:

```sh
chmod 600 .env
```

Do not copy secrets into the source code or commit `.env` to Git.

## 4. Build and start

```sh
docker compose up -d --build
docker compose logs -f
```

The bot should log `Gemini Helper is running`. Press `Ctrl+C` to stop following the log output; the container keeps running in the background. Invite Gemini Helper to a Slack channel and mention it with a question.

Useful commands:

```sh
docker compose ps
docker compose logs --tail=100
docker compose restart
docker compose down
```

After changing the code, update the project on the VPS and run `docker compose up -d --build` again. After changing `.env`, run `docker compose up -d` to recreate the container with the new values.

## Keep it secure

- Use SSH keys and keep the VPS operating system and Docker updated.
- Do not open inbound ports for this bot. Socket Mode uses an outbound connection.
- Keep `.env` readable only by your VPS account (`chmod 600 .env`).
