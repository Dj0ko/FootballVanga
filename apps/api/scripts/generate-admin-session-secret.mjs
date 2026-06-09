import { randomBytes } from "node:crypto";

console.log(`ADMIN_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
