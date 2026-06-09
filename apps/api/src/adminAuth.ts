import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const ADMIN_COOKIE_NAME = "footballvanga_admin";
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
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

export const hashAdminPassword = async (password: string) => {
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

export const verifyAdminPassword = async (password: string, passwordHash: string) => {
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

const signSessionPayload = (payload: string, sessionSecret: string) =>
  createHmac("sha256", sessionSecret).update(payload).digest("base64url");

export const createAdminSessionCookie = ({
  isSecure,
  sessionSecret
}: {
  isSecure: boolean;
  sessionSecret: string;
}) => {
  const expiresAt = Date.now() + ADMIN_SESSION_TTL_MS;
  const payload = expiresAt.toString();
  const signature = signSessionPayload(payload, sessionSecret);
  const value = `${payload}.${signature}`;
  const cookieParts = [
    `${ADMIN_COOKIE_NAME}=${value}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${Math.floor(ADMIN_SESSION_TTL_MS / 1000)}`
  ];

  if (isSecure) {
    cookieParts.push("Secure");
  }

  return cookieParts.join("; ");
};

export const createClearAdminSessionCookie = () =>
  [`${ADMIN_COOKIE_NAME}=`, "HttpOnly", "Path=/", "SameSite=Lax", "Max-Age=0"].join("; ");

const parseCookieHeader = (cookieHeader: string | undefined) => {
  if (!cookieHeader) {
    return {};
  }

  return Object.fromEntries(
    cookieHeader.split(";").flatMap((cookie) => {
      const [rawName, ...rawValueParts] = cookie.trim().split("=");
      const value = rawValueParts.join("=");

      return rawName && value ? [[rawName, value]] : [];
    })
  ) as Record<string, string>;
};

export const isAdminSessionValid = ({
  cookieHeader,
  sessionSecret
}: {
  cookieHeader: string | undefined;
  sessionSecret: string;
}) => {
  const cookies = parseCookieHeader(cookieHeader);
  const sessionValue = cookies[ADMIN_COOKIE_NAME];

  if (!sessionValue) {
    return false;
  }

  const [payload, signature] = sessionValue.split(".");

  if (!payload || !signature) {
    return false;
  }

  const expiresAt = Number.parseInt(payload, 10);

  if (!Number.isInteger(expiresAt) || expiresAt <= Date.now()) {
    return false;
  }

  const expectedSignature = signSessionPayload(payload, sessionSecret);
  const signatureBuffer = Buffer.from(signature);
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  return (
    signatureBuffer.length === expectedSignatureBuffer.length &&
    timingSafeEqual(signatureBuffer, expectedSignatureBuffer)
  );
};
