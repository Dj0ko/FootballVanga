import { BadgeCheck, ListOrdered, Target, Trophy, X } from "lucide-react";
import { useEffect } from "react";

import { SCORING_RULES } from "@footballvanga/shared";

import styles from "./ScoringRulesDialog.module.css";

type ScoringRulesDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

const getPointsLabel = (points: number) => {
  const lastDigit = points % 10;
  const lastTwoDigits = points % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return "очко";
  }

  if ([2, 3, 4].includes(lastDigit) && ![12, 13, 14].includes(lastTwoDigits)) {
    return "очка";
  }

  return "очков";
};

const formatPoints = (points: number) => `+${points} ${getPointsLabel(points)}`;
const exactScoreTotal = SCORING_RULES.matchOutcome + SCORING_RULES.exactScore;

export function ScoringRulesDialog({ isOpen, onClose }: ScoringRulesDialogProps) {
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);

    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scoring-rules-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <p>Подсчет очков</p>
            <h2 id="scoring-rules-title">Правила игры</h2>
          </div>
          <button type="button" className={styles.closeButton} aria-label="Закрыть правила" onClick={onClose} autoFocus>
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className={styles.rulesList}>
          <article className={styles.ruleItem}>
            <span className={styles.ruleIcon}>
              <ListOrdered size={20} aria-hidden="true" />
            </span>
            <div>
              <h3>Места в группе</h3>
              <p>
                {formatPoints(SCORING_RULES.exactGroupPlace)} за каждую команду, которая оказалась ровно на
                предсказанном итоговом месте.
              </p>
            </div>
          </article>

          <article className={styles.ruleItem}>
            <span className={styles.ruleIcon}>
              <Target size={20} aria-hidden="true" />
            </span>
            <div>
              <h3>Исход матча</h3>
              <p>
                {formatPoints(SCORING_RULES.matchOutcome)} за верный исход: победа первой команды, ничья или победа
                второй команды.
              </p>
            </div>
          </article>

          <article className={styles.ruleItem}>
            <span className={styles.ruleIcon}>
              <BadgeCheck size={20} aria-hidden="true" />
            </span>
            <div>
              <h3>Точный счет</h3>
              <p>
                {formatPoints(SCORING_RULES.exactScore)} сверху за точный счет. Такой матч дает{" "}
                <strong>{exactScoreTotal} {getPointsLabel(exactScoreTotal)}</strong>: исход плюс бонус.
              </p>
            </div>
          </article>

          <article className={styles.ruleItem}>
            <span className={styles.ruleIcon}>
              <Trophy size={20} aria-hidden="true" />
            </span>
            <div>
              <h3>Равенство очков</h3>
              <p>Если суммы равны, выше в таблице участник с большим числом точных счетов.</p>
            </div>
          </article>
        </div>

        <p className={styles.note}>
          Прогнозы можно менять до общего дедлайна перед стартом турнира. После дедлайна они остаются только для
          просмотра.
        </p>
      </section>
    </div>
  );
}
