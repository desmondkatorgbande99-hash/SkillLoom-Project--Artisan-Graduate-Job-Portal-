import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth";

export interface AuthTokenPayload {
  userId: string;
  role: "EMPLOYER" | "GRADUATE" | "ARTISAN" | "ADMIN";
}

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, authConfig.jwtSecret, {
    expiresIn: authConfig.jwtExpiresIn as jwt.SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, authConfig.jwtSecret) as AuthTokenPayload;
}