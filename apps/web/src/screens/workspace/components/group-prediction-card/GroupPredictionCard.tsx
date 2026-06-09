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
import { GripVertical } from "lucide-react";
import type { CSSProperties } from "react";

import type { Group } from "../../../../data/mockFootball";
import { teamFlagUrls } from "../../../../data/teamFlags";
import styles from "./GroupPredictionCard.module.css";

type GroupPredictionCardProps = {
  group: Group;
  teams: string[];
  onTeamsChange: (teams: string[]) => void;
};

type SortableTeamRowProps = {
  position: number;
  team: string;
};

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
      {flagUrl ? (
        <img className={styles.flag} src={flagUrl} alt={`Флаг: ${team}`} draggable={false} />
      ) : null}
      <span className={styles.teamName}>{team}</span>
      <span className={styles.dragHint} aria-hidden="true">
        <GripVertical size={18} aria-hidden="true" />
      </span>
    </li>
  );
}

export function GroupPredictionCard({ group, teams, onTeamsChange }: GroupPredictionCardProps) {
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

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
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
    <article className={styles.card}>
      <h3>{group.name}</h3>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={teams} strategy={verticalListSortingStrategy}>
          <ol className={styles.teamList}>
            {teams.map((team, index) => (
              <SortableTeamRow key={team} position={index + 1} team={team} />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
    </article>
  );
}
