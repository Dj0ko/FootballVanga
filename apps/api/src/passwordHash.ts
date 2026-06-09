import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_LENGTH = 16;
const SCRYPT_PARAMS = {
  N: 32768,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024
} as const;

type PasswordHashParts = {
  derivedKey: Buffer;
  n: number;
  p: number;
  r: number;
  salt: Buffer;
};

const encodeBase64Url = (value: Buffer) => value.toString("base64url");

const decodeBase64Url = (value: string) => Buffer.from(value, "base64url");

const parsePasswordHash = (passwordHash: string): PasswordHashParts | null => {
  const [algorithm, nValue, rValue, pValue, saltValue, derivedKeyValue] = passwordHash.split(":");

  if (algorithm !== "scrypt" || !nValue || !rValue || !pValue || !saltValue || !derivedKeyValue) {
    return null;
  }

  const n = Number.parseInt(nValue, 10);
  const r = Number.parseInt(rValue, 10);
  const p = Number.parseInt(pValue, 10);

  if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return null;
  }

  return {
    derivedKey: decodeBase64Url(derivedKeyValue),
    n,
    p,
    r,
    salt: decodeBase64Url(saltValue)
  };
};

export const hashPassword = async (password: string) => {
  const salt = randomBytes(PASSWORD_SALT_LENGTH);
  const derivedKey = scryptSync(password, salt, PASSWORD_KEY_LENGTH, SCRYPT_PARAMS);

  return [
    "scrypt",
    SCRYPT_PARAMS.N.toString(),
    SCRYPT_PARAMS.r.toString(),
    SCRYPT_PARAMS.p.toString(),
    encodeBase64Url(salt),
    encodeBase64Url(derivedKey)
  ].join(":");
};

export const verifyPassword = async (password: string, passwordHash: string) => {
  const parts = parsePasswordHash(passwordHash);

  if (!parts) {
    return false;
  }

  const derivedKey = scryptSync(password, parts.salt, parts.derivedKey.length, {
    N: parts.n,
    p: parts.p,
    r: parts.r,
    maxmem: SCRYPT_PARAMS.maxmem
  });

  return derivedKey.length === parts.derivedKey.length && timingSafeEqual(derivedKey, parts.derivedKey);
};
