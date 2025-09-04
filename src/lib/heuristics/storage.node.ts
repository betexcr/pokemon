import type { KVStorage } from './storage';

// Node-only file adapter (JSON single file)
export class FileStorage implements KVStorage {
  private filePath: string;
  private fs: typeof import('fs') = eval('require("fs")');
  constructor(filePath: string = '.heuristics.json') { this.filePath = filePath; }
  private read(): Record<string, string> {
    try {
      if (!this.fs.existsSync(this.filePath)) return {};
      return JSON.parse(this.fs.readFileSync(this.filePath, 'utf8') || '{}');
    } catch { return {}; }
  }
  private write(obj: Record<string, string>) {
    try { this.fs.writeFileSync(this.filePath, JSON.stringify(obj)); } catch {}
  }
  async getItem(k: string) { const o = this.read(); return k in o ? o[k] : null; }
  async setItem(k: string, v: string) { const o = this.read(); o[k] = v; this.write(o); }
  async removeItem(k: string) { const o = this.read(); delete o[k]; this.write(o); }
}


