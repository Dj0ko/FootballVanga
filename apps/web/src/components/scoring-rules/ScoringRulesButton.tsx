import { CircleHelp } from "lucide-react";

import styles from "./ScoringRulesButton.module.css";

type ScoringRulesButtonProps = {
  className?: string;
  onClick: () => void;
};

export function ScoringRulesButton({ className, onClick }: ScoringRulesButtonProps) {
  const classNames = [styles.button, className].filter(Boolean).join(" ");

  return (
    <button
      type="button"
      className={classNames}
      aria-label="Открыть правила подсчета очков"
      title="Правила подсчета очков"
      onClick={onClick}
    >
      <CircleHelp size={18} aria-hidden="true" />
      Правила
    </button>
  );
}
