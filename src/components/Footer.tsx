import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/30 mt-20">
      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p
            className="text-xs font-black text-text mb-1"
            style={{ fontFamily: 'Unbounded, sans-serif', letterSpacing: '-0.02em' }}
          >
            GHOST<span className="text-accent">.</span>
          </p>
          <p className="text-[10px] text-muted" style={{ fontFamily: 'DM Mono, monospace' }}>
            © {new Date().getFullYear()} Ghost Protocol. Tutti i momenti sono anonimi.
          </p>
        </div>
        <div className="flex gap-4 text-[10px] text-muted" style={{ fontFamily: 'DM Mono, monospace' }}>
          <Link href="/privacy" className="hover:text-text transition-colors">Privacy</Link>
          <Link href="/cookies" className="hover:text-text transition-colors">Cookie</Link>
          <Link href="/termini" className="hover:text-text transition-colors">Termini</Link>
          <a href="mailto:ghost@ghost-protocol.app" className="hover:text-text transition-colors">Contatti</a>
        </div>
      </div>
    </footer>
  )
}
