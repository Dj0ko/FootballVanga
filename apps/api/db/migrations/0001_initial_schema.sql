CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION footballvanga_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE rooms (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  password_hash text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT rooms_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT rooms_password_hash_not_blank CHECK (length(btrim(password_hash)) > 0),
  CONSTRAINT rooms_status_check CHECK (status IN ('draft', 'open', 'locked', 'finished'))
);

CREATE INDEX rooms_status_idx ON rooms(status);

CREATE TRIGGER rooms_set_updated_at
BEFORE UPDATE ON rooms
FOR EACH ROW
EXECUTE FUNCTION footballvanga_set_updated_at();

CREATE TABLE participants (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  code_hash text NOT NULL,
  prediction_submitted_at timestamptz,
  prediction_updated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT participants_display_name_not_blank CHECK (length(btrim(display_name)) > 0),
  CONSTRAINT participants_code_hash_not_blank CHECK (length(btrim(code_hash)) > 0)
);

CREATE UNIQUE INDEX participants_room_display_name_unique
ON participants(room_id, lower(display_name));

CREATE UNIQUE INDEX participants_id_room_id_unique
ON participants(id, room_id);

CREATE INDEX participants_room_id_idx ON participants(room_id);

CREATE TRIGGER participants_set_updated_at
BEFORE UPDATE ON participants
FOR EACH ROW
EXECUTE FUNCTION footballvanga_set_updated_at();

CREATE TABLE participant_sessions (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  participant_id text NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CONSTRAINT participant_sessions_token_hash_not_blank CHECK (length(btrim(token_hash)) > 0),
  CONSTRAINT participant_sessions_expires_after_created CHECK (expires_at > created_at)
);

CREATE INDEX participant_sessions_participant_id_idx
ON participant_sessions(participant_id);

CREATE INDEX participant_sessions_active_idx
ON participant_sessions(participant_id, expires_at)
WHERE revoked_at IS NULL;

CREATE TABLE tournament_groups (
  id text PRIMARY KEY,
  name text NOT NULL,
  display_order smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tournament_groups_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT tournament_groups_display_order_positive CHECK (display_order > 0),
  CONSTRAINT tournament_groups_display_order_unique UNIQUE (display_order)
);

CREATE UNIQUE INDEX tournament_groups_name_unique
ON tournament_groups(lower(name));

CREATE TRIGGER tournament_groups_set_updated_at
BEFORE UPDATE ON tournament_groups
FOR EACH ROW
EXECUTE FUNCTION footballvanga_set_updated_at();

CREATE TABLE teams (
  id text PRIMARY KEY,
  group_id text NOT NULL REFERENCES tournament_groups(id) ON DELETE RESTRICT,
  name text NOT NULL,
  flag_code text,
  display_order smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teams_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT teams_display_order_check CHECK (display_order BETWEEN 1 AND 4),
  CONSTRAINT teams_group_display_order_unique UNIQUE (group_id, display_order),
  CONSTRAINT teams_id_group_id_unique UNIQUE (id, group_id)
);

CREATE UNIQUE INDEX teams_group_name_unique
ON teams(group_id, lower(name));

CREATE INDEX teams_group_id_idx ON teams(group_id);

CREATE TRIGGER teams_set_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW
EXECUTE FUNCTION footballvanga_set_updated_at();

CREATE TABLE matches (
  id text PRIMARY KEY,
  group_id text NOT NULL REFERENCES tournament_groups(id) ON DELETE RESTRICT,
  home_team_id text NOT NULL,
  away_team_id text NOT NULL,
  starts_at timestamptz NOT NULL,
  venue text NOT NULL,
  display_order smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT matches_venue_not_blank CHECK (length(btrim(venue)) > 0),
  CONSTRAINT matches_display_order_positive CHECK (display_order > 0),
  CONSTRAINT matches_distinct_teams CHECK (home_team_id <> away_team_id),
  CONSTRAINT matches_group_display_order_unique UNIQUE (group_id, display_order),
  CONSTRAINT matches_id_group_id_unique UNIQUE (id, group_id),
  CONSTRAINT matches_home_team_group_fk
    FOREIGN KEY (home_team_id, group_id) REFERENCES teams(id, group_id) ON DELETE RESTRICT,
  CONSTRAINT matches_away_team_group_fk
    FOREIGN KEY (away_team_id, group_id) REFERENCES teams(id, group_id) ON DELETE RESTRICT
);

CREATE INDEX matches_group_id_idx ON matches(group_id);
CREATE INDEX matches_starts_at_idx ON matches(starts_at);

CREATE TRIGGER matches_set_updated_at
BEFORE UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION footballvanga_set_updated_at();

