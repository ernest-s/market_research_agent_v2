import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

export type IdTokenPayload = {
  sub: string;
  email: string;
  email_verified?: boolean;
};

const client = jwksClient({
  jwksUri: `${process.env.AUTH0_ISSUER_BASE_URL}/.well-known/jwks.json`,
  cache: true,
  rateLimit: true,
});

export function verifyIdToken(token: string): Promise<IdTokenPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      (header, callback) => {
        if (!header.kid) {
          return callback(new Error("Missing kid in token header"));
        }
        client.getSigningKey(header.kid, (err, key) => {
          if (err) return callback(err);
          callback(null, key!.getPublicKey());
        });
      },
      {
        audience: process.env.AUTH0_CLIENT_ID,
        issuer: `${process.env.AUTH0_ISSUER_BASE_URL}/`,
        algorithms: ["RS256"],
      },
      (err, decoded) => {
        if (err) return reject(err);
        const payload = decoded as IdTokenPayload;
        if (!payload?.sub || !payload?.email) {
          return reject(new Error("Missing required claims in token"));
        }
        resolve(payload);
      }
    );
  });
}
