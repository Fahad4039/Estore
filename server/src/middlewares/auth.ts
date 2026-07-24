import type { NextFunction, Request, RequestHandler, Response } from "express";
import { execute, queryOne } from "../db/postgres";

const SESSION_COOKIE = "sid";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  is_seller: boolean;
  coins: number;
  wallet_balance: number;
  membership: string;
  referral_code: string | null;
  avatar: string | null;
  bio: string | null;
  phone: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

function sessionCookieOptions(expires: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    expires,
    maxAge: SESSION_TTL_MS,
    signed: true,
  };
}

export function setSessionCookie(res: Response, sessionId: string, expires: Date) {
  res.cookie(SESSION_COOKIE, sessionId, sessionCookieOptions(expires));
}

function reject(res: Response, status: 401 | 403, error: string) {
  return res.status(status).json({ success: false, error });
}

/**
 * Verifies the signed HTTP-only session cookie, loads its user, and refreshes
 * the session for another seven days on every authenticated request.
 */
export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const sessionId = req.signedCookies?.[SESSION_COOKIE];
  if (!sessionId || typeof sessionId !== "string") {
    return reject(res, 401, "Not authenticated");
  }

  try {
    const user = await queryOne<AuthUser>(
      `SELECT u.id,u.name,u.email,u.role,u.is_seller,u.coins,u.wallet_balance,
              u.membership,u.referral_code,u.avatar,u.bio,u.phone
       FROM sessions s
       JOIN users u ON s.user_id=u.id
       WHERE s.id=$1 AND s.expires_at > NOW()`,
      [sessionId],
    );

    if (!user) {
      res.clearCookie(SESSION_COOKIE, {
        httpOnly: true,
        sameSite: "lax",
        signed: true,
      });
      return reject(res, 401, "Session expired");
    }

    const expires = new Date(Date.now() + SESSION_TTL_MS);
    await execute("UPDATE sessions SET expires_at=$1 WHERE id=$2", [
      expires,
      sessionId,
    ]);

    req.user = user;

    // Existing route handlers read req.cookies.sid. Keep that internal value
    // available only after cookie-parser has verified the signed cookie.
    if (req.cookies) {
      req.cookies[SESSION_COOKIE] = sessionId;
    }

    res.cookie(SESSION_COOKIE, sessionId, sessionCookieOptions(expires));
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Requires an authenticated user with the administrator role.
 */
export const requireAdmin: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const checkAdmin: NextFunction = (error?: unknown) => {
    if (error) return next(error);
    if (req.user?.role !== "admin") {
      return reject(res, 403, "Admin access required");
    }
    return next();
  };
  if (!req.user) {
    return reject(res, 401, "Not authenticated");
  }
  return checkAdmin();
};

/**
 * Requires an authenticated user whose seller flag is enabled.
 */
export const requireSeller: RequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const checkSeller: NextFunction = (error?: unknown) => {
    if (error) return next(error);
    if (req.user?.is_seller !== true) {
      return reject(res, 403, "Seller access required");
    }
    return next();
  };
  if (!req.user) {
    return reject(res, 401, "Not authenticated");
  }
  return checkSeller();
};