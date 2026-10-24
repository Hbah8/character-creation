export interface LocalAudioAssetBinding {
  assetId: string
  fileHandle: FileSystemFileHandle
  lastVerifiedAt: string
}

const DATABASE_NAME = 'swade-audio'
const DATABASE_VERSION = 1
const STORE_NAME = 'local-audio-asset-bindings'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onerror = () => reject(request.error)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'assetId' })
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

async function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const request = operation(transaction.objectStore(STORE_NAME))
    request.onerror = () => reject(request.error)
    transaction.onerror = () => reject(transaction.error)
    transaction.oncomplete = () => {
      database.close()
      resolve(request.result)
    }
  })
}

export async function saveLocalAudioAssetBinding(binding: LocalAudioAssetBinding): Promise<void> {
  await runTransaction('readwrite', store => store.put(binding))
}

export async function getLocalAudioAssetBinding(
  assetId: string,
): Promise<LocalAudioAssetBinding | undefined> {
  return runTransaction('readonly', store => store.get(assetId))
}

export async function deleteLocalAudioAssetBinding(assetId: string): Promise<void> {
  await runTransaction('readwrite', store => store.delete(assetId))
}

export async function clearLocalAudioAssetBindings(): Promise<void> {
  await runTransaction('readwrite', store => store.clear())
}
