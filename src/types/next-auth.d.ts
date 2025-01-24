import { DefaultSession, DefaultUser } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      email: string;
      name: string;
      image?: string;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: string;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    email: string;
  }
} 