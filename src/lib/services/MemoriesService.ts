const memoryCache = new Map();
const CACHE_TIME = 2 * 60 * 1000;

class MemoriesService {
    constructor() {

    }

    public getCacheKey(type: string, id?: string, filter?: any) {
        if (id) return `${type}:${id}`;
        if (filter) return `${type}:${JSON.stringify(filter)}`;
        return type;
    }

    public isExpired(timestamp: number) {
        return Date.now() - timestamp > CACHE_TIME;
    }

    public getFromMemory(key: string) {
        const cached = memoryCache.get(key);
        if (!cached) return null;

        console.log(`📦 From memory: ${key}`);
        return cached.data;
    }

    public saveToMemory(key: string, data: any) {
        memoryCache.set(key, {
            data,
            timestamp: Date.now()
        });
        console.log(`💾 Saved to memory: ${key}`);
    }
    public async refreshFromDB(key: string, dbQuery: () => Promise<any>) {
        const cached = memoryCache.get(key);

        if (!cached || this.isExpired(cached.timestamp)) {
            console.log(`🔄 Refreshing from DB: ${key}`);
            const freshData = await dbQuery();
            this.saveToMemory(key, freshData);
            return freshData;
        }

        return cached.data;
    }

    public delete(key: string) {
        memoryCache.delete(key);
        console.log(`🗑️ Deleted from memory: ${key}`);
    }

    public keys() {
        return memoryCache.keys();
    }

    public get(key: string) {
        return memoryCache.get(key);
    }

    public size() {
        return memoryCache.size;
    }

    public clear() {
        memoryCache.clear();
        console.log(`🗑️ Cleared all memory cache`);
    }
}

export { MemoriesService };