CREATE TABLE match_results (
  match_id text PRIMARY KEY REFERENCES matches(id) ON DELETE CASCADE,
  home_score smallint NOT NULL,
  away_score smallint NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  finished_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_results_home_score_check CHECK (home_score BETWEEN 0 AND 99),
  CONSTRAINT match_results_away_score_check CHECK (away_score BETWEEN 0 AND 99),
  CONSTRAINT match_results_source_check CHECK (source IN ('manual', 'import'))
);

CREATE INDEX match_results_finished_at_idx ON match_results(finished_at DESC);

CREATE TRIGGER match_results_set_updated_at
BEFORE UPDATE ON match_results
FOR EACH ROW
EXECUTE FUNCTION footballvanga_set_updated_at();

CREATE TABLE group_standing_results (
  group_id text NOT NULL REFERENCES tournament_groups(id) ON DELETE RESTRICT,
  team_id text NOT NULL,
  position smallint NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, team_id),
  CONSTRAINT group_standing_results_position_check CHECK (position BETWEEN 1 AND 4),
  CONSTRAINT group_standing_results_source_check CHECK (source IN ('manual', 'import')),
  CONSTRAINT group_standing_results_group_position_unique UNIQUE (group_id, position),
  CONSTRAINT group_standing_results_team_group_fk
    FOREIGN KEY (team_id, group_id) REFERENCES teams(id, group_id) ON DELETE RESTRICT
);

CREATE TRIGGER group_standing_results_set_updated_at
BEFORE UPDATE ON group_standing_results
FOR EACH ROW
EXECUTE FUNCTION footballvanga_set_updated_at();

CREATE TABLE participant_group_predictions (
  participant_id text NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  group_id text NOT NULL REFERENCES tournament_groups(id) ON DELETE RESTRICT,
  team_id text NOT NULL,
  position smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (participant_id, group_id, team_id),
  CONSTRAINT participant_group_predictions_position_check CHECK (position BETWEEN 1 AND 4),
  CONSTRAINT participant_group_predictions_group_position_unique UNIQUE (participant_id, group_id, position),
  CONSTRAINT participant_group_predictions_team_group_fk
    FOREIGN KEY (team_id, group_id) REFERENCES teams(id, group_id) ON DELETE RESTRICT
);

CREATE INDEX participant_group_predictions_group_id_idx
ON participant_group_predictions(group_id);

CREATE TRIGGER participant_group_predictions_set_updated_at
BEFORE UPDATE ON participant_group_predictions
FOR EACH ROW
EXECUTE FUNCTION footballvanga_set_updated_at();

CREATE TABLE participant_match_predictions (
  participant_id text NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  match_id text NOT NULL REFERENCES matches(id) ON DELETE RESTRICT,
  home_score smallint NOT NULL,
  away_score smallint NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (participant_id, match_id),
  CONSTRAINT participant_match_predictions_home_score_check CHECK (home_score BETWEEN 0 AND 99),
  CONSTRAINT participant_match_predictions_away_score_check CHECK (away_score BETWEEN 0 AND 99)
);

CREATE INDEX participant_match_predictions_match_id_idx
ON participant_match_predictions(match_id);

CREATE TRIGGER participant_match_predictions_set_updated_at
BEFORE UPDATE ON participant_match_predictions
FOR EACH ROW
EXECUTE FUNCTION footballvanga_set_updated_at();

CREATE TABLE score_snapshots (
  participant_id text PRIMARY KEY,
  room_id text NOT NULL,
  group_standing_points integer NOT NULL DEFAULT 0,
  match_outcome_points integer NOT NULL DEFAULT 0,
  exact_score_points integer NOT NULL DEFAULT 0,
  exact_score_hits integer NOT NULL DEFAULT 0,
  total_points integer GENERATED ALWAYS AS (
    group_standing_points + match_outcome_points + exact_score_points
  ) STORED,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT score_snapshots_participant_room_fk
    FOREIGN KEY (participant_id, room_id) REFERENCES participants(id, room_id) ON DELETE CASCADE,
  CONSTRAINT score_snapshots_group_standing_points_check CHECK (group_standing_points >= 0),
  CONSTRAINT score_snapshots_match_outcome_points_check CHECK (match_outcome_points >= 0),
  CONSTRAINT score_snapshots_exact_score_points_check CHECK (exact_score_points >= 0),
  CONSTRAINT score_snapshots_exact_score_hits_check CHECK (exact_score_hits >= 0)
);

CREATE INDEX score_snapshots_room_leaderboard_idx
ON score_snapshots(room_id, total_points DESC, exact_score_hits DESC);

CREATE VIEW tournament_prediction_deadline AS
SELECT min(starts_at) AS deadline_at
FROM matches;
