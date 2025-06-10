import { signIn, signOut } from "next-auth/react";

class AuthService {
    private static instance: AuthService;
    
    private constructor() {
    }
    
    public static getInstance(): AuthService {
        if (!AuthService.instance) {
        AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    
    public async credentialsLogin(username: string, password: string): Promise<boolean> {
        const response = await signIn("credentials", {
            redirect: false,
            email: username,
            password: password,
        })

        if (response?.error) {
            console.error("Login failed:", response.error);
            return false;
        }

        if (response?.ok) {
            console.log("Login successful");
            return true;
        }

        return false;
    }
    
    public logout(): void {
        signOut()
    }
}

export default AuthService.getInstance();