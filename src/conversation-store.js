import { promises as fs } from 'node:fs';
import path from 'node:path';

const dataDirectory = path.resolve(process.cwd(), 'data');
const storePath = path.join(dataDirectory, 'conversations.json');
const recentMessagesForContext = 40;
const conversations = new Map();
let loadPromise;
let writeQueue = Promise.resolve();

async function loadStore() {
  if (!loadPromise) {
    loadPromise = (async () => {
      try {
        const saved = JSON.parse(await fs.readFile(storePath, 'utf8'));
        for (const [key, entry] of Object.entries(saved)) {
          if (Array.isArray(entry.messages)) {
            conversations.set(key, {
              updatedAt: entry.updatedAt || Date.now(),
              summary: typeof entry.summary === 'string' ? entry.summary : '',
              summarizedThrough: Math.min(entry.summarizedThrough || 0, entry.messages.length),
              messages: entry.messages,
            });
          }
        }
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    })();
  }
  return loadPromise;
}

async function persistStore() {
  const snapshot = JSON.stringify(Object.fromEntries(conversations), null, 2);
  writeQueue = writeQueue.then(async () => {
    await fs.mkdir(dataDirectory, { recursive: true });
    const temporaryPath = `${storePath}.tmp`;
    await fs.writeFile(temporaryPath, snapshot, 'utf8');
    await fs.rename(temporaryPath, storePath);
  });
  return writeQueue;
}

/**
 * Returns a full transcript for archival and a bounded model context. Older
 * messages are summarized only after the summarizer succeeds; the transcript
 * itself remains in the store for the life of the conversation.
 */
export async function getConversationHistory(key, summarizeOlderMessages, onSummaryError) {
  await loadStore();
  const entry = conversations.get(key);
  if (!entry) return { summary: '', messages: [] };

  const summarizeUntil = Math.max(0, entry.messages.length - recentMessagesForContext);
  if (summarizeOlderMessages && summarizeUntil > entry.summarizedThrough) {
    const olderMessages = entry.messages.slice(entry.summarizedThrough, summarizeUntil);
    try {
      const summary = await summarizeOlderMessages(entry.summary, olderMessages);
      if (summary?.trim()) {
        entry.summary = summary.trim();
        entry.summarizedThrough = summarizeUntil;
        entry.updatedAt = Date.now();
        await persistStore();
      }
    } catch (error) {
      // Preserve the transcript and existing summary so a later turn can retry.
      onSummaryError?.(error);
    }
  }

  return {
    summary: entry.summary,
    messages: entry.messages.slice(Math.max(
      entry.summarizedThrough,
      entry.messages.length - recentMessagesForContext,
    )),
  };
}

export async function recordConversationTurn(key, userText, assistantText) {
  await loadStore();
  const entry = conversations.get(key) || {
    updatedAt: Date.now(),
    summary: '',
    summarizedThrough: 0,
    messages: [],
  };
  entry.messages.push(
    { role: 'user', text: String(userText) },
    { role: 'model', text: String(assistantText) },
  );
  entry.updatedAt = Date.now();
  conversations.set(key, entry);
  await persistStore();
}

export async function clearConversationHistory(key) {
  await loadStore();
  conversations.delete(key);
  await persistStore();
}
