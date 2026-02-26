import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const WEAK_DEFAULT = "your-secret-key-change-in-production";
const JWT_SECRET = process.env.JWT_SECRET || WEAK_DEFAULT;
const JWT_EXPIRES_IN = "7d";

// Hard-fail in production if JWT_SECRET is using the insecure default
if (process.env.NODE_ENV === "production" && JWT_SECRET === WEAK_DEFAULT) {
  throw new Error("JWT_SECRET environment variable must be set in production!");
}

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}
