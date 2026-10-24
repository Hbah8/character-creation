import type { AudioAsset } from '@/world/types'

export interface SelectedAudioFile {
  name: string
  type: string
  size: number
}

const SUPPORTED_FILE_EXTENSIONS = new Set(['mp3', 'wav', 'mp4'])

function getExtension(filename: string): string {
  const extensionIndex = filename.lastIndexOf('.')
  return extensionIndex === -1 ? '' : filename.slice(extensionIndex + 1).toLowerCase()
}

export function createAudioAssetMetadata(
  file: SelectedAudioFile,
  assetId: string,
): AudioAsset {
  if (!SUPPORTED_FILE_EXTENSIONS.has(getExtension(file.name))) {
    throw new Error('audio.asset.unsupportedFileType')
  }

  return {
    id: assetId,
    filename: file.name,
    mediaType: file.type,
    byteLength: file.size,
  }
}
