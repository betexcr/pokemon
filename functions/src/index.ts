import express from "express";
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const app = express();
app.use(express.json());

function ensureAdmin(): void {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
}

app.get("/test-firebase", async (_req, res) => {
  try {
    ensureAdmin();
    const status = {
      initialized: admin.apps.length > 0,
      apps: admin.apps.map((appItem) => appItem?.name),
    };
    return res.status(200).json({ status: "ok", firebase: status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: message });
  }
});

app.post("/battles/:id/submit", async (_req, res) => {
  // Wave 5: Next.js /api/battles/:id/submit is the sole authority.
  return res.status(410).json({
    error: "Gone",
    message: "Use Next.js POST /api/battles/:id/submit — Cloud Functions submit is disabled.",
  });
});

export const api = functions.https.onRequest(app);
