import jwt from 'jsonwebtoken';

export interface AuthenticData {
    userId: string;
    userName: string;
    email: string;   
}

export function verifyToken(token: string): AuthenticData | null {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is not defined in environment variables");
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;

        return {
            userId: decoded.userId,
            userName: decoded.userName,
            email: decoded.email
        };
    }
    catch (e) {
        console.log('Token verification failed', e);
        return null;
    }
}