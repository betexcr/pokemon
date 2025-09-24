// Firestore service for Usage Meta data
// Handles CRUD operations for usage_monthly collection

import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  writeBatch,
  DocumentSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import { 
  UsageRow, 
  UsageDocument, 
  UsageQuery, 
  UsageSummary,
  Platform,
  Generation,
  Format
} from '@/types/usage';
import { createHash } from 'crypto';

const COLLECTION_NAME = 'usage_monthly';

/**
 * Generate document ID for usage data
 */
export function generateUsageDocId(
  platform: Platform,
  generation: Generation,
  format: Format,
  month: string,
  pokemonId: number
): string {
  return `${platform}_${generation}_${format}_${month}_${pokemonId}`;
}

/**
 * Generate checksum for data integrity
 */
export function generateChecksum(row: UsageRow): string {
  const data = `${row.platform}|${row.generation}|${row.format}|${row.month}|${row.pokemonId}|${row.usagePercent}|${row.rank}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Convert UsageRow to UsageDocument
 */
export function rowToDocument(row: UsageRow): UsageDocument {
  const id = generateUsageDocId(row.platform, row.generation, row.format, row.month, row.pokemonId);
  const now = new Date().toISOString();
  
  return {
    ...row,
    id,
    createdAt: now,
    updatedAt: now,
    checksum: generateChecksum(row)
  };
}

/**
 * Convert UsageDocument to UsageRow
 */
export function documentToRow(doc: UsageDocument): UsageRow {
  const { id, createdAt, updatedAt, checksum, ...row } = doc;
  return row;
}

/**
 * Store a single usage row
 */
export async function storeUsageRow(row: UsageRow): Promise<void> {
  if (!db) {
    throw new Error('Firestore database not initialized');
  }
  const document = rowToDocument(row);
  const docRef = doc(db, COLLECTION_NAME, document.id);
  
  try {
    await setDoc(docRef, document, { merge: true });
  } catch (error) {
    console.error('Error storing usage row:', error);
    throw new Error(`Failed to store usage data for ${document.id}`);
  }
}

/**
 * Store multiple usage rows in a batch
 */
export async function storeUsageRows(rows: UsageRow[]): Promise<void> {
  if (!db) {
    throw new Error('Firestore database not initialized');
  }
  const batch = writeBatch(db);
  const documents = rows.map(rowToDocument);
  
  documents.forEach(document => {
    const docRef = doc(db!, COLLECTION_NAME, document.id);
    batch.set(docRef, document, { merge: true });
  });
  
  try {
    await batch.commit();
  } catch (error) {
    console.error('Error storing usage rows batch:', error);
    throw new Error(`Failed to store ${rows.length} usage rows`);
  }
}

/**
 * Get usage data by query parameters
 */
export async function getUsageData(queryParams: UsageQuery): Promise<UsageSummary> {
  if (!db) {
    throw new Error('Firestore database not initialized');
  }
  const { 
    platform, 
    generation, 
    format, 
    month, 
    pokemonId, 
    limit: queryLimit = 50,
    offset = 0 
  } = queryParams;
  
  let q = query(collection(db, COLLECTION_NAME));
  
  // Apply filters
  if (platform) {
    const platforms = Array.isArray(platform) ? platform : [platform];
    q = query(q, where('platform', 'in', platforms));
  }
  
  if (generation) {
    const generations = Array.isArray(generation) ? generation : [generation];
    q = query(q, where('generation', 'in', generations));
  }
  
  if (format) {
    const formats = Array.isArray(format) ? format : [format];
    q = query(q, where('format', 'in', formats));
  }
  
  if (month) {
    q = query(q, where('month', '==', month));
  }
  
  if (pokemonId) {
    q = query(q, where('pokemonId', '==', pokemonId));
  }
  
  // Apply sorting and pagination
  q = query(q, orderBy('rank', 'asc'), limit(queryLimit));
  
  if (offset > 0) {
    // Note: Firestore doesn't support offset directly
    // For production, implement cursor-based pagination
    console.warn('Offset pagination not implemented - using cursor-based instead');
  }
  
  try {
    const snapshot = await getDocs(q);
    const rows: UsageRow[] = [];
    const platforms = new Set<Platform>();
    const generations = new Set<Generation>();
    const formats = new Set<Format>();
    const months = new Set<string>();
    
    snapshot.forEach(doc => {
      const document = doc.data() as UsageDocument;
      rows.push(documentToRow(document));
      
      platforms.add(document.platform);
      generations.add(document.generation);
      formats.add(document.format);
      months.add(document.month);
    });
    
    return {
      total: rows.length,
      rows,
      metadata: {
        platforms: Array.from(platforms),
        generations: Array.from(generations),
        formats: Array.from(formats),
        months: Array.from(months)
      }
    };
  } catch (error) {
    console.error('Error fetching usage data:', error);
    throw new Error('Failed to fetch usage data');
  }
}

/**
 * Get latest month data for each platform/format combination
 */
export async function getLatestUsageData(): Promise<UsageSummary> {
  if (!db) {
    throw new Error('Firestore database not initialized');
  }
  // Get all unique platform/generation/format combinations with their latest months
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy('platform'),
    orderBy('generation'),
    orderBy('format'),
    orderBy('month', 'desc')
  );
  
  try {
    const snapshot = await getDocs(q);
    const latestByCombo = new Map<string, UsageRow>();
    const platforms = new Set<Platform>();
    const generations = new Set<Generation>();
    const formats = new Set<Format>();
    const months = new Set<string>();
    
    snapshot.forEach(doc => {
      const document = doc.data() as UsageDocument;
      const key = `${document.platform}_${document.generation}_${document.format}`;
      
      if (!latestByCombo.has(key)) {
        latestByCombo.set(key, documentToRow(document));
      }
      
      platforms.add(document.platform);
      generations.add(document.generation);
      formats.add(document.format);
      months.add(document.month);
    });
    
    const rows = Array.from(latestByCombo.values())
      .sort((a, b) => a.rank - b.rank);
    
    return {
      total: rows.length,
      rows,
      metadata: {
        platforms: Array.from(platforms),
        generations: Array.from(generations),
        formats: Array.from(formats),
        months: Array.from(months)
      }
    };
  } catch (error) {
    console.error('Error fetching latest usage data:', error);
    throw new Error('Failed to fetch latest usage data');
  }
}

/**
 * Get usage trends for a specific Pokémon across months
 */
export async function getUsageTrends(
  pokemonId: number,
  platforms?: Platform[],
  formats?: Format[]
): Promise<UsageRow[]> {
  if (!db) {
    throw new Error('Firestore database not initialized');
  }
  let q = query(
    collection(db, COLLECTION_NAME),
    where('pokemonId', '==', pokemonId),
    orderBy('month', 'desc')
  );
  
  if (platforms && platforms.length > 0) {
    q = query(q, where('platform', 'in', platforms));
  }
  
  if (formats && formats.length > 0) {
    q = query(q, where('format', 'in', formats));
  }
  
  try {
    const snapshot = await getDocs(q);
    const rows: UsageRow[] = [];
    
    snapshot.forEach(doc => {
      const document = doc.data() as UsageDocument;
      rows.push(documentToRow(document));
    });
    
    return rows.sort((a, b) => a.month.localeCompare(b.month));
  } catch (error) {
    console.error('Error fetching usage trends:', error);
    throw new Error('Failed to fetch usage trends');
  }
}

/**
 * Get top N Pokémon for a specific slice
 */
export async function getTopUsage(
  platform: Platform,
  generation: Generation,
  format: Format,
  month: string,
  limitCount: number = 50
): Promise<UsageRow[]> {
  if (!db) {
    throw new Error('Firestore database not initialized');
  }
  const q = query(
    collection(db, COLLECTION_NAME),
    where('platform', '==', platform),
    where('generation', '==', generation),
    where('format', '==', format),
    where('month', '==', month),
    orderBy('rank', 'asc'),
    limit(limitCount)
  );
  
  try {
    const snapshot = await getDocs(q);
    const rows: UsageRow[] = [];
    
    snapshot.forEach(doc => {
      const document = doc.data() as UsageDocument;
      rows.push(documentToRow(document));
    });
    
    return rows;
  } catch (error) {
    console.error('Error fetching top usage:', error);
    throw new Error('Failed to fetch top usage data');
  }
}

/**
 * Check if usage data exists for a specific combination
 */
export async function usageDataExists(
  platform: Platform,
  generation: Generation,
  format: Format,
  month: string
): Promise<boolean> {
  if (!db) {
    throw new Error('Firestore database not initialized');
  }
  const q = query(
    collection(db, COLLECTION_NAME),
    where('platform', '==', platform),
    where('generation', '==', generation),
    where('format', '==', format),
    where('month', '==', month),
    limit(1)
  );
  
  try {
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking usage data existence:', error);
    return false;
  }
}

/**
 * Get available months for a specific platform/format combination
 */
export async function getAvailableMonths(
  platform: Platform,
  generation: Generation,
  format: Format
): Promise<string[]> {
  if (!db) {
    throw new Error('Firestore database not initialized');
  }
  const q = query(
    collection(db, COLLECTION_NAME),
    where('platform', '==', platform),
    where('generation', '==', generation),
    where('format', '==', format),
    orderBy('month', 'desc')
  );
  
  try {
    const snapshot = await getDocs(q);
    const months = new Set<string>();
    
    snapshot.forEach(doc => {
      const document = doc.data() as UsageDocument;
      months.add(document.month);
    });
    
    return Array.from(months).sort().reverse();
  } catch (error) {
    console.error('Error fetching available months:', error);
    return [];
  }
}
