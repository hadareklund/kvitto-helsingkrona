import { useState, useEffect } from 'react';
import pb from '../lib/pocketbase';
import { ensureReceiptUserForPasswordSetup } from '../lib/receiptUserProvisioning';
import type { RecordModel } from 'pocketbase';

const DEV_AUTH_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';
const DEV_AUTH_STORAGE_KEY = 'kvitto_dev_auth_user';

function createDevUser(email: string): RecordModel {
    const now = new Date().toISOString();
    return {
        id: 'dev-user',
        collectionId: 'dev',
        collectionName: 'receipt_user',
        created: now,
        updated: now,
        email,
        name: 'Utvecklare',
        role: 'admin',
    } as unknown as RecordModel;
}

interface AuthState {
    user: RecordModel | null;
    isLoading: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>(() => {
        if (DEV_AUTH_BYPASS) {
            const storedUser = localStorage.getItem(DEV_AUTH_STORAGE_KEY);
            return {
                user: storedUser ? (JSON.parse(storedUser) as RecordModel) : null,
                isLoading: false,
            };
        }

        return {
            user: pb.authStore.model,
            isLoading: false,
        };
    });

    useEffect(() => {
        if (DEV_AUTH_BYPASS) {
            return;
        }

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
        if (DEV_AUTH_BYPASS) {
            const devUser = createDevUser(email || 'dev@helsingkrona.se');
            localStorage.setItem(DEV_AUTH_STORAGE_KEY, JSON.stringify(devUser));
            setAuthState({
                user: devUser,
                isLoading: false,
            });
            return { success: true, user: devUser };
        }

        try {
            const authData = await pb.collection('receipt_user').authWithPassword(email, password);
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
        if (DEV_AUTH_BYPASS) {
            localStorage.removeItem(DEV_AUTH_STORAGE_KEY);
            setAuthState({
                user: null,
                isLoading: false,
            });
            return;
        }

        pb.authStore.clear();
        setAuthState({
            user: null,
            isLoading: false,
        });
    };

    const requestPasswordSetup = async (email: string) => {
        if (DEV_AUTH_BYPASS) {
            return { success: true };
        }

        try {
            const setupResult = await ensureReceiptUserForPasswordSetup(email);
            if (!setupResult.foundInUsers) {
                // Keep the response generic to avoid exposing which emails exist.
                return { success: true };
            }

            await pb.collection('receipt_user').requestPasswordReset(email.trim().toLowerCase());
            return { success: true };
        } catch (error) {
            console.error('Password setup request error:', error);
            return { success: false, error };
        }
    };

    return {
        user: authState.user,
        isLoading: authState.isLoading,
        isAuthenticated: !!authState.user,
        login,
        requestPasswordSetup,
        logout,
    };
}
