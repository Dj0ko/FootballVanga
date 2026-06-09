import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { stdin as input, stdout as output } from "node:process";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);

const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_LENGTH = 16;
const SCRYPT_PARAMS = {
  N: 32768,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024
};

const readHiddenLine = (prompt) =>
  new Promise((resolve) => {
    output.write(prompt);
    input.setRawMode?.(true);
    input.resume();
    input.setEncoding("utf8");

    let value = "";

    const onData = (char) => {
      if (char === "\u0003") {
        output.write("\n");
        process.exit(130);
      }

      if (char === "\r" || char === "\n") {
        input.setRawMode?.(false);
        input.pause();
        input.off("data", onData);
        output.write("\n");
        resolve(value);
        return;
      }

      if (char === "\u007f") {
        value = value.slice(0, -1);
        return;
      }

      value += char;
    };

    input.on("data", onData);
  });

const hashPassword = async (password) => {
  const salt = randomBytes(PASSWORD_SALT_LENGTH);
  const derivedKey = await scrypt(password, salt, PASSWORD_KEY_LENGTH, SCRYPT_PARAMS);

  return [
    "scrypt",
    SCRYPT_PARAMS.N.toString(),
    SCRYPT_PARAMS.r.toString(),
    SCRYPT_PARAMS.p.toString(),
    salt.toString("base64url"),
    derivedKey.toString("base64url")
  ].join(":");
};

const password = await readHiddenLine("Admin password: ");
const repeatedPassword = await readHiddenLine("Repeat password: ");

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

if (password !== repeatedPassword) {
  console.error("Passwords do not match.");
  process.exit(1);
}

const passwordHash = await hashPassword(password);

console.log(`ADMIN_PASSWORD_HASH=${passwordHash}`);
