import { createHmac, timingSafeEqual } from "node:crypto";

import { hashPassword, verifyPassword } from "./passwordHash.js";

const ADMIN_COOKIE_NAME = "footballvanga_admin";
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export const hashAdminPassword = hashPassword;

export const verifyAdminPassword = verifyPassword;

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
