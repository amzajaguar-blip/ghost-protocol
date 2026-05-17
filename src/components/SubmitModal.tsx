'use client'

import { useState, useRef, useEffect } from 'react'

interface SubmitModalProps {
  onClose: () => void
  onSubmit: () => void
}

const MAX_CHARS = 280
const PLACEHOLDER_EXAMPLES = [
  '"Ho baciato il mio ex ieri sera..."',
  '"Ho pianto al lavoro oggi..."',
  '"Ho scrollato i profili del mio ex per 20 minuti stamattina..."',
  '"Ho pagato per un corso che non finirò mai..."',
  '"Ho finto di essere impegnato per non uscire..."',
  '"Ho riletto le vecchie conversazioni alle 2 di notte..."',
]

// Focus trap hook
function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active || !containerRef.current) return

    const container = containerRef.current
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(focusableSelector))

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      const focusable = getFocusable()
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last?.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first?.focus()
      }
    }

    container.addEventListener('keydown', handler)
    // Focus first element on mount
    const first = getFocusable()[0]
    first?.focus()

    return () => container.removeEventListener('keydown', handler)
  }, [active, containerRef])
}

export default function SubmitModal({ onClose, onSubmit }: SubmitModalProps) {
  const [text,         setText]         = useState('')
  const [image,        setImage]        = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [cooldown,     setCooldown]     = useState(false)
  const [placeholder]                   = useState(
    () => PLACEHOLDER_EXAMPLES[Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length)]
  )

  const fileRef     = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const sheetRef    = useRef<HTMLDivElement>(null)
  const cooldownRef = useRef<ReturnType<typeof setTimeout>>()

  // Focus trap
  useFocusTrap(sheetRef, true)

  // Focus textarea on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Immagine troppo grande. Massimo 5 MB.')
      return
    }
    setImage(file)
    // Use ObjectURL instead of FileReader (zero-copy, much more efficient)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  const clearImage = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImage(null)
    setImagePreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  // Cleanup ObjectURL + cooldown on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
      clearTimeout(cooldownRef.current)
    }
  }, [imagePreview])

  const handleSubmit = async () => {
    if (cooldown) return
    const trimmed = text.trim()
    if (!trimmed) { setError('Scrivi almeno qualcosa.'); return }
    if (trimmed.length > MAX_CHARS) { setError(`Massimo ${MAX_CHARS} caratteri.`); return }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('text', trimmed)
      if (image) formData.append('image', image)

      const res = await fetch('/api/moments', {
        method: 'POST',
        body: formData,
        headers: { 'x-anti-csrf': '1' },
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Qualcosa è andato storto.')
        return
      }

      // Cooldown after successful submission
      setCooldown(true)
      cooldownRef.current = setTimeout(() => setCooldown(false), 30_000)

      onSubmit()
    } catch {
      setError('Errore di rete. Controlla la connessione.')
    } finally {
      setLoading(false)
    }
  }

  const charsLeft = MAX_CHARS - text.length
  const nearLimit = charsLeft < 30
  const atLimit   = charsLeft <= 0

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 modal-backdrop"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Condividi un momento anonimo"
        className="w-full max-w-lg bg-surface border border-border rounded-3xl overflow-hidden animate-modal-in shadow-2xl max-h-[90dvh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2
              className="font-black leading-none"
              style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.9rem', letterSpacing: '0.02em' }}
            >
              IL TUO MOMENTO
            </h2>
            <p
              className="text-[10px] text-muted mt-1.5 tracking-widest uppercase"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              👻 anonimo · sempre
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:text-text hover:bg-border transition-all duration-150"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Textarea */}
          <div>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                setText(e.target.value.slice(0, MAX_CHARS))
                setError(null)
              }}
              placeholder={placeholder}
              rows={4}
              className="w-full bg-bg border border-border focus:border-accent/60 rounded-xl p-4 text-text placeholder-muted/50 resize-none text-[0.95rem] leading-relaxed font-medium transition-colors duration-200 outline-none"
            />
            <div className="flex items-center justify-between mt-1.5 px-1">
              {error ? (
                <p className="text-vote-no text-xs">{error}</p>
              ) : (
                <span />
              )}
              <p
                className={`text-xs transition-colors duration-200 ${atLimit ? 'text-vote-no' : nearLimit ? 'text-accent' : 'text-muted'}`}
                style={{ fontFamily: 'DM Mono, monospace' }}
              >
                {charsLeft}
              </p>
            </div>
          </div>

          {/* Image upload */}
          {imagePreview ? (
            <div className="relative rounded-xl overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Anteprima" className="w-full h-44 object-cover" />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white rounded-full w-7 h-7 text-xs transition-colors flex items-center justify-center"
                aria-label="Rimuovi immagine"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border border-dashed border-border/70 hover:border-muted/50 rounded-xl py-4 text-muted hover:text-text text-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              <span className="text-base">📷</span>
              <span>Aggiungi foto (opzionale)</span>
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleImageChange}
            className="hidden"
          />

          {/* Anon notice + Privacy link */}
          <div className="text-center space-y-1">
            <p
              className="text-xs text-muted/70"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              zero dati personali · nessun account · mai
            </p>
            <a
              href="/privacy"
              className="text-[10px] text-muted hover:text-text underline transition-colors"
              style={{ fontFamily: 'DM Mono, monospace' }}
            >
              Come proteggiamo la tua privacy →
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={handleSubmit}
            disabled={loading || !text.trim() || atLimit || cooldown}
            className="w-full bg-accent hover:bg-[#FF5C7A] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-4 rounded-xl transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
            style={{ fontFamily: 'Unbounded, sans-serif', fontSize: '0.78rem', letterSpacing: '0.06em' }}
          >
            {loading ? (
              <>
                <span className="spinner" />
                CONDIVISIONE...
              </>
            ) : cooldown ? (
              'PUBBLICATO ✓'
            ) : (
              'CONDIVIDI IL MOMENTO'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
