import { Router, type IRouter, type Response } from "express";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcrypt";
import { customAlphabet } from "nanoid";
import nodemailer from "nodemailer";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { z } from "zod";
import { execute, queryOne } from "../db/postgres";
import { requireAuth, setSessionCookie, type AuthUser } from "../middlewares/auth";

const router: IRouter = Router();
const BCRYPT_SALT_ROUNDS = 12;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const makeReferralCode = customAlphabet(
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
  8,
);

const credentialsSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  referralCode: z.string().trim().min(1).max(32).optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, "Current password is required").optional(),
  currentPassword: z.string().min(1, "Current password is required").optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
}).refine(
  (value) => Boolean(value.oldPassword ?? value.currentPassword),
  { message: "Current password is required", path: ["oldPassword"] },
);

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32, "Reset token is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const googleSchema = z.object({
  idToken: z.string().min(1, "idToken is required"),
});

function success<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ success: true, data });
}

function failure(res: Response, status: number, error: string) {
  return res.status(status).json({ success: false, error });
}

function validationError(res: Response, error: z.ZodError) {
  return failure(res, 400, error.issues.map((issue) => issue.message).join(", "));
}

function sessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_MS);
}

function makeSessionId() {
  return randomBytes(32).toString("hex");
}

function publicUser(user: Record<string, unknown> | null) {
  if (!user) return null;
  const { password_hash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

async function findUniqueReferralCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referralCode = makeReferralCode();
    const existing = await queryOne(
      "SELECT id FROM users WHERE referral_code=$1",
      [referralCode],
    );
    if (!existing) return referralCode;
  }
  throw new Error("Unable to generate a unique referral code");
}

async function createSession(userId: string, res: Response) {
  const sessionId = makeSessionId();
  const expires = sessionExpiry();
  await execute(
    "INSERT INTO sessions (id,user_id,expires_at) VALUES ($1,$2,$3)",
    [sessionId, userId, expires],
  );
  setSessionCookie(res, sessionId, expires);
}

async function getUserById(userId: string) {
  return queryOne<any>(
    `SELECT id,name,email,role,is_seller,coins,wallet_balance,membership,
            referral_code,avatar,bio,phone,banned,firebase_uid
     FROM users WHERE id=$1`,
    [userId],
  );
}

function legacyPasswordHash(password: string) {
  return createHash("sha256")
    .update(password + "estore-salt-2025")
    .digest("hex");
}

async function comparePassword(password: string, passwordHash: string) {
  if (passwordHash.startsWith("$2")) {
    return bcrypt.compare(password, passwordHash);
  }
  // Preserve login compatibility for accounts created before bcrypt was
  // introduced, then upgrade them to bcrypt after a successful login.
  return legacyPasswordHash(password) === passwordHash;
}

async function getFirebaseAuth() {
  if (getApps().length > 0) return getAuth();

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    let serviceAccount: {
      projectId?: string;
      clientEmail?: string;
      privateKey?: string;
    };
    try {
      serviceAccount = JSON.parse(serviceAccountJson);
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON");
    }
    return getAuth(initializeApp({ credential: cert(serviceAccount) }));
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase authentication is not configured");
  }

  return getAuth(
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    }),
  );
}

function getMailTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  if (!host || !user || !password) {
    throw new Error("Password reset email is not configured");
  }

  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass: password },
  });
}

