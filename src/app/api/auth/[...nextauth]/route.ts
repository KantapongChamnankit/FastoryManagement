import NextAuth, { AuthOptions, SessionStrategy } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { DBConnect } from '@/lib/utils/DBConnect';
import { User } from '@/lib/models/user';
import bcrypt from 'bcryptjs';
import * as UserService from "@/lib/services/UserService";
import { JWT } from 'next-auth/jwt';

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

                //make to string like this 2025-08-09T16:06:56.624Z
                console.log(user.updatedAt, new Date().toISOString());
                await UserService.updateUser(user._id.toString(), { updatedAt: new Date().toISOString() });

                return {
                    id: user._id.toString(),
                    name: `${user.first_name} ${user.last_name}`,
                    email: user.email,
                    role: user.role_id
                };
            },
        }),
    ],
    session: {
        strategy: "jwt"
    },
    callbacks: {
        async jwt({ token, user }: { token: JWT; user?: any }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.email = user.email;
                token.name = user.name;
            }
            return token;
        },
        async session({ session, token }: { session: any; token: any }) {
            // Always ensure the user object exists with all required fields
            session.user = {
                id: token.id,
                email: token.email || session.user?.email,
                name: token.name || session.user?.name,
                role: token.role
            };
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
