// Cross-env storage adapters: Memory, LocalStorage (browser), File (Node)

export interface KVStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export class MemoryStorage implements KVStorage {
  private map = new Map<string, string>();
  async getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  async setItem(k: string, v: string) { this.map.set(k, v); }
  async removeItem(k: string) { this.map.delete(k); }
}

export class LocalStorageAdapter implements KVStorage {
  // Browser-only; guard before constructing
  async getItem(k: string) { return Promise.resolve(window.localStorage.getItem(k)); }
  async setItem(k: string, v: string) { window.localStorage.setItem(k, v); }
  async removeItem(k: string) { window.localStorage.removeItem(k); }
}


