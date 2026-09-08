import { env } from "cloudflare:workers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export type SessionUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
};

export const SESSION_COOKIE_NAME = "jnt_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dní

const SIGN_IN_PATH = "/prihlaseni";
const SIGN_OUT_PATH = "/odhlaseni";

/** Vrátí přihlášeného uživatele podle session cookie, nebo null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const row = await env.DB.prepare(
    `SELECT users.id as id, users.email as email, users.display_name as display_name
     FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.id = ? AND sessions.expires_at > ?`,
  ).bind(token, Date.now()).first<{ id: string; email: string; display_name: string }>();

  if (!row) return null;
  return { userId: row.id, email: row.email, displayName: row.display_name, fullName: row.display_name };
}

/** Vyžaduje přihlášeného uživatele, jinak přesměruje na přihlášení s návratem. */
export async function requireSessionUser(returnTo: string): Promise<SessionUser> {
  const user = await getSessionUser();
  if (user) return user;
  redirect(signInPath(returnTo));
}

export function signInPath(returnTo: string): string {
  return `${SIGN_IN_PATH}?mode=register&return_to=${encodeURIComponent(safeRelativePath(returnTo, "/ucet"))}`;
}

export function signOutPath(returnTo = "/"): string {
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeRelativePath(returnTo, "/"))}`;
}

/** Ověří, že cesta je bezpečná relativní návratová cesta (ochrana proti open redirectu). */
export function safeRelativePath(value: string, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const url = new URL(value, "https://app.local");
    if (url.origin !== "https://app.local") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

/** Vytvoří novou session v D1 a vrátí token, který se uloží do cookie. */
export async function createSession(userId: string): Promise<string> {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
  ).bind(token, userId, now + SESSION_MAX_AGE_SECONDS * 1000, now).run();
  return token;
}

/** Smaže session z D1 (odhlášení). */
export async function destroySession(token: string | undefined | null): Promise<void> {
  if (!token) return;
  await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(token).run();
}

/** Hlavička Set-Cookie pro přihlášení. Nastavuje se ručně na Response, ne přes cookies().set(),
 *  aby fungovala spolehlivě i u Route Handlerů, které vrací obyčejný Response/redirect. */
export function sessionCookieHeader(token: string): string {
  return `${SESSION_COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

export function clearedSessionCookieHeader(): string {
  return `${SESSION_COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}


                                   const RESET_TOKEN_MAX_AGE_SECONDS = 60 * 60;

export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = `${crypto.randomUUID()}${crypto.randomUUID()}`.replace(/-/g, "");
  const tokenHash = await sha256Hex(token);
  const now = Date.now();
  await env.DB.prepare(
    "INSERT INTO password_resets (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
    ).bind(tokenHash, userId, now + RESET_TOKEN_MAX_AGE_SECONDS * 1000, now).run();
  return token;
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    "SELECT user_id FROM password_resets WHERE id = ? AND expires_at > ?",
    ).bind(tokenHash, Date.now()).first<{ user_id: string }>();
  if (!row) return null;
  await env.DB.prepare("DELETE FROM password_resets WHERE id = ?").bind(tokenHash).run();
  return row.user_id;
}

export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "TradeLink <onboarding@resend.dev>",
      to: email,
      subject: "Obnova hesla – TradeLink",
      html: `<p>Dobrý den,</p><p>někdo (doufejme vy) požádal o obnovu hesla k účtu TradeLink. Klikněte na odkaz níže a nastavte si nové heslo. Odkaz platí 1 hodinu.</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>Pokud jste o obnovu hesla nežádali, tento e-mail jednoduše ignorujte — heslo zůstane beze změny.</p>`,
    }),
  });
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
