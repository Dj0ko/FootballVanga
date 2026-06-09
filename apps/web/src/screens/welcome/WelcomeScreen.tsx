import { ArrowRight } from "lucide-react";

import { DeadlineCountdown } from "../../components/deadline-countdown/DeadlineCountdown";
import styles from "./WelcomeScreen.module.css";

type WelcomeScreenProps = {
  onContinue: () => void;
};

export function WelcomeScreen({ onContinue }: WelcomeScreenProps) {
  return (
    <main className={styles.shell}>
      <section className={styles.hero} aria-labelledby="welcome-title">
        <DeadlineCountdown className={styles.deadlineCountdown} variant="dark" />

        <div className={styles.field} aria-hidden="true">
          <span className={`${styles.penaltyBox} ${styles.penaltyBoxLeft}`} />
          <span className={`${styles.penaltyBox} ${styles.penaltyBoxRight}`} />
          <span className={styles.midfieldLine} />
          <span className={styles.centerCircle} />
        </div>

        <div className={styles.content}>
          <p className={styles.eyebrow}>Прогнозы группового этапа</p>
          <h1 className={styles.title} id="welcome-title">
            FootballVanga
          </h1>
          <p className={styles.lead}>Закрытая игра прогнозов для футбольных компаний.</p>
          <p className={styles.copy}>
            Входи в комнату, оставляй прогноз и следи, как меняется таблица после каждого матча.
          </p>
          <button type="button" className={styles.accentButton} onClick={onContinue}>
            Продолжить
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        </div>
      </section>
    </main>
  );
}
