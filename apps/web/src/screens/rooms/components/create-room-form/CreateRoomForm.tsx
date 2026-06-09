import { Eye, EyeOff, Plus } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { CreateRoomInput } from "../../../../data/mockFootball";
import styles from "./CreateRoomForm.module.css";

type CreateRoomFormProps = {
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (room: CreateRoomInput) => Promise<void>;
};

const MIN_PASSWORD_LENGTH = 4;

export function CreateRoomForm({ isSubmitting, onCancel, onSubmit }: CreateRoomFormProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const trimmedName = name.trim();
  const isPasswordLongEnough = password.length >= MIN_PASSWORD_LENGTH;
  const canSubmit = trimmedName.length > 0 && isPasswordLongEnough;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    void onSubmit({
      name: trimmedName,
      password
    });
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.header}>
        <h2>Новая комната</h2>
      </div>

      <div className={styles.fields}>
        <label className={styles.field}>
          Название комнаты
          <input
            autoFocus
            disabled={isSubmitting}
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например, ЧМ у друзей"
          />
        </label>

        <label className={styles.field}>
          Пароль комнаты
          <span className={styles.passwordField}>
            <input
              aria-describedby="room-password-hint"
              disabled={isSubmitting}
              minLength={MIN_PASSWORD_LENGTH}
              required
              type={isPasswordVisible ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Минимум 4 символа"
            />
            <button
              type="button"
              aria-label={isPasswordVisible ? "Скрыть пароль" : "Показать пароль"}
              disabled={isSubmitting}
              onClick={() => setIsPasswordVisible((current) => !current)}
            >
              {isPasswordVisible ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
            </button>
          </span>
          <span className={styles.hint} id="room-password-hint">
            Минимум 4 символа. Придумайте пароль, который удобно отправить друзьям.
          </span>
        </label>
      </div>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={!canSubmit || isSubmitting}>
          <Plus size={18} aria-hidden="true" />
          {isSubmitting ? "Создаем..." : "Создать комнату"}
        </button>
        <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isSubmitting}>
          Отмена
        </button>
      </div>
    </form>
  );
}
