import { useEffect, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { rtdb } from '@/lib/firebase';

export function useBattleFeed(battleId?: string) {
  const [pub, setPub] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [meta, setMeta] = useState<any>(null);

  useEffect(() => {
    if (!battleId) return;

    const pubRef = ref(rtdb, `/battles/${battleId}/public`);
    const metaRef = ref(rtdb, `/battles/${battleId}/meta`);
    
    const unsub1 = onValue(pubRef, snap => setPub(snap.val()));
    const unsub2 = onValue(metaRef, snap => setMeta(snap.val()));
    
    // Watch for turn changes to get resolution logs
    const unsub3 = onValue(metaRef, async snap => {
      const metaData = snap.val();
      if (!metaData?.turn) return;
      
      const resRef = ref(rtdb, `/battles/${battleId}/turns/${metaData.turn}/resolution/logs`);
      const unsub4 = onValue(resRef, s => setLogs(s.val() || []));
      
      return () => unsub4();
    });

    return () => { 
      unsub1(); 
      unsub2(); 
      unsub3(); 
    };
  }, [battleId]);

  return { pub, logs, meta };
}
