import { useEffect, useRef, useState } from 'react';
import { onValue, ref, Unsubscribe } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

export function useBattleFeed(battleId?: string) {
  const [pub, setPub] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [meta, setMeta] = useState<any>(null);
  const resUnsub = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    const database = rtdb;
    if (!battleId || !database) {
      return;
    }

    const pubRef = ref(database, `/battles/${battleId}/public`);
    const metaRef = ref(database, `/battles/${battleId}/meta`);
    
    const unsub1 = onValue(pubRef, snap => setPub(snap.val()));

    let lastTurn: number | null = null;
    const unsub2 = onValue(metaRef, snap => {
      const metaData = snap.val();
      setMeta(metaData);
      if (!metaData?.turn || metaData.turn === lastTurn) return;
      lastTurn = metaData.turn;

      if (resUnsub.current) {
        resUnsub.current();
        resUnsub.current = null;
      }

      const logsRef = ref(database, `/battles/${battleId}/turns/${metaData.turn}/resolution/logs`);
      resUnsub.current = onValue(logsRef, s => setLogs(s.val() || []));
    });

    return () => { 
      unsub1(); 
      unsub2();
      if (resUnsub.current) {
        resUnsub.current();
        resUnsub.current = null;
      }
    };
  }, [battleId]);

  return { pub, logs, meta };
}
