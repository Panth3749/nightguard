import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  tokenId?: string;
  routerId?: string;
}

export function signToken(payload: JwtPayload, secret: string, expiresIn: string | number = '7d'): string {
  const options: SignOptions = {
    expiresIn: expiresIn as unknown as SignOptions['expiresIn'],
    issuer: 'nightguard-auth',
  };
  return jwt.sign(payload, secret, options);
}

export function verifyToken<T = JwtPayload>(token: string, secret: string): T {
  return jwt.verify(token, secret, { issuer: 'nightguard-auth' }) as T;
}
