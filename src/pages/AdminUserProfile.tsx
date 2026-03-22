import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import pb from '../lib/pocketbase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import type { RecordModel } from 'pocketbase';

interface ReceiptWithUser extends RecordModel {
    expand?: {
        user_id?: RecordModel;
    };
}

function AdminUserProfile() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user, logout, isLoading: isAuthLoading } = useAuth();
    const { tr, locale } = useLanguage();

    const [profile, setProfile] = useState<RecordModel | null>(null);
    const [receipts, setReceipts] = useState<ReceiptWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [copyMessage, setCopyMessage] = useState('');

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }

        const role = String(user.role || '').toLowerCase();
        const hasAdminViewAccess = role === 'admin' || role === 'pqs';
        if (!hasAdminViewAccess) {
            navigate('/dashboard');
            return;
        }

        if (!userId) {
            setError(tr('Saknar användar-ID.', 'Missing user ID.'));
            setIsLoading(false);
            return;
        }

        const fetchUserProfile = async () => {
            try {
                const [userRecord, receiptRecords] = await Promise.all([
                    pb.collection('receipt_user').getOne(userId),
                    pb.collection('receipts').getFullList<ReceiptWithUser>({
                        filter: `user_id = "${userId}"`,
                        sort: '-created',
                        expand: 'user_id',
                    }),
                ]);

                setProfile(userRecord);
                setReceipts(receiptRecords);
            } catch (err) {
                console.error('Error fetching user profile:', err);
                setError(tr('Det gick inte att hämta användarprofilen.', 'Could not fetch the user profile.'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserProfile();
    }, [userId, user, isAuthLoading, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(locale);
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'Pending':
                return 'badge badge-warning';
            case 'Approved':
                return 'badge badge-success';
            case 'Paid':
                return 'badge badge-info';
            default:
                return 'badge';
        }
    };

    const copyToClipboard = async (label: string, value: string) => {
        if (!value) {
            return;
        }

        try {
            await navigator.clipboard.writeText(value);
            setCopyMessage(`${label} ${tr('kopierat', 'copied')}`);
            window.setTimeout(() => setCopyMessage(''), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
            setCopyMessage(tr('Kunde inte kopiera', 'Could not copy'));
            window.setTimeout(() => setCopyMessage(''), 2000);
        }
    };

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-base-100 flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-base-100">
            <div className="bg-base-200 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-base-content">Användarprofil</h1>
                        <h1 className="text-2xl font-bold text-base-content">{tr('Användarprofil', 'User profile')}</h1>
                        <div className="flex gap-2">
                            <button
                                onClick={() => navigate('/admin')}
                                className="btn btn-secondary btn-sm"
                            >
                                {tr('Till admin', 'To admin')}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="btn btn-secondary btn-sm"
                            >
                                {tr('Logga ut', 'Log out')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {isLoading ? (
                    <div className="card bg-base-100 shadow-xl p-8 text-center">
                        <p className="text-base-content/70">{tr('Laddar profil...', 'Loading profile...')}</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-error">
                        <span>{error}</span>
                    </div>
                ) : !profile ? (
                    <div className="alert alert-warning">
                        <span>{tr('Användaren kunde inte hittas.', 'User could not be found.')}</span>
                    </div>
                ) : (
                    <>
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title">{tr('Användaruppgifter', 'User details')}</h2>
                                <div className="divider my-1" />

                                {copyMessage && (
                                    <div className="alert alert-success py-2 text-sm">
                                        <span>{copyMessage}</span>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                                    <div className="rounded-box bg-base-200 p-3">
                                        <p className="text-sm text-base-content/70">{tr('Namn', 'Name')}</p>
                                        <p className="font-medium">{String(profile.name || '-')}</p>
                                    </div>

                                    <div className="rounded-box bg-base-200 p-3">
                                        <p className="text-sm text-base-content/70">{tr('E-post', 'Email')}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium break-all">{String(profile.email || '-')}</p>
                                            {profile.email && (
                                                <button
                                                    className="btn btn-ghost btn-xs"
                                                    onClick={() =>
                                                        copyToClipboard(tr('E-post', 'Email'), String(profile.email || ''))
                                                    }
                                                >
                                                    {tr('Kopiera', 'Copy')}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-box bg-base-200 p-3">
                                        <p className="text-sm text-base-content/70">{tr('Bank', 'Bank')}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{String(profile.bank_name || '-')}</p>
                                            {profile.bank_name && (
                                                <button
                                                    className="btn btn-ghost btn-xs"
                                                    onClick={() =>
                                                        copyToClipboard(tr('Bank', 'Bank'), String(profile.bank_name || ''))
                                                    }
                                                >
                                                    {tr('Kopiera', 'Copy')}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-box bg-base-200 p-3">
                                        <p className="text-sm text-base-content/70">{tr('Kontonummer', 'Account number')}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{String(profile.account_number || '-')}</p>
                                            {profile.account_number && (
                                                <button
                                                    className="btn btn-ghost btn-xs"
                                                    onClick={() =>
                                                        copyToClipboard(
                                                            tr('Kontonummer', 'Account number'),
                                                            String(profile.account_number || '')
                                                        )
                                                    }
                                                >
                                                    {tr('Kopiera', 'Copy')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl overflow-hidden">
                            <div className="card-body p-0">
                                <div className="p-6 pb-2">
                                    <h2 className="card-title">{tr('Kvittohistorik (dashboard-vy)', 'Receipt history (dashboard view)')}</h2>
                                </div>

                                {receipts.length === 0 ? (
                                    <div className="px-6 pb-6 text-base-content/70">{tr('Inga kvitton hittades.', 'No receipts found.')}</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra w-full">
                                            <thead className="bg-base-200">
                                                <tr>
                                                    <th>Datum</th>
                                                    <th>Slabb</th>
                                                    <th>Anledning</th>
                                                    <th>Belopp</th>
                                                    <th>Status</th>
                                                    <th>Detaljer</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {receipts.map((receipt) => (
                                                    <tr
                                                        key={receipt.id}
                                                        className="hover:bg-base-200 cursor-pointer"
                                                        onClick={() => navigate(`/receipt/${receipt.id}`)}
                                                        title="Klicka för att se kvitto-detaljer"
                                                    >
                                                        <td>{formatDate(String(receipt.date_for_slabb || ''))}</td>
                                                        <td>{String(receipt.slabb || '-')}</td>
                                                        <td>
                                                            <div
                                                                className="max-w-xs truncate"
                                                                title={String(receipt.anledning || '')}
                                                            >
                                                                {String(receipt.anledning || '-')}
                                                            </div>
                                                        </td>
                                                        <td>{Number(receipt.amount || 0).toFixed(2)} kr</td>
                                                        <td>
                                                            <span className={getStatusBadgeColor(String(receipt.status || ''))}>
                                                                {String(receipt.status || '-')}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="btn btn-ghost btn-xs"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigate(`/receipt/${receipt.id}`);
                                                                }}
                                                            >
                                                                {tr('Öppna', 'Open')}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default AdminUserProfile;
