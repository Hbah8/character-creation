import type { AudioAsset } from '@/world/types'

export type LocalAudioAssetStatus = 'available' | 'missing' | 'changed'

export async function verifyLocalAudioAsset(
  asset: Pick<AudioAsset, 'filename' | 'byteLength'>,
  fileHandle: FileSystemFileHandle,
): Promise<LocalAudioAssetStatus> {
  try {
    const file = await fileHandle.getFile()
    return file.name === asset.filename && file.size === asset.byteLength
      ? 'available'
      : 'changed'
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotFoundError') {
      return 'missing'
    }
    throw error
  }
}
