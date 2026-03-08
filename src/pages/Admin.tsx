import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import pb from '../lib/pocketbase';
import type { RecordModel } from 'pocketbase';

const DEV_AUTH_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';

interface ReceiptWithUser extends RecordModel {
    expand?: {
        user_id?: RecordModel;
    };
}

function Admin() {
    const [receipts, setReceipts] = useState<ReceiptWithUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const fetchReceipts = async () => {
        try {
            const records = await pb.collection('receipts').getFullList<ReceiptWithUser>({
                sort: '-created',
                expand: 'user_id',
            });
            setReceipts(records);
        } catch (err) {
            console.error('Error fetching receipts:', err);
            setError('Det gick inte att hämta kvitton.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (DEV_AUTH_BYPASS) {
            setReceipts([]);
            setIsLoading(false);
            return;
        }

        // TODO: Add role check here when implemented
        // if (user.role !== 'admin') {
        //     navigate('/dashboard');
        //     return;
        // }

        fetchReceipts();
    }, [user, navigate]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('sv-SE');
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

    const updateReceiptStatus = async (receiptId: string, newStatus: string) => {
        setUpdatingId(receiptId);
        try {
            await pb.collection('receipts').update(receiptId, {
                status: newStatus,
            });
            // Refresh the receipts list
            await fetchReceipts();
        } catch (err) {
            console.error('Error updating receipt status:', err);
            alert('Det gick inte att uppdatera kvittot.');
        } finally {
            setUpdatingId(null);
        }
    };

    const getReceiptImageUrl = (receipt: RecordModel) => {
        if (!receipt.receipt_image) return null;
        return pb.files.getUrl(receipt, receipt.receipt_image);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-base-100">
            {/* Header */}
            <div className="bg-base-200 shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold text-base-content">
                            Admin - Alla kvitton
                        </h1>
                        <div className="flex gap-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="btn btn-secondary btn-sm"
                            >
                                Till Dashboard
                            </button>
                            <button
                                onClick={handleLogout}
                                className="btn btn-secondary btn-sm"
                            >
                                Logga ut
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="card bg-base-100 shadow-xl overflow-hidden">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <p className="text-base-content/70">Laddar kvitton...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8">
                            <div className="alert alert-error">
                                <p className="text-sm">{error}</p>
                            </div>
                        </div>
                    ) : receipts.length === 0 ? (
                        <div className="p-8 text-center">
                            <p className="text-base-content/70">Inga kvitton finns ännu.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table w-full">
                                <thead className="bg-base-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-base-content uppercase tracking-wider">
                                            Användare
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bankuppgifter
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Datum
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Slabb
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Anledning
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Belopp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Åtgärder
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-base-300">
                                    {receipts.map((receipt) => {
                                        const userInfo = receipt.expand?.user_id;
                                        return (
                                            <tr key={receipt.id} className="hover:bg-base-200">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-base-content">
                                                        {userInfo?.name || userInfo?.email || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-base-content/70">
                                                        {userInfo?.email || ''}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-base-content">
                                                        {userInfo?.bank_name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-base-content/70">
                                                        {userInfo?.account_number || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-base-content">
                                                    {formatDate(receipt.date_for_slabb)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {receipt.slabb}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    <div className="max-w-xs truncate" title={receipt.anledning}>
                                                        {receipt.anledning}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {Number(receipt.amount).toFixed(2)} kr
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
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex flex-col gap-1">
                                                        {receipt.status === 'Pending' && (
                                                            <button
                                                                onClick={() =>
                                                                    updateReceiptStatus(receipt.id, 'Approved')
                                                                }
                                                                disabled={updatingId === receipt.id}
                                                                className="btn btn-success btn-xs"
                                                            >
                                                                {updatingId === receipt.id
                                                                    ? 'Uppdaterar...'
                                                                    : 'Godkänn'}
                                                            </button>
                                                        )}
                                                        {receipt.status === 'Approved' && (
                                                            <button
                                                                onClick={() =>
                                                                    updateReceiptStatus(receipt.id, 'Paid')
                                                                }
                                                                disabled={updatingId === receipt.id}
                                                                className="btn btn-info btn-xs"
                                                            >
                                                                {updatingId === receipt.id
                                                                    ? 'Uppdaterar...'
                                                                    : 'Markera betald'}
                                                            </button>
                                                        )}
                                                        {receipt.receipt_image && (
                                                            <a
                                                                href={getReceiptImageUrl(receipt) || '#'}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="btn btn-ghost btn-xs text-center"
                                                            >
                                                                Visa kvitto
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Admin;
