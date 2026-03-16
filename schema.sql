-- Flip 7 — Schéma Neon PostgreSQL

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Joueurs récurrents (profils admin)
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parties
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code CHAR(4) NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'lobby', -- lobby | playing | finished
  current_round INT NOT NULL DEFAULT 1,
  winner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- Joueurs dans une partie (peut être lié à un profil ou anonyme)
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id),
  name TEXT NOT NULL,
  total_score INT NOT NULL DEFAULT 0,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- Détail de chaque manche par joueur
CREATE TABLE rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  number_cards_total INT NOT NULL DEFAULT 0, -- somme des cartes numéro
  bonus_double BOOLEAN NOT NULL DEFAULT false, -- carte x2
  bonus_points INT NOT NULL DEFAULT 0, -- somme des +2/+4/+6/+8/+10
  did_flip7 BOOLEAN NOT NULL DEFAULT false,
  did_bust BOOLEAN NOT NULL DEFAULT false, -- a sauté
  round_score INT NOT NULL DEFAULT 0, -- score calculé
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_id, player_id, round_number)
);

-- Index utiles
CREATE INDEX idx_games_code ON games(code);
CREATE INDEX idx_players_game ON players(game_id);
CREATE INDEX idx_rounds_game_round ON rounds(game_id, round_number);

-- Vue stats par profil
CREATE VIEW profile_stats AS
SELECT
  p.id,
  p.name,
  COUNT(DISTINCT pl.game_id) AS games_played,
  COUNT(DISTINCT CASE WHEN g.winner_id = p.id THEN g.id END) AS games_won,
  COALESCE(AVG(pl.total_score), 0)::INT AS avg_score,
  COALESCE(MAX(pl.total_score), 0) AS best_score,
  COUNT(DISTINCT CASE WHEN r.did_flip7 THEN r.id END) AS total_flip7s,
  ROUND(
    100.0 * COUNT(DISTINCT CASE WHEN g.winner_id = p.id THEN g.id END)
    / NULLIF(COUNT(DISTINCT pl.game_id), 0), 1
  ) AS win_rate
FROM profiles p
LEFT JOIN players pl ON pl.profile_id = p.id
LEFT JOIN games g ON g.id = pl.game_id AND g.status = 'finished'
LEFT JOIN rounds r ON r.player_id = pl.id
GROUP BY p.id, p.name;
