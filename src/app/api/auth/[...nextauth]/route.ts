import NextAuth, { AuthOptions, SessionStrategy } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { DBConnect } from '@/lib/utils/DBConnect';
import { User } from '@/lib/models/user';
import bcrypt from 'bcrypt';

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                await DBConnect();

                if (!credentials || !credentials.email || !credentials.password) {
                    throw new Error('Missing credentials');
                }

                const user = await User.findOne({ email: credentials.email });
                if (!user || user.status !== 'active') throw new Error('No user or inactive');
                const isValid = await bcrypt.compare(credentials.password, user.password_hash);
                if (!isValid) throw new Error('Invalid password');

                return {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],
    session: {
        strategy: "jwt"
    },
    callbacks: {
        async jwt({ token, user }: { token: any; user?: any }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            if (session.user) {
                session.user.id = token.id;
                session.user.role = token.role;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
