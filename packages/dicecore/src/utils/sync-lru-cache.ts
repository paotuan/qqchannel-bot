import LRUCache from 'lru-cache'

type Fetcher<K, V> = (key: K) => V | undefined

export class SyncLruCache<K, V> {

  private readonly cache: LRUCache<K, V | undefined>
  private readonly fetchMethod: Fetcher<K, V>

  constructor({ max, fetchMethod }: { max: number, fetchMethod: Fetcher<K, V> }) {
    this.cache = new LRUCache<K, V | undefined>({ max })
    this.fetchMethod = fetchMethod
  }

  get(key: K) {
    if (this.cache.has(key)) {
      return this.cache.get(key)
    }
    const value = this.fetchMethod(key)
    this.cache.set(key, value)
    return value
  }
}
