# Ghost Protocol 👻

> Scopri quante persone hanno vissuto esattamente quello che stai vivendo.

Posta un momento in anonimo → la gente vota "anche io" o "solo io" → vedi il % di umanità che ha vissuto la stessa cosa.

---

## Setup in 10 minuti

### 1. Crea il progetto Supabase

1. Vai su [supabase.com](https://supabase.com) → crea un nuovo progetto
2. Vai su **SQL Editor** → esegui `supabase/schema.sql` integralmente
3. Vai su **Storage** → verifica che esista il bucket `moment-images` (creato dallo SQL)

> Se il bucket non viene creato automaticamente: Storage → New bucket → nome `moment-images` → Public ✓

### 2. Variabili d'ambiente

```bash
cp .env.local.example .env.local
```

Compila `.env.local` con le credenziali dal dashboard Supabase:
**Project Settings → API**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. Installa e avvia

```bash
npm install
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

---

## Deploy su Vercel

```bash
npm i -g vercel
vercel
```

Aggiungi le 3 variabili d'ambiente nel dashboard Vercel (Settings → Environment Variables).

---

## Struttura del progetto

```
src/
├── app/
│   ├── page.tsx              # Feed principale (Server Component + ISR)
│   ├── layout.tsx            # Root layout + metadata
│   ├── globals.css           # Stili globali + grain texture
│   └── api/
│       ├── moments/route.ts  # GET lista momenti, POST nuovo momento
│       └── vote/route.ts     # POST voto (con dedup fingerprint)
├── components/
│   ├── Header.tsx            # Navbar sticky + pulsante condividi
│   ├── Feed.tsx              # Feed con infinite scroll
│   ├── MomentCard.tsx        # Card momento + voto + reveal animato
│   └── SubmitModal.tsx       # Modal creazione momento + upload foto
└── lib/
    ├── supabase.ts           # Clients (anon + service role) + types
    └── fingerprint.ts        # UUID anonimo localStorage per dedup voti

supabase/
└── schema.sql                # Tabelle + RLS + RPC + Storage
```

---

## Come funziona il sistema anti-doppio-voto

Due livelli:
1. **Client**: UUID anonimo in `localStorage` → evita il re-render del form dopo voto
2. **Server**: colonna `UNIQUE(moment_id, fingerprint)` in `votes` → previene i duplicati a DB

Nessun account, nessun cookie tracciante, nessun dato personale.

---

## Prossimi step (roadmap)

### Free
- [ ] Pagina SEO per ogni momento (`/m/[id]`) con og:image dinamica
- [ ] Trending: ordina per engagement (voti nelle ultime 24h)
- [ ] Categorie: lavoro, amore, soldi, abitudini

### Monetizzazione
- [ ] **AdSense** → banner sotto i momenti virali
- [ ] **Premium** → vedi quante persone hanno votato "anche io" vicino a te (Supabase Auth + Stripe)
- [ ] **Premium Plus** → filtra per paese/età, messaggia in anonimo chi ha vissuto lo stesso

### Crescita
- [ ] Card condivisibile generata server-side (Satori/Vercel OG)
- [ ] Embed widget per altri siti
- [ ] API pubblica per integrazioni

---

## Stack

| Layer | Tecnologia |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (Postgres) |
| Storage | Supabase Storage |
| Stili | Tailwind CSS |
| Language | TypeScript |
| Deploy | Vercel |
