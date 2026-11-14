# Slack Gemini Bot

A Slack bot with Gemini chat, web search, image understanding/generation/editing, and analysis of files attached in Slack. It replies in a thread when mentioned or when users DM it. It uses Slack Socket Mode, so local development does not require a public webhook URL.

## Requirements

- Node.js 20 or newer
- A Slack workspace where you can install apps
- A Gemini API key

## Create the Slack app

1. Open [Slack API: Your Apps](https://api.slack.com/apps) and create an app from the `slack-app-manifest.yaml` file in this folder.
2. In **Basic Information → App-Level Tokens**, generate an app-level token with the `connections:write` scope. Save it as `SLACK_APP_TOKEN`.
3. Install the app to your workspace. Under **OAuth & Permissions**, copy the Bot User OAuth Token (`xoxb-...`) to `SLACK_BOT_TOKEN`.
4. Make sure Socket Mode and the `app_mention` and `message.im` events are enabled. The manifest configures them.
5. The bot scopes include `commands`, `im:history`, `channels:history`, `files:read`, and `files:write` for slash commands, DMs, channel threads, attachments, and image uploads. Reinstall the app after adding scopes.

Slack may require a workspace admin to approve installation.

The manifest registers `/gemini` and `/gemini-forget`. Because this app uses Socket Mode, leave the slash-command Request URL blank.

## Configure and run

1. Copy `.env.example` to `.env`.
2. Fill in `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, and `GEMINI_API_KEY` in `.env`.
3. Install dependencies and start the bot:

   ```sh
   npm install
   npm start
   ```

4. Invite **Gemini Helper** to a channel, then mention it with a question, for example: `@Gemini Helper explain this error`.

In channels, the bot replies in a thread when mentioned. In DMs, it replies in a thread under each user message. You can also use `/gemini your question` to get an answer posted in the channel; `/gemini-forget` clears your slash-command conversation history for that channel. Slash-command history is separate for each user and channel. Attachments are supported through DMs and channel mentions, not slash commands. The bot supports images, PDFs, DOCX Word files, and common text files, up to 10 MB per file and 25 MB total per message. PDFs retain visual layout; DOCX files are converted to plain text before analysis. Files are downloaded from Slack into memory for the request and are not saved to the VPS.

The bot keeps the full text transcript for each DM or active channel thread in `data/conversations.json` on the VPS, with no automatic expiry. For long conversations, it keeps a rolling summary of older messages and sends that with the most recent 20 exchanges to Gemini. The full transcript stays on the VPS; uploaded file contents are not retained, only the message text and attachment names. Say `forget this chat` to delete that conversation's transcript and summary. Back up or delete `data/conversations.json` according to your retention needs.

## Features

- *Web search:* ask a current question or start with `search:`. Gemini can use Google Search and include sources.
- *Generate an image:* say `generate an image of ...` or `image: ...`. The generated image is uploaded to Slack.
- *Edit an image:* attach an image and say `edit image: ...`. The bot posts a new edited image and leaves the original untouched.
- *File attachments:* attach a PDF, DOCX, image, or text file and ask a question, such as `summarize this` or `find the key dates`.

Gemini Markdown is converted to Slack `mrkdwn` for headings, bold text, lists, and links before the reply is posted.

Reading Slack attachments requires the `files:read` bot scope. Uploading generated or edited images requires `files:write`. Continuing channel threads requires `channels:history` and `message.channels`. Reinstall the Slack app after adding scopes so its token receives them.

For VPS deployment, use [VPS_DEPLOY.md](VPS_DEPLOY.md) on Linux or [WINDOWS_VPS.md](WINDOWS_VPS.md) on Windows. Image generation and web search can incur Gemini API charges; check [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).

## Security and costs

- Keep `.env` private. It is excluded by `.gitignore`; never commit or share the tokens.
- The bot needs to remain running to receive Slack events. Running it locally is fine for testing; continuous hosting may have a cost.
- Gemini API free-tier access and limits depend on the selected model and can change. Check [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing).
