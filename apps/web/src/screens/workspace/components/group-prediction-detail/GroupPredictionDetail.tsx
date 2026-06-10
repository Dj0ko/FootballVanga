import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ArrowRight, GripVertical, ListOrdered, Save, ShieldCheck } from "lucide-react";
import type { CSSProperties } from "react";

import type { Group, Match, MatchScore } from "../../../../data/tournament";
import { teamFlagUrls } from "../../../../data/teamFlags";
import styles from "./GroupPredictionDetail.module.css";

type GroupPredictionDetailProps = {
  group: Group;
  isSaved: boolean;
  isReadOnly: boolean;
  matches: Match[];
  matchScores: Record<string, MatchScore>;
  onBackToOverview: () => void;
  onNextGroup: () => void;
  onPreviousGroup: () => void;
  onSaveGroup: () => void;
  onScoreChange: (matchId: string, side: keyof MatchScore, value: number | "") => void;
  onTeamsChange: (teams: string[]) => void;
  teams: string[];
};

type SortableTeamRowProps = {
  position: number;
  team: string;
};

const parseScoreInput = (value: string) => {
  if (value === "") {
    return "";
  }

  return Math.max(0, Number(value));
};

const formatMatchStartsAt = (startsAtIso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(startsAtIso));

function SortableTeamRow({ position, team }: SortableTeamRowProps) {
  const { attributes, isDragging, listeners, setNodeRef, transform, transition } = useSortable({
    id: team
  });
  const flagUrl = teamFlagUrls[team];

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  return (
    <li
      className={`${styles.teamRow} ${isDragging ? styles.teamRowDragging : ""}`}
      ref={setNodeRef}
      style={style}
      title={`Переместить ${team}`}
      {...attributes}
      {...listeners}
    >
      <span className={styles.position}>{position}</span>
      {flagUrl ? <img className={styles.flag} src={flagUrl} alt={`Флаг: ${team}`} draggable={false} /> : null}
      <span className={styles.teamName}>{team}</span>
      <span className={styles.dragHint} aria-hidden="true">
        <GripVertical size={18} aria-hidden="true" />
      </span>
    </li>
  );
}

function ReadOnlyTeamRow({ position, team }: SortableTeamRowProps) {
  const flagUrl = teamFlagUrls[team];

  return (
    <li className={`${styles.teamRow} ${styles.teamRowReadOnly}`}>
      <span className={styles.position}>{position}</span>
      {flagUrl ? <img className={styles.flag} src={flagUrl} alt={`Флаг: ${team}`} draggable={false} /> : null}
      <span className={styles.teamName}>{team}</span>
    </li>
  );
}

export function GroupPredictionDetail({
  group,
  isSaved,
  isReadOnly,
  matches,
  matchScores,
  onBackToOverview,
  onNextGroup,
  onPreviousGroup,
  onSaveGroup,
  onScoreChange,
  onTeamsChange,
  teams
}: GroupPredictionDetailProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const filledScoresCount = matches.filter((match) => {
    const score = matchScores[match.id];
    return Boolean(score && score.home !== "" && score.away !== "");
  }).length;
  const isComplete = filledScoresCount === matches.length;
  const isSavedComplete = isSaved && isComplete;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (isReadOnly) {
      return;
    }

    if (!over || active.id === over.id) {
      return;
    }

    const activeTeam = String(active.id);
    const overTeam = String(over.id);
    const oldIndex = teams.indexOf(activeTeam);
    const newIndex = teams.indexOf(overTeam);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    onTeamsChange(arrayMove(teams, oldIndex, newIndex));
  };

  return (
    <section className={styles.detail} aria-labelledby="group-detail-title">
      <header className={styles.header}>
        <button type="button" className={styles.backButton} onClick={onBackToOverview}>
          <ArrowLeft size={18} aria-hidden="true" />
          Все группы
        </button>
        <div className={styles.headerTitle}>
          <p>Прогноз группы</p>
          <h2 id="group-detail-title">{group.name}</h2>
        </div>
        <div className={styles.progressPill}>
          {isSavedComplete ? "Сохранено" : `Счета ${filledScoresCount}/${matches.length}`}
        </div>
      </header>

      <div className={styles.contentGrid}>
        <section className={styles.panel} aria-labelledby="standings-title">
          <div className={styles.sectionTitle}>
            <ListOrdered size={18} aria-hidden="true" />
            <h3 id="standings-title">Итоговые места</h3>
          </div>

          {isReadOnly ? (
            <ol className={styles.teamList}>
              {teams.map((team, index) => (
                <ReadOnlyTeamRow key={team} position={index + 1} team={team} />
              ))}
            </ol>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={teams} strategy={verticalListSortingStrategy}>
                <ol className={styles.teamList}>
                  {teams.map((team, index) => (
                    <SortableTeamRow key={team} position={index + 1} team={team} />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="scores-title">
          <div className={styles.sectionTitle}>
            <ShieldCheck size={18} aria-hidden="true" />
            <h3 id="scores-title">Счета матчей</h3>
          </div>

          <div className={styles.matchList}>
            {matches.map((match) => {
              const score = matchScores[match.id] ?? { home: "", away: "" };

              return (
                <article className={styles.matchRow} key={match.id}>
                  <span className={styles.matchMeta}>
                    {formatMatchStartsAt(match.startsAtIso)} · {match.venue}
                  </span>
                  <div className={styles.scoreLine}>
                    <span className={styles.matchTeam}>{match.home}</span>
                    <input
                      aria-label={`${match.home}, голов`}
                      disabled={isReadOnly}
                      min="0"
                      type="number"
                      value={score.home}
                      onChange={(event) => {
                        if (!isReadOnly) {
                          onScoreChange(match.id, "home", parseScoreInput(event.target.value));
                        }
                      }}
                    />
                    <span className={styles.scoreDivider}>:</span>
                    <input
                      aria-label={`${match.away}, голов`}
                      disabled={isReadOnly}
                      min="0"
                      type="number"
                      value={score.away}
                      onChange={(event) => {
                        if (!isReadOnly) {
                          onScoreChange(match.id, "away", parseScoreInput(event.target.value));
                        }
                      }}
                    />
                    <span className={`${styles.matchTeam} ${styles.matchTeamAway}`}>{match.away}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <button type="button" className={styles.secondaryButton} onClick={onPreviousGroup}>
          <ArrowLeft size={18} aria-hidden="true" />
          Предыдущая
        </button>
        {isReadOnly ? null : (
          <button type="button" className={styles.saveGroupButton} onClick={onSaveGroup}>
            <Save size={18} aria-hidden="true" />
            Сохранить группу
          </button>
        )}
        <button type="button" className={styles.primaryButton} onClick={onNextGroup}>
          Следующая
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </footer>
    </section>
  );
}
