const DATABASE_VERSION = 1

const request = window.indexedDB.open('app', DATABASE_VERSION)
const dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
  request.onupgradeneeded = e => {
    const db = (e.target as IDBOpenDBRequest).result
    // 初始化 db
    if (!db.objectStoreNames.contains('scene-map')) {
      db.createObjectStore('scene-map', { keyPath: 'id' })
    }
    resolve(db)
  }
  request.onerror = () => {
    reject(request.error)
  }
})

class DBHandler<T> {
  private readonly db: IDBDatabase
  private readonly tableName: string

  constructor(db: IDBDatabase, tableName: string) {
    this.db = db
    this.tableName = tableName
  }

  get(id: string) {
    return new Promise<T>((resolve, reject) => {
      const transaction = this.db.transaction(this.tableName, 'readonly')
      const store = transaction.objectStore(this.tableName)
      const request = store.get(id)
      request.onsuccess = e => {
        resolve((e.target as IDBRequest).result as T)
      }
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  getAll() {
    return new Promise<T[]>((resolve, reject) => {
      const transaction = this.db.transaction(this.tableName, 'readonly')
      const store = transaction.objectStore(this.tableName)
      const request = store.getAll()
      request.onsuccess = e => {
        resolve((e.target as IDBRequest).result as T[])
      }
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  put(obj: T) {
    return new Promise<boolean>((resolve, reject) => {
      const transaction = this.db.transaction(this.tableName, 'readwrite')
      const store = transaction.objectStore(this.tableName)
      const request = store.put(obj)
      request.onsuccess = () => {
        resolve(true)
      }
      request.onerror = () => {
        reject(request.error)
      }
    })
  }

  delete(id: string) {
    return new Promise<boolean>((resolve, reject) => {
      const transaction = this.db.transaction(this.tableName, 'readwrite')
      const store = transaction.objectStore(this.tableName)
      const request = store.delete(id)
      request.onsuccess = () => {
        resolve(true)
      }
      request.onerror = () => {
        reject(request.error)
      }
    })
  }
}

const dbHandlerMap: Record<string, DBHandler<any>> = {}

// database 操作 handler
export async function useIndexedDBStore<T>(tableName: string) {
  if (!dbHandlerMap[tableName]) {
    const db = await dbPromise
    dbHandlerMap[tableName] = new DBHandler<T>(db, tableName)
  }
  return dbHandlerMap[tableName]
}
