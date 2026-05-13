import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onClose: () => void
}

const WELCOME_SEEN_KEY = 'swade-welcome-seen'

export function hasSeenWelcome(): boolean {
  return localStorage.getItem(WELCOME_SEEN_KEY) === 'true'
}

export function markWelcomeSeen(): void {
  localStorage.setItem(WELCOME_SEEN_KEY, 'true')
}

export function WelcomeDialog({ open, onClose }: Props) {
  const { t } = useTranslation('header')

  const sections: { title: string; items: string[] }[] = [
    {
      title: t('welcomeCharactersTitle'),
      items: [t('welcomeCharactersDesc')],
    },
    {
      title: t('welcomeEditingTitle'),
      items: [
        t('welcomeIdentity'),
        t('welcomeAttributes'),
        t('welcomeSkills'),
        t('welcomeCombat'),
        t('welcomeEdgesHindrances'),
        t('welcomeWeaponsGear'),
        t('welcomeNotes'),
      ],
    },
    {
      title: t('welcomePreviewTitle'),
      items: [
        t('welcomePreviewLive'),
        t('welcomePreviewDesktop'),
        t('welcomePreviewLayout'),
      ],
    },
    {
      title: t('welcomeExportTitle'),
      items: [t('welcomePdf'), t('welcomeJson')],
    },
    {
      title: t('welcomeSharingTitle'),
      items: [t('welcomeSharingEncode'), t('welcomeSharingDecode')],
    },
    {
      title: t('welcomeMiscTitle'),
      items: [t('welcomeLocale'), t('welcomeUnsaved')],
    },
  ]

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('welcomeTitle')}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-1">
          {sections.map(section => (
            <div key={section.title} className="mb-4">
              <h3 className="font-semibold text-sm mb-1">{section.title}</h3>
              <ul className="space-y-0.5">
                {section.items.map(item => (
                  <li key={item} className="text-sm text-muted-foreground flex gap-2">
                    <span className="mt-1 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>{t('welcomeClose')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
