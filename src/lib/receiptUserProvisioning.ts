import pb from './pocketbase';
import type { RecordModel } from 'pocketbase';

interface UsersRecord extends RecordModel {
    firstname?: string;
    lastname?: string;
    username?: string;
    email?: string;
}

interface EnsureReceiptUserResult {
    foundInUsers: boolean;
    receiptUser: RecordModel | null;
}

function escapeFilterValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\"/g, '\\"');
}

function buildDisplayName(user: UsersRecord, email: string): string {
    const first = String(user.firstname || '').trim();
    const last = String(user.lastname || '').trim();
    const fullName = `${first} ${last}`.trim();
    if (fullName) {
        return fullName;
    }

    const username = String(user.username || '').trim();
    if (username) {
        return username;
    }

    return email.split('@')[0] || email;
}

export async function ensureReceiptUserForPasswordSetup(email: string): Promise<EnsureReceiptUserResult> {
    const normalizedEmail = email.trim().toLowerCase();
    const escapedEmail = escapeFilterValue(normalizedEmail);

    const usersResult = await pb.collection('users').getList<UsersRecord>(1, 1, {
        filter: `email = "${escapedEmail}"`,
    });

    if (usersResult.totalItems === 0) {
        return {
            foundInUsers: false,
            receiptUser: null,
        };
    }

    const sourceUser = usersResult.items[0];
    const receiptUserResult = await pb.collection('receipt_user').getList<RecordModel>(1, 1, {
        filter: `email = "${escapedEmail}"`,
    });

    if (receiptUserResult.totalItems > 0) {
        return {
            foundInUsers: true,
            receiptUser: receiptUserResult.items[0],
        };
    }

    const tempPassword = `Tmp!${crypto.randomUUID().replace(/-/g, '')}`;
    const created = await pb.collection('receipt_user').create({
        email: normalizedEmail,
        password: tempPassword,
        passwordConfirm: tempPassword,
        name: buildDisplayName(sourceUser, normalizedEmail),
        role: 'user',
    });

    return {
        foundInUsers: true,
        receiptUser: created,
    };
}