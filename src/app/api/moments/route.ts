import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase'
import { checkGlobalLimit, checkPostLimit } from '@/lib/rate-limit'

// GET /api/moments?page=1&limit=10
export async function GET(req: NextRequest) {
  // Prefer x-real-ip (set by trusted reverse proxy) over x-forwarded-for (spoofable)
  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for') ?? 'unknown'
  const glCheck = checkGlobalLimit(ip)
  if (!glCheck.allowed) {
    return NextResponse.json({ error: 'Troppe richieste' }, { status: 429 })
  }

  const supabase = createSupabaseServerClient()
  const { searchParams } = new URL(req.url)

  const page  = Math.min(200, Math.max(1, parseInt(searchParams.get('page')  ?? '1')))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '10')))
  const offset = (page - 1) * limit

  const { data, error, count } = await supabase
    .from('moments')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[API/moments] GET error:', error.message)
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 })
  }

  return NextResponse.json({
    moments: data ?? [],
    total: count ?? 0,
    page,
    limit,
    hasMore: (count ?? 0) > offset + limit,
  })
}

// POST /api/moments  (multipart/form-data or application/json)
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for') ?? 'unknown'
  const postCheck = checkPostLimit(ip)
  if (!postCheck.allowed) {
    return NextResponse.json({ error: 'Troppe richieste. Riprova tra qualche secondo.' }, { status: 429 })
  }

  const supabase = createSupabaseServerClient()
  const contentType = req.headers.get('content-type') ?? ''

  const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif'])
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB

  let text = ''
  let image_url: string | null = null

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    text = (formData.get('text') as string) ?? ''

    const image = formData.get('image') as File | null
    if (image && image.size > 0) {
      // Server-side size validation
      if (image.size > MAX_IMAGE_SIZE) {
        return NextResponse.json({ error: 'Immagine troppo grande. Massimo 5 MB.' }, { status: 400 })
      }

      // Extension whitelist
      const ext = (image.name.split('.').pop() ?? '').toLowerCase()
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        return NextResponse.json({ error: 'Formato immagine non supportato. Usa JPG, PNG, WebP o GIF.' }, { status: 400 })
      }

      // Magic byte validation — prevent SVG/HTML polyglots disguised as .jpg etc.
      const buf = await image.arrayBuffer()
      const header = Array.from(new Uint8Array(buf.slice(0, 12)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()

      const MAGIC_SIGNATURES: Record<string, string[]> = {
        jpg:  ['FFD8FF'],
        jpeg: ['FFD8FF'],
        png:  ['89504E47'],
        gif:  ['47494638'],
        webp: ['52494646'], // RIFF header — further validated below
      }

      const expected = MAGIC_SIGNATURES[ext]
      if (!expected || !expected.some(sig => header.startsWith(sig))) {
        return NextResponse.json({ error: 'Tipo di file non valido. Il contenuto non corrisponde all\'estensione.' }, { status: 400 })
      }

      // WebP: require WEBP subtype at bytes 8-11
      if (ext === 'webp' && header.slice(16, 24) !== '57454250') {
        return NextResponse.json({ error: 'File WebP non valido.' }, { status: 400 })
      }

      // Safe filename — never trust client filename
      const fileName = `${crypto.randomUUID()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('moment-images')
        .upload(fileName, image, {
          contentType: image.type,
          upsert: false,
        })

      if (uploadError) {
        console.error('[API/moments] Upload error:', uploadError.message)
        return NextResponse.json({ error: 'Errore durante il caricamento dell\'immagine' }, { status: 500 })
      }

      const { data: urlData } = supabase.storage
        .from('moment-images')
        .getPublicUrl(fileName)
      image_url = urlData.publicUrl
    }
  } else {
    try {
      const json = await req.json()
      text = json.text ?? ''
    } catch {
      return NextResponse.json({ error: 'Body non valido' }, { status: 400 })
    }
  }

  text = text.trim()

  if (!text) {
    return NextResponse.json({ error: 'Il testo è obbligatorio' }, { status: 400 })
  }
  if (text.length > 280) {
    return NextResponse.json({ error: 'Massimo 280 caratteri' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('moments')
    .insert({ text, image_url: image_url ?? undefined })
    .select()
    .single()

  if (error) {
    console.error('[API/moments] Insert error:', error.message)
    return NextResponse.json({ error: 'Errore durante la pubblicazione' }, { status: 500 })
  }

  return NextResponse.json({ moment: data }, { status: 201 })
}
