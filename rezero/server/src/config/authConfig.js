import { env } from "#config/envConfig.js";

export const authConfig = {
  jwtSecret: env.jwtSecret || "default_jwt_secret",
  jwtExpiresIn: env.jwtExpiresIn,
  tokenRedisTTL: 3600,
  saltRounds: 10,
};
