import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import pb from '../lib/pocketbase';
import { useLanguage } from '../i18n/LanguageContext';
import type { RecordModel } from 'pocketbase';

const DEV_AUTH_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';

function Dashboard() {
    const [receipts, setReceipts] = useState<RecordModel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, logout, isLoading: isAuthLoading } = useAuth();
    const { tr, locale } = useLanguage();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }

        if (DEV_AUTH_BYPASS) {
            setReceipts([]);
            setIsLoading(false);
            return;
        }

        const fetchReceipts = async () => {
            try {
                const records = await pb.collection('receipts').getFullList({
                    filter: `user_id = "${user.id}"`,
                    sort: '-created',
                });
                setReceipts(records);
            } catch (err) {
                console.error('Error fetching receipts:', err);
                setError(tr('Det gick inte att hämta dina kvitton.', 'Could not fetch your receipts.'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchReceipts();
    }, [user, navigate, isAuthLoading]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString(locale);
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'Pending':
                return 'badge badge-warning';
            case 'Paid':
                return 'badge badge-success';
            case 'Bokförd':
                return 'badge badge-info';
            default:
                return 'badge';
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
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

    const role = String(user.role || '').toLowerCase();
    const hasAdminViewAccess = role === 'admin' || role === 'pqe';

    return (
        <div className="min-h-screen bg-base-100">
            {/* Header */}
            <div className="bg-base-200 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-base-content">
                            {tr('Mina kvitton', 'My receipts')}
                        </h1>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/submit')}
                                className="btn btn-primary btn-sm"
                            >
                                {tr('Skicka in nytt kvitto', 'Submit new receipt')}
                            </button>
                            <button
                                onClick={() => navigate('/settings')}
                                className="btn btn-outline btn-sm"
                            >
                                {tr('Inställningar', 'Settings')}
                            </button>
                            {hasAdminViewAccess && (
                                <button
                                    onClick={() => navigate('/admin')}
                                    className="btn btn-secondary btn-sm"
                                >
                                    Admin
                                </button>
                            )}
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

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="card bg-base-100 shadow-xl">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <p className="text-base-content/70">{tr('Laddar kvitton...', 'Loading receipts...')}</p>
                        </div>
                    ) : error ? (
                        <div className="p-8">
                            <div className="alert alert-error">
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    ) : receipts.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-base-content/70 mb-4">
                                {tr('Du har inga kvitton ännu.', 'You have no receipts yet.')}
                            </p>
                            <button
                                onClick={() => navigate('/submit')}
                                className="btn btn-primary btn-sm"
                            >
                                {tr('Skicka in ditt första kvitto', 'Submit your first receipt')}
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-base-content uppercase tracking-wider">
                                            {tr('Datum', 'Date')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-base-content uppercase tracking-wider">
                                            Slabb
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-base-content uppercase tracking-wider">
                                            {tr('Anledning', 'Reason')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-base-content uppercase tracking-wider">
                                            {tr('Belopp', 'Amount')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-base-content uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-base-300">
                                    {receipts.map((receipt) => (
                                        <tr
                                            key={receipt.id}
                                            className="hover:bg-base-200 cursor-pointer"
                                            onClick={() => navigate(`/receipt/${receipt.id}`)}
                                            title={tr('Klicka för att se kvitto-detaljer', 'Click to view receipt details')}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content">
                                                {formatDate(receipt.date_for_slabb)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content">
                                                {receipt.slabb}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-base-content">
                                                {receipt.anledning}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content">
                                                {Number(receipt.amount).toFixed(2)} {tr('kr', 'SEK')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(
                                                        receipt.status
                                                    )}`}
                                                >
                                                    {receipt.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
