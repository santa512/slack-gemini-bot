# Run on a Windows VPS without Docker

This bot runs as a normal Node.js process and connects to Slack using Socket Mode. Keep the VPS online and make sure Windows allows outbound HTTPS/WebSocket connections.

## Install and configure

1. Install Node.js 20 or newer on the VPS. Confirm `node --version` and `npm --version` work in PowerShell.
2. Copy this project folder to the VPS, for example `C:\slack-gemini-bot`.
3. Open PowerShell and run:

   ```powershell
   Set-Location C:\slack-gemini-bot
   Copy-Item .env.example .env
   notepad .env
   npm install
   npm start
   ```

4. Fill in `SLACK_BOT_TOKEN`, `SLACK_APP_TOKEN`, and `GEMINI_API_KEY` in Notepad and save. Do not share the `.env` file. When `npm start` reports that Gemini Helper is running, invite it to a Slack channel and mention it with a question.

To use DMs, attachments, image output, memory in channel threads, and slash commands, the app needs `im:history`, `channels:history`, `files:read`, `files:write`, and `commands` scopes plus the `message.im` and `message.channels` events. The manifest registers `/gemini <question>` and `/gemini-forget`. With Socket Mode enabled, no public command URL is needed. Reinstall the app after adding scopes.

For file questions, attach a PDF, DOCX Word file, image, or text file to a DM and ask about it. In a channel, mention the bot in the same message as the attachment. It can use Google Search when useful, generate an image from `generate an image of ...`, or edit an attached image with `edit image: ...`. Slack files are read for the request and not saved to the VPS.

The bot keeps the full text transcript for each DM or active channel thread in `data\conversations.json` on the VPS, with no automatic expiry. For long conversations, it keeps a rolling summary of older messages and sends that with the most recent 20 exchanges to Gemini. The full transcript stays on the VPS; uploaded file contents are not retained, only the message text and attachment names. Say `forget this chat` in the DM or thread to delete its transcript and summary. Back up or delete `data\conversations.json` according to your retention needs.

Image generation uses a dedicated Gemini image model and may incur API charges. Check the [Gemini API pricing page](https://ai.google.dev/gemini-api/docs/pricing).

Keep the PowerShell window open while testing. Press `Ctrl+C` to stop the bot.

## Start automatically after reboot

Use Windows Task Scheduler:

1. Open **Task Scheduler** and choose **Create Task**.
2. On **General**, name it `Slack Gemini Bot`. Select **Run whether user is logged on or not** and use the Windows account that owns the bot folder and `.env`.
3. On **Triggers**, add **At startup**. A short delay (for example, 30 seconds) gives networking time to come up.
4. On **Actions**, choose **Start a program**:
   - Program: `powershell.exe`
   - Arguments: `-NoProfile -ExecutionPolicy Bypass -File "C:\slack-gemini-bot\start-bot.ps1"`
   - Start in: `C:\slack-gemini-bot`
5. On **Settings**, enable restarting the task if it fails, with a short retry interval.
6. Save the task. Windows may ask for the account password so it can run while you are signed out.

Use the actual folder path wherever this guide shows `C:\slack-gemini-bot`. In Task Scheduler, select the task and choose **Run** to start it now. Its **History** tab can help diagnose startup failures.

## Updating

Stop the task, update the project files (including `src\conversation-store.js`), run `npm install`, update the Slack app scopes/events if needed, then start the task again. Keep `.env` in place; it holds the server's credentials and is excluded by `.gitignore`.
