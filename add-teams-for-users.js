#!/usr/bin/env node

// Add teams for given user emails using Firebase REST APIs
// Usage:
//   node add-teams-for-users.js \ 
//     --hostEmail="test-host@pokemon-battles.test" --hostPassword="TestHost123!" \
//     --guestEmail="test-guest@pokemon-battles.test" --guestPassword="TestGuest123!"

const https = require('https');
const { URL } = require('url');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (!apiKey || !projectId) {
  console.error('❌ Missing NEXT_PUBLIC_FIREBASE_API_KEY or NEXT_PUBLIC_FIREBASE_PROJECT_ID in .env.local');
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (const arg of args) {
    const m = arg.match(/^--([^=]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function postJson(hostname, path, body, headers = {}) {
  const data = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname,
      port: 443,
      path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
    }, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try {
          const json = buf ? JSON.parse(buf) : {};
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) return resolve(json);
          reject(new Error(`HTTP ${res.statusCode}: ${json.error?.message || buf}`));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function patchJson(hostname, path, body, headers = {}) {
  const data = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname,
      port: 443,
      path,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
    }, (res) => {
      let buf = '';
      res.on('data', (c) => (buf += c));
      res.on('end', () => {
        try {
          const json = buf ? JSON.parse(buf) : {};
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) return resolve(json);
          reject(new Error(`HTTP ${res.statusCode}: ${json.error?.message || buf}`));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function signIn(email, password) {
  const path = `/v1/accounts:signInWithPassword?key=${apiKey}`;
  const resp = await postJson('identitytoolkit.googleapis.com', path, {
    email,
    password,
    returnSecureToken: true,
  });
  return { idToken: resp.idToken, localId: resp.localId, displayName: resp.displayName || email.split('@')[0] };
}

function buildTeamFor(label) {
  // 6 Pokemon, 4 moves each
  const presets = label === 'host' ? [
    { id: 1 }, { id: 4 }, { id: 7 }, { id: 25 }, { id: 39 }, { id: 143 },
  ] : [
    { id: 2 }, { id: 5 }, { id: 8 }, { id: 26 }, { id: 40 }, { id: 144 },
  ];
  return {
    name: 'Complete Team',
    slots: presets.map((p) => ({ id: p.id, level: 50, moves: [1, 2, 3, 4] })),
    createdAt: { seconds: Math.floor(Date.now() / 1000), nanos: 0 },
  };
}

async function addTeamForUser(idToken, uid, displayName, label) {
  // Firestore REST write to userTeams with deterministic doc id `${uid}_test_team`
  const docId = `${uid}_test_team`;
  const documentPath = `projects/${projectId}/databases/(default)/documents/userTeams/${docId}`;
  const team = buildTeamFor(label);
  const body = {
    fields: {
      name: { stringValue: team.name },
      slots: {
        arrayValue: {
          values: team.slots.map((s) => ({
            mapValue: {
              fields: {
                id: { integerValue: String(s.id) },
                level: { integerValue: String(s.level) },
                moves: { arrayValue: { values: s.moves.map((m) => ({ integerValue: String(m) })) } },
              },
            },
          })),
        },
      },
      userId: { stringValue: uid },
      teamName: { stringValue: `${displayName}'s ${team.name}` },
      createdAt: { timestampValue: new Date().toISOString() },
    },
  };
  // Use PATCH to create/overwrite specific doc id
  const path = `/v1/${documentPath}?mask.fieldPaths=name&mask.fieldPaths=slots&mask.fieldPaths=userId&mask.fieldPaths=teamName&mask.fieldPaths=createdAt`;
  await patchJson('firestore.googleapis.com', path, body, { Authorization: `Bearer ${idToken}` });
}

async function main() {
  const args = parseArgs();
  const { hostEmail, hostPassword, guestEmail, guestPassword } = args;
  if (!hostEmail || !hostPassword || !guestEmail || !guestPassword) {
    console.error('Usage: node add-teams-for-users.js --hostEmail=... --hostPassword=... --guestEmail=... --guestPassword=...');
    process.exit(1);
  }

  try {
    console.log('🔐 Signing in host...');
    const host = await signIn(hostEmail, hostPassword);
    console.log('📝 Writing team for host...');
    await addTeamForUser(host.idToken, host.localId, host.displayName || 'Host', 'host');
    console.log(`✅ Team created for ${hostEmail}`);

    console.log('🔐 Signing in guest...');
    const guest = await signIn(guestEmail, guestPassword);
    console.log('📝 Writing team for guest...');
    await addTeamForUser(guest.idToken, guest.localId, guest.displayName || 'Guest', 'guest');
    console.log(`✅ Team created for ${guestEmail}`);

    console.log('🎉 Done');
  } catch (e) {
    console.error('❌ Failed:', e.message);
    process.exit(1);
  }
}

main();