async function sendPasswordResetEmail(email: string, token: string) {
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const appUrl = process.env.APP_URL ?? process.env.REPLIT_DEV_DOMAIN;
  if (!from || !appUrl) {
    throw new Error("Password reset email is not configured");
  }

  const resetUrl = `${appUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  await getMailTransport().sendMail({
    from,
    to: email,
    subject: "Reset your Estore password",
    text: `Reset your password using this link: ${resetUrl}\n\nThis link expires in one hour.`,
    html: `<p>Reset your Estore password by clicking the link below.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in one hour.</p>`,
  });
}

router.post("/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationError(res, parsed.error);

  const { name, email, password, referralCode } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const existing = await queryOne(
      "SELECT id FROM users WHERE LOWER(email)=LOWER($1)",
      [normalizedEmail],
    );
    if (existing) return failure(res, 409, "Email already registered");

    const id = randomBytes(16).toString("hex");
    const newReferralCode = await findUniqueReferralCode();
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    await execute(
      `INSERT INTO users
        (id,name,email,password_hash,referral_code,coins)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [id, name, normalizedEmail, passwordHash, newReferralCode, 10],
    );

    if (referralCode) {
      const referrer = await queryOne<any>(
        "SELECT id FROM users WHERE referral_code=$1",
        [referralCode],
      );
      if (referrer) {
        await execute(
          "INSERT INTO referrals (referrer_id,referee_id,bonus_coins) VALUES ($1,$2,$3)",
          [referrer.id, id, 50],
        );
        await execute("UPDATE users SET coins=coins+50 WHERE id=$1", [referrer.id]);
        await execute("UPDATE users SET coins=coins+20 WHERE id=$1", [id]);
      }
    }

    await createSession(id, res);
    return success(res, publicUser(await getUserById(id)), 201);
  } catch (error: any) {
    if (error?.code === "23505") {
      return failure(res, 409, "Email or referral code already registered");
    }
    return failure(res, 500, "Unable to create account");
  }
});

router.post("/auth/login", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationError(res, parsed.error);

  const { email, password } = parsed.data;
  try {
    const user = await queryOne<any>(
      `SELECT id,name,email,role,is_seller,coins,wallet_balance,membership,
              referral_code,avatar,bio,phone,banned,firebase_uid,password_hash
       FROM users WHERE LOWER(email)=LOWER($1)`,
      [email.toLowerCase()],
    );
    if (!user || !(await comparePassword(password, user.password_hash))) {
      return failure(res, 401, "Invalid credentials");
    }
    if (user.banned === true) {
      return failure(res, 403, "This account is banned");
    }

    if (!user.password_hash.startsWith("$2")) {
      await execute("UPDATE users SET password_hash=$1 WHERE id=$2", [
        await bcrypt.hash(password, BCRYPT_SALT_ROUNDS),
        user.id,
      ]);
    }
    await createSession(user.id, res);
    return success(res, publicUser(user));
  } catch {
    return failure(res, 500, "Unable to sign in");
  }
});

router.get("/auth/me", requireAuth, async (req, res) => {
  return success(res, publicUser(req.user as unknown as Record<string, unknown>));
});

router.post("/auth/logout", requireAuth, async (req, res) => {
  const sessionId = req.signedCookies?.sid;
  if (sessionId) {
    await execute("DELETE FROM sessions WHERE id=$1", [sessionId]);
  }
  res.clearCookie("sid", { httpOnly: true, sameSite: "lax", signed: true });
  return success(res, { message: "Logged out" });
});

