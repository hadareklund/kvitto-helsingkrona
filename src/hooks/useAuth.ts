import { useState, useEffect } from 'react';
import pb from '../lib/pocketbase';
import type { RecordModel } from 'pocketbase';

interface AuthState {
    user: RecordModel | null;
    isLoading: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        user: pb.authStore.model,
        isLoading: true,
    });

    useEffect(() => {
        // Initial auth state
        setAuthState({
            user: pb.authStore.model,
            isLoading: false,
        });

        // Listen for auth changes
        const unsubscribe = pb.authStore.onChange((_token, model) => {
            setAuthState({
                user: model,
                isLoading: false,
            });
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const authData = await pb.collection('users').authWithPassword(email, password);
            setAuthState({
                user: authData.record,
                isLoading: false,
            });
            return { success: true, user: authData.record };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error };
        }
    };

    const logout = () => {
        pb.authStore.clear();
        setAuthState({
            user: null,
            isLoading: false,
        });
    };

    return {
        user: authState.user,
        isLoading: authState.isLoading,
        isAuthenticated: !!authState.user,
        login,
        logout,
    };
}
