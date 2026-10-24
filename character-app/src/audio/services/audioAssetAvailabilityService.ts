import { verifyLocalAudioAsset } from '@/audio/services/localAudioAssetSource'
import type { LocalAudioAssetBinding } from '@/audio/services/localAudioAssetBindingRepository'
import type { AudioAsset } from '@/world/types'

export type AudioAssetAvailability = 'available' | 'missing' | 'changed'

export async function getAudioAssetAvailability(
  assets: AudioAsset[],
  getBinding: (assetId: string) => Promise<LocalAudioAssetBinding | undefined>,
): Promise<Record<string, AudioAssetAvailability>> {
  const entries = await Promise.all(assets.map(async asset => {
    const binding = await getBinding(asset.id)
    const status = binding
      ? await verifyLocalAudioAsset(asset, binding.fileHandle)
      : 'missing'
    return [asset.id, status] as const
  }))

  return Object.fromEntries(entries)
}