router.post("/auth/google", async (req, res) => {
  const parsed = googleSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const firebaseAuth = await getFirebaseAuth();
    const decoded = await firebaseAuth.verifyIdToken(parsed.data.idToken);
    const email = decoded.email?.trim().toLowerCase();
    if (!email || decoded.email_verified !== true) {
      return failure(res, 401, "Google account email is not verified");
    }

    let user = await queryOne<any>(
      `SELECT id,name,email,role,is_seller,coins,wallet_balance,membership,
              referral_code,avatar,bio,phone,banned,firebase_uid,password_hash
       FROM users WHERE firebase_uid=$1`,
      [decoded.uid],
    );

    if (!user) {
      user = await queryOne<any>(
        `SELECT id,name,email,role,is_seller,coins,wallet_balance,membership,
                referral_code,avatar,bio,phone,banned,firebase_uid,password_hash
         FROM users WHERE LOWER(email)=LOWER($1)`,
        [email],
      );
    }

    if (user?.banned === true) return failure(res, 403, "This account is banned");

    if (user) {
      await execute(
        `UPDATE users
         SET firebase_uid=$1, avatar=COALESCE($2, avatar), name=COALESCE(NULLIF($3, ''), name)
         WHERE id=$4`,
        [decoded.uid, decoded.picture ?? null, decoded.name ?? "", user.id],
      );
      user = await getUserById(user.id);
    } else {
      const id = randomBytes(16).toString("hex");
      const referralCode = await findUniqueReferralCode();
      const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), BCRYPT_SALT_ROUNDS);
      await execute(
        `INSERT INTO users
          (id,name,email,password_hash,referral_code,avatar,firebase_uid,coins)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          id,
          decoded.name?.trim() || email.split("@")[0],
          email,
          passwordHash,
          referralCode,
          decoded.picture ?? null,
          decoded.uid,
          10,
        ],
      );
      user = await getUserById(id);
    }

    await createSession(user.id, res);
    return success(res, publicUser(user));
  } catch (error: any) {
    if (error?.message === "Firebase authentication is not configured") {
      return failure(res, 503, error.message);
    }
    return failure(res, 401, "Invalid Google identity token");
  }
});

router.put("/auth/change-password", requireAuth, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationError(res, parsed.error);

  const currentPassword = parsed.data.oldPassword ?? parsed.data.currentPassword!;
  try {
    const user = await queryOne<any>(
      "SELECT password_hash FROM users WHERE id=$1",
      [req.user!.id],
    );
    if (!user || !(await comparePassword(currentPassword, user.password_hash))) {
      return failure(res, 400, "Current password is incorrect");
    }
    await execute("UPDATE users SET password_hash=$1 WHERE id=$2", [
      await bcrypt.hash(parsed.data.newPassword, BCRYPT_SALT_ROUNDS),
      req.user!.id,
    ]);
    return success(res, { message: "Password changed" });
  } catch {
    return failure(res, 500, "Unable to change password");
  }
});

router.post("/auth/forgot-password", async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationError(res, parsed.error);

  try {
    const user = await queryOne<any>(
      "SELECT id,email FROM users WHERE LOWER(email)=LOWER($1)",
      [parsed.data.email.toLowerCase()],
    );

    // Avoid exposing whether an email is registered, but do fail explicitly
    // when the requested email service is not configured.
    if (user) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      await execute(
        "DELETE FROM password_reset_tokens WHERE user_id=$1 AND used_at IS NULL",
        [user.id],
      );
      await execute(
        `INSERT INTO password_reset_tokens (token_hash,user_id,expires_at)
         VALUES ($1,$2,NOW() + INTERVAL '1 hour')`,
        [tokenHash, user.id],
      );
      await sendPasswordResetEmail(user.email, token);
    }
    return success(res, { message: "If the account exists, a reset email has been sent" });
  } catch (error: any) {
    if (error?.message === "Password reset email is not configured") {
      return failure(res, 503, error.message);
    }
    return failure(res, 500, "Unable to send password reset email");
  }
});

router.post("/auth/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body ?? {});
  if (!parsed.success) return validationError(res, parsed.error);

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  try {
    const resetToken = await queryOne<any>(
      `SELECT user_id FROM password_reset_tokens
       WHERE token_hash=$1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash],
    );
    if (!resetToken) return failure(res, 400, "Invalid or expired reset token");

    await execute("UPDATE users SET password_hash=$1 WHERE id=$2", [
      await bcrypt.hash(parsed.data.newPassword, BCRYPT_SALT_ROUNDS),
      resetToken.user_id,
    ]);
    await execute(
      "UPDATE password_reset_tokens SET used_at=NOW() WHERE token_hash=$1",
      [tokenHash],
    );
    await execute("DELETE FROM sessions WHERE user_id=$1", [resetToken.user_id]);
    return success(res, { message: "Password reset" });
  } catch {
    return failure(res, 500, "Unable to reset password");
  }
});

export default router;