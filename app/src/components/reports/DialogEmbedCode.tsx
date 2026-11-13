import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { buildEmbedCode, buildEmbedPath, getEmbedHeight } from '@/lib/embed'
import { formatSittingDate } from '@/lib/format'
import type { SpeechActionContext } from '@/lib/speechActions'
import { copyTextWithToast } from '@/lib/utils'
import { Copy } from 'lucide-react'

interface DialogEmbedCodeProps extends SpeechActionContext {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}

export function DialogEmbedCode({
  isOpen,
  setIsOpen,
  reportSlug,
  ordinal,
  anchor,
  speakerLabel,
  transcript,
  sittingDate,
}: DialogEmbedCodeProps) {
  const embedPath = buildEmbedPath(reportSlug, ordinal, anchor)
  const embedHeight = getEmbedHeight(speakerLabel, transcript)
  const embedCode = buildEmbedCode(
    `${window.location.origin}${embedPath}`,
    embedHeight,
    `Hansard, ${formatSittingDate(sittingDate)}`
  )

  function copyEmbedCode() {
    void copyTextWithToast(
      embedCode,
      'Embed code copied',
      "Couldn't copy the code"
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="bg-background flex max-h-[90vh] flex-col gap-6 overflow-y-auto p-6 sm:max-w-xl sm:p-8">
        <DialogHeader>
          <DialogTitle>Embed</DialogTitle>
          <DialogDescription hidden />
        </DialogHeader>
        <div className="bg-card border-border max-h-56 shrink-0 overflow-y-auto rounded-md border p-4 sm:max-h-none">
          <iframe
            src={embedPath}
            title="Preview"
            className="block w-full border-0"
            style={{ height: embedHeight }}
          />
        </div>
        <Textarea
          readOnly
          value={embedCode}
          aria-label="Embed code"
          className="h-24 resize-none font-mono text-xs leading-5"
        />
        <Button type="button" onClick={copyEmbedCode} className="self-end">
          <Copy aria-hidden="true" />
          Copy code
        </Button>
      </DialogContent>
    </Dialog>
  )
}
