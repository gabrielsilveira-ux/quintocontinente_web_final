-- ============================================================
-- QUINTO CONTINENTE — Migração: Campos de Página de Artista
-- Executar no SQL Editor do Supabase (Settings → SQL Editor)
-- Data: 10/06/2026
-- ============================================================

-- ── 1. Adicionar novos campos ao modelo Artist ──────────────
ALTER TABLE "Artist"
  ADD COLUMN IF NOT EXISTS "slug"         TEXT,
  ADD COLUMN IF NOT EXISTS "bio"          TEXT,
  ADD COLUMN IF NOT EXISTS "genre"        TEXT,
  ADD COLUMN IF NOT EXISTS "websiteUrl"   TEXT,
  ADD COLUMN IF NOT EXISTS "instagramUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "spotifyUrl"   TEXT,
  ADD COLUMN IF NOT EXISTS "galleryUrls"  TEXT[] NOT NULL DEFAULT '{}';

-- ── 2. Gerar slugs automáticos para artistas já cadastrados ─
-- Converte o nome em URL amigável: "Nando Reis" → "nando-reis"
UPDATE "Artist" SET "slug" =
  LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        TRANSLATE(
          name,
          'áàãâäéèêëíìîïóòõôöúùûüçñÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇÑ',
          'aaaaaeeeeiiiiooooouuuucnaaaaaeeeeiiiiooooouuuucn'
        ),
        '[^a-zA-Z0-9\s-]', '', 'g'
      ),
      '\s+', '-', 'g'
    )
  )
WHERE "slug" IS NULL OR "slug" = '';

-- ── 3. Criar índice único no slug ───────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS "Artist_slug_key" ON "Artist"("slug");

-- ── 4. Tornar o slug obrigatório (NOT NULL) ─────────────────
ALTER TABLE "Artist" ALTER COLUMN "slug" SET NOT NULL;

-- ── Verificação: listar artistas com seus slugs gerados ─────
-- SELECT id, name, slug FROM "Artist" ORDER BY "order";


-- ============================================================
-- Migração: Campos UTM no modelo Lead
-- Para rastreamento de tráfego pago (Google Ads, Meta Ads etc.)
-- ============================================================

ALTER TABLE "Lead"
  ADD COLUMN IF NOT EXISTS "utmSource"   TEXT,
  ADD COLUMN IF NOT EXISTS "utmMedium"   TEXT,
  ADD COLUMN IF NOT EXISTS "utmCampaign" TEXT,
  ADD COLUMN IF NOT EXISTS "utmContent"  TEXT;

-- ── Verificação: estrutura final da tabela Lead ─────────────
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'Lead' ORDER BY ordinal_position;
