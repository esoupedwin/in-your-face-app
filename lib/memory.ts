import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type MemoryType = "profile" | "preference" | "goal" | "event" | "note";
export type MemorySensitivity = "low" | "medium" | "high";
export type MemoryStatus = "active" | "archived";

export interface MemoryItem {
  id: string;
  userId: string;
  type: MemoryType;
  content: string;
  sourceMessage: string;
  confidence: number;
  importance: 1 | 2 | 3 | 4 | 5;
  sensitivity: MemorySensitivity;
  status: MemoryStatus;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string | null;
}

interface MemoryStore {
  items: MemoryItem[];
}

interface CandidateMemory {
  type: MemoryType;
  content: string;
  confidence: number;
  importance: 1 | 2 | 3 | 4 | 5;
  sensitivity: MemorySensitivity;
}

const MEMORY_DIR = path.join(process.cwd(), ".data");
const MEMORY_PATH = path.join(MEMORY_DIR, "chappie-memory.json");
const MAX_MEMORY_ITEMS_PER_USER = 200;
const STALE_DAYS = 180;

let writeQueue: Promise<void> = Promise.resolve();

function normalizeContent(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function nowIso() {
  return new Date().toISOString();
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

async function readStore(): Promise<MemoryStore> {
  try {
    const raw = await readFile(MEMORY_PATH, "utf8");
    const parsed = JSON.parse(raw) as MemoryStore;
    if (!parsed || !Array.isArray(parsed.items)) {
      return { items: [] };
    }
    return parsed;
  } catch {
    return { items: [] };
  }
}

async function writeStore(store: MemoryStore) {
  await mkdir(MEMORY_DIR, { recursive: true });
  await writeFile(MEMORY_PATH, `${JSON.stringify(store, null, 2)}\n`, "utf8");
}

async function withWriteLock(fn: (store: MemoryStore) => Promise<void>) {
  writeQueue = writeQueue.then(async () => {
    const store = await readStore();
    await fn(store);
    await writeStore(store);
  });
  await writeQueue;
}

function memoryId() {
  return `mem_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function tokenize(text: string) {
  return normalizeContent(text)
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function overlapScore(a: string, b: string) {
  const aTokens = new Set(tokenize(a));
  const bTokens = new Set(tokenize(b));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let hit = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) hit += 1;
  }
  return hit / Math.max(aTokens.size, bTokens.size);
}

function isExpired(memory: MemoryItem) {
  if (!memory.expiresAt) return false;
  return new Date(memory.expiresAt).getTime() < Date.now();
}

function extractCandidateMemories(message: string): CandidateMemory[] {
  const content = normalizeContent(message);
  const lc = content.toLowerCase();
  const candidates: CandidateMemory[] = [];

  const add = (candidate: CandidateMemory) => {
    const cleaned = normalizeContent(candidate.content);
    if (!cleaned || cleaned.length < 5 || cleaned.length > 180) return;
    candidates.push({
      ...candidate,
      content: cleaned,
      confidence: clamp01(candidate.confidence),
    });
  };

  const name = content.match(/\b(?:my name is|i am|i'm)\s+([A-Za-z][A-Za-z '-]{1,40})$/i);
  if (name && /\bmy name is\b/i.test(content)) {
    add({
      type: "profile",
      content: `User's name is ${name[1].trim()}.`,
      confidence: 0.95,
      importance: 5,
      sensitivity: "low",
    });
  }

  const likes = content.match(/\b(?:i like|i love|i enjoy|i prefer)\s+(.+)/i);
  if (likes) {
    add({
      type: "preference",
      content: `User likes ${likes[1].trim()}.`,
      confidence: 0.82,
      importance: 3,
      sensitivity: "low",
    });
  }

  const dislike = content.match(/\b(?:i dislike|i hate|i don't like)\s+(.+)/i);
  if (dislike) {
    add({
      type: "preference",
      content: `User dislikes ${dislike[1].trim()}.`,
      confidence: 0.82,
      importance: 3,
      sensitivity: "low",
    });
  }

  const from = content.match(/\b(?:i am from|i'm from|i live in)\s+(.+)/i);
  if (from) {
    add({
      type: "profile",
      content: `User location context: ${from[1].trim()}.`,
      confidence: 0.86,
      importance: 4,
      sensitivity: "medium",
    });
  }

  const work = content.match(/\b(?:i work as|i am a|i am an|i'm a|i'm an)\s+(.+)/i);
  if (work && !/\bmy name is\b/i.test(content)) {
    add({
      type: "profile",
      content: `User identity detail: ${work[1].trim()}.`,
      confidence: 0.72,
      importance: 3,
      sensitivity: "medium",
    });
  }

  const goal = content.match(/\b(?:my goal is|i want to|i'm trying to|i am trying to)\s+(.+)/i);
  if (goal) {
    add({
      type: "goal",
      content: `User goal: ${goal[1].trim()}.`,
      confidence: 0.84,
      importance: 4,
      sensitivity: "low",
    });
  }

  const remember = content.match(/\bremember (?:that )?(.+)/i);
  if (remember && !lc.startsWith("/memory")) {
    add({
      type: "note",
      content: `User asked Chappie to remember: ${remember[1].trim()}.`,
      confidence: 0.9,
      importance: 4,
      sensitivity: "medium",
    });
  }

  return candidates;
}

function dedupeAndMerge(items: MemoryItem[], candidate: CandidateMemory, sourceMessage: string, userId: string) {
  const now = nowIso();
  const existing = items.find(
    (item) =>
      item.userId === userId &&
      item.status === "active" &&
      overlapScore(item.content, candidate.content) > 0.82,
  );

  if (existing) {
    existing.content = candidate.content;
    existing.confidence = clamp01(Math.max(existing.confidence, candidate.confidence));
    existing.importance = Math.max(existing.importance, candidate.importance) as 1 | 2 | 3 | 4 | 5;
    existing.lastUsedAt = now;
    existing.sourceMessage = sourceMessage;
    if (existing.sensitivity === "low" && candidate.sensitivity !== "low") {
      existing.sensitivity = candidate.sensitivity;
    }
    return;
  }

  items.push({
    id: memoryId(),
    userId,
    type: candidate.type,
    content: candidate.content,
    sourceMessage,
    confidence: candidate.confidence,
    importance: candidate.importance,
    sensitivity: candidate.sensitivity,
    status: "active",
    createdAt: now,
    lastUsedAt: now,
    expiresAt: null,
  });
}

function pruneUserMemories(store: MemoryStore, userId: string) {
  const staleCutoff = Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000;

  for (const item of store.items) {
    if (item.userId !== userId) continue;
    if (new Date(item.lastUsedAt).getTime() < staleCutoff && item.importance <= 2) {
      item.status = "archived";
    }
  }

  const active = store.items.filter((item) => item.userId === userId && item.status === "active");
  if (active.length <= MAX_MEMORY_ITEMS_PER_USER) return;

  const sorted = [...active].sort((a, b) => {
    const scoreA = a.importance * 0.6 + a.confidence * 0.4;
    const scoreB = b.importance * 0.6 + b.confidence * 0.4;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
  });

  const keep = new Set(sorted.slice(0, MAX_MEMORY_ITEMS_PER_USER).map((item) => item.id));
  for (const item of active) {
    if (!keep.has(item.id)) item.status = "archived";
  }
}

export async function storeMemoriesFromUserMessage(userId: string, message: string) {
  const normalized = normalizeContent(message);
  if (!normalized || normalized.length < 5) return 0;
  const candidates = extractCandidateMemories(normalized);
  if (candidates.length === 0) return 0;

  await withWriteLock(async (store) => {
    for (const candidate of candidates) {
      dedupeAndMerge(store.items, candidate, normalized, userId);
    }
    pruneUserMemories(store, userId);
  });

  return candidates.length;
}

export async function getRelevantMemories(userId: string, query: string, limit = 6) {
  const store = await readStore();
  const active = store.items.filter(
    (item) => item.userId === userId && item.status === "active" && !isExpired(item),
  );

  const scored = active
    .map((item) => {
      const relevance = overlapScore(query, item.content);
      const recencyBoost = Math.max(
        0,
        1 - (Date.now() - new Date(item.lastUsedAt).getTime()) / (30 * 24 * 60 * 60 * 1000),
      );
      const score = relevance * 0.45 + item.confidence * 0.2 + (item.importance / 5) * 0.25 + recencyBoost * 0.1;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  if (scored.length === 0) return [];

  await withWriteLock(async (storeWritable) => {
    const now = nowIso();
    const ids = new Set(scored.map((entry) => entry.item.id));
    for (const memory of storeWritable.items) {
      if (ids.has(memory.id)) memory.lastUsedAt = now;
    }
  });

  return scored.map((entry) => entry.item);
}

export async function listMemories(userId: string, limit = 30) {
  const store = await readStore();
  return store.items
    .filter((item) => item.userId === userId && item.status === "active" && !isExpired(item))
    .sort((a, b) => new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime())
    .slice(0, limit);
}

export async function forgetMemories(userId: string, query: string) {
  const normalizedQuery = normalizeContent(query).toLowerCase();
  if (!normalizedQuery) return 0;

  let removed = 0;
  await withWriteLock(async (store) => {
    for (const item of store.items) {
      if (item.userId !== userId || item.status !== "active") continue;
      const matchesAll = normalizedQuery === "all";
      const matchesId = item.id.toLowerCase() === normalizedQuery;
      const matchesText = item.content.toLowerCase().includes(normalizedQuery);
      if (matchesAll || matchesId || matchesText) {
        item.status = "archived";
        removed += 1;
      }
    }
  });

  return removed;
}

export function formatMemoriesForPrompt(memories: MemoryItem[]) {
  if (memories.length === 0) return "No saved user memory yet.";
  return memories
    .map((memory, idx) => `${idx + 1}. [${memory.type}] ${memory.content}`)
    .join("\n");
}

export function formatMemoriesForUser(memories: MemoryItem[]) {
  if (memories.length === 0) {
    return "I don't have any saved memory about you yet.";
  }
  return memories
    .map((memory) => `- (${memory.id}) [${memory.type}] ${memory.content}`)
    .join("\n");
}
