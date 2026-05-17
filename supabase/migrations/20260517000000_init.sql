-- ============================================
-- Ghost Protocol — Database Schema v2
-- Fixes critici:
--  - Rimosso public_read_votes (privacy leak)
--  - Aggiunto fingerprint length constraint
--  - Fixata storage policy (misurava nome, non file)
--  - Nuova cast_vote RPC atomica (check + insert + increment)
-- ============================================

-- Estensione UUID
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────
-- Tabella: moments
-- ──────────────────────────────────────────
create table public.moments (
  id         uuid    default uuid_generate_v4() primary key,
  text       text    not null check (char_length(text) between 1 and 280),
  image_url  text,
  yes_count  integer default 0 not null check (yes_count >= 0),
  no_count   integer default 0 not null check (no_count >= 0),
  created_at timestamptz default timezone('utc', now()) not null
);

-- ──────────────────────────────────────────
-- Tabella: votes
-- ──────────────────────────────────────────
create table public.votes (
  id          uuid    default uuid_generate_v4() primary key,
  moment_id   uuid    references public.moments(id) on delete cascade not null,
  fingerprint text    not null check (char_length(fingerprint) between 1 and 128),
  vote        boolean not null,   -- true = "anche io", false = "solo io"
  created_at  timestamptz default timezone('utc', now()) not null,
  unique (moment_id, fingerprint)
);

-- ──────────────────────────────────────────
-- Row Level Security
-- ──────────────────────────────────────────
alter table public.moments enable row level security;
alter table public.votes   enable row level security;

-- Moments: chiunque può leggere e scrivere
create policy "public_read_moments"
  on public.moments for select using (true);

create policy "public_insert_moments"
  on public.moments for insert with check (true);

-- Votes: SOLO INSERT pubblico — la lettura è vietata (privacy)
-- Il check dei duplicati avviene via RPC cast_vote
create policy "public_insert_votes"
  on public.votes for insert with check (true);

-- ──────────────────────────────────────────
-- RPC: cast_vote — operazione atomica
-- Check esistente → Insert voto → Increment counter → Return counts
-- Tutto in una singola transazione database
-- ──────────────────────────────────────────
create or replace function public.cast_vote(
  p_moment_id uuid,
  p_fingerprint text,
  p_vote boolean
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_existing_vote boolean;
  v_yes_count integer;
  v_no_count integer;
begin
  -- Check if already voted
  select vote into v_existing_vote
  from public.votes
  where moment_id = p_moment_id and fingerprint = p_fingerprint;

  if found then
    select yes_count, no_count into v_yes_count, v_no_count
    from public.moments where id = p_moment_id;
    return jsonb_build_object(
      'alreadyVoted', true,
      'previousVote', v_existing_vote,
      'yes_count', v_yes_count,
      'no_count', v_no_count
    );
  end if;

  -- Insert vote + increment counter atomically
  insert into public.votes (moment_id, fingerprint, vote)
  values (p_moment_id, p_fingerprint, p_vote);

  if p_vote then
    update public.moments
    set yes_count = yes_count + 1
    where id = p_moment_id
    returning yes_count, no_count into v_yes_count, v_no_count;
  else
    update public.moments
    set no_count = no_count + 1
    where id = p_moment_id
    returning yes_count, no_count into v_yes_count, v_no_count;
  end if;

  return jsonb_build_object(
    'success', true,
    'yes_count', v_yes_count,
    'no_count', v_no_count
  );

exception
  when unique_violation then
    -- Race condition: another request inserted between our check and insert
    select vote into v_existing_vote
    from public.votes
    where moment_id = p_moment_id and fingerprint = p_fingerprint;

    select yes_count, no_count into v_yes_count, v_no_count
    from public.moments where id = p_moment_id;

    return jsonb_build_object(
      'alreadyVoted', true,
      'previousVote', v_existing_vote,
      'yes_count', v_yes_count,
      'no_count', v_no_count
    );
end;
$$;

-- Grant execute to anon role (required since we switched from service_role)
grant execute on function public.cast_vote(uuid, text, boolean) to anon, authenticated;

-- ──────────────────────────────────────────
-- Storage bucket per le immagini
-- ──────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('moment-images', 'moment-images', true)
on conflict do nothing;

create policy "public_read_images"
  on storage.objects for select using (bucket_id = 'moment-images');

-- Policy corretta: verifica estensione file, non lunghezza nome
create policy "public_upload_images"
  on storage.objects for insert
  with check (
    bucket_id = 'moment-images'
    and storage.extension(name) = ANY(ARRAY['jpg', 'jpeg', 'png', 'webp', 'gif'])
  );
