import { Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { predictionDeadlineStartsAtIso } from "../../data/mockFootball";
import styles from "./DeadlineCountdown.module.css";

type DeadlineCountdownProps = {
  className?: string;
  startsAtIso?: string;
  variant?: "dark" | "light";
};

const SECOND_MS = 1000;
const MINUTE_MS = SECOND_MS * 60;
const HOUR_MS = MINUTE_MS * 60;
const DAY_MS = HOUR_MS * 24;

const formatCountdownPart = (value: number) => value.toString().padStart(2, "0");

const formatRemainingTime = (remainingMs: number) => {
  const safeRemainingMs = Math.max(0, remainingMs);
  const days = Math.floor(safeRemainingMs / DAY_MS);
  const hours = Math.floor((safeRemainingMs % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((safeRemainingMs % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((safeRemainingMs % MINUTE_MS) / SECOND_MS);

  return `${days}д ${formatCountdownPart(hours)}ч ${formatCountdownPart(minutes)}м ${formatCountdownPart(seconds)}с`;
};

const formatDeadlineDate = (startsAtIso: string) =>
  new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short"
  }).format(new Date(startsAtIso));

export function DeadlineCountdown({
  className,
  startsAtIso = predictionDeadlineStartsAtIso,
  variant = "light"
}: DeadlineCountdownProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const deadlineMs = useMemo(() => Date.parse(startsAtIso), [startsAtIso]);
  const isValidDeadline = Number.isFinite(deadlineMs);
  const remainingMs = isValidDeadline ? deadlineMs - nowMs : 0;
  const isExpired = remainingMs <= 0;
  const deadlineDateLabel = isValidDeadline ? formatDeadlineDate(startsAtIso) : "";
  const classNames = [
    styles.countdown,
    variant === "dark" ? styles.dark : styles.light,
    className
  ]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    const intervalId = window.setInterval(() => setNowMs(Date.now()), SECOND_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  if (!isValidDeadline) {
    return null;
  }

  return (
    <div
      className={classNames}
      role="timer"
      title={`Дедлайн: ${deadlineDateLabel}`}
      aria-label={isExpired ? "Дедлайн закрыт" : `До дедлайна ${formatRemainingTime(remainingMs)}`}
    >
      <Timer size={18} aria-hidden="true" />
      <span className={styles.content}>
        <span className={styles.label}>{isExpired ? "Дедлайн" : "До дедлайна"}</span>
        <strong>{isExpired ? "закрыт" : formatRemainingTime(remainingMs)}</strong>
      </span>
    </div>
  );
}
