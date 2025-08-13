import NextAuth, { AuthOptions, SessionStrategy } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { DBConnect } from '@/lib/utils/DBConnect';
import { User } from '@/lib/models/user';
import bcrypt from 'bcryptjs';
import * as UserService from "@/lib/services/UserService";
import { JWT } from 'next-auth/jwt';

import mongoose from 'mongoose';

// Debug environment variables
console.log('NextAuth Config Check:');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET);
console.log('GOOGLE_CLIENT_ID starts with:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                    scope: "openid email profile"
                }
            },
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                }
            },
        }),
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
                const isValid = await bcrypt.compare(credentials.password, user.password_hash as any);
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
        async signIn({ user, account, profile }) {
            if (account?.provider === 'google') {
                try {
                    await DBConnect();

                    // Check if user already exists
                    let existingUser = await User.findOne({ email: user.email });

                    if (existingUser) {
                        if (!existingUser.google_id && existingUser.status === 'active') {
                            await UserService.updateUser(existingUser._id.toString(), {
                                updatedAt: new Date().toISOString()
                            });
                            return true;
                        } else if (existingUser.status !== 'active') {
                            return "redirect?error=OAuthSignin";
                        }
                    }

                    return "redirect?error=OAuthCreateAccount";
                } catch (error) {
                    console.error('Google OAuth sign-in error:', error);
                    return "redirect?error=OAuthCallback";
                }
            }

            return true;
        },
        async jwt({ token, user, account }: { token: JWT; user?: any; account?: any }) {
            if (account?.provider === 'google' && user) {
                await DBConnect();
                const dbUser = await User.findOne({ email: user.email });
                if (dbUser) {
                    token.id = dbUser._id.toString();
                    token.role = dbUser.role_id;
                    token.email = dbUser.email;
                    token.name = `${dbUser.first_name} ${dbUser.last_name}`;
                }
            } else if (user) {
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
