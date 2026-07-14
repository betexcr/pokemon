import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Firebase security rules sources of truth', () => {
  it('RTDB rules deny client writes to meta/public/private/resolution/server', () => {
    const rulesPath = join(process.cwd(), 'src/lib/firebase-rtdb-rules.json');
    const rules = JSON.parse(readFileSync(rulesPath, 'utf8'));
    const battle = rules.rules.battles.$bid;

    expect(battle.meta['.write']).toBe(false);
    expect(battle.public['.write']).toBe(false);
    expect(battle.private.$uid['.write']).toBe(false);
    expect(battle.turns.$turn.resolution['.write']).toBe(false);
    expect(battle.server['.read']).toBe(false);
    expect(battle.server['.write']).toBe(false);

    const choiceWrite = battle.turns.$turn.choices.$uid['.write'] as string;
    expect(choiceWrite).toContain("phase').val() == 'choosing'");
    expect(choiceWrite).toContain('!data.exists()');
    expect(choiceWrite).toContain('clientVersion');
    expect(choiceWrite).toContain('meta/turn');
    expect(choiceWrite).not.toContain("'forfeit'");
    expect(choiceWrite).toContain('players/p1/uid');
  });

  it('firebase.json points database rules at the strict source file', () => {
    const firebaseJson = JSON.parse(readFileSync(join(process.cwd(), 'firebase.json'), 'utf8'));
    expect(firebaseJson.database.rules).toBe('src/lib/firebase-rtdb-rules.json');
  });

  it('firestore championships forbid non-host status flips and same-size rewrite', () => {
    const rules = readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8');
    expect(rules).not.toMatch(/allow update:\s*if request\.auth != null;\s*$/m);
    expect(rules).toContain('champAffectedKeys()');
    expect(rules).toContain('champStatusUnchanged()');
    expect(rules).toContain('champJoinAppendSelf()');
    expect(rules).not.toContain('champSizeDeltaAtMostOne()');
  });

  it('firestore guests cannot change status or battleId; host cannot start battle', () => {
    const rules = readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8');
    expect(rules).toContain('guestFieldKeysOnly()');
    expect(rules).toContain('battleIdUnchanged()');
    expect(rules).toContain('statusUnchanged()');
    expect(rules).toContain('hostForbiddenGuestKeys()');
    expect(rules).toContain('hostNotStartingBattle()');
    expect(rules).toContain("resource.data.status in ['waiting', 'ready']");
    expect(rules).toContain('noBattleIdOrNull()');
    expect(rules).toContain('match /private/{docId}');
    expect(rules).toMatch(/presenceKeysOnly\(\)[\s\S]*lastSeenHostAt/);
    expect(rules).not.toMatch(/function presenceKeysOnly\(\) \{[\s\S]*'status'/);
  });

  it('userTeams update locks userId', () => {
    const rules = readFileSync(join(process.cwd(), 'firestore.rules'), 'utf8');
    expect(rules).toContain('request.resource.data.userId == resource.data.userId');
  });
});
