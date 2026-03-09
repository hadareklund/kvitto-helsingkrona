import { useState, useEffect, useMemo } from 'react';
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
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUserId, setSelectedUserId] = useState('');
    const { user, logout, isLoading: isAuthLoading } = useAuth();
    const navigate = useNavigate();

    const users = useMemo(() => {
        const uniqueUsers = new Map<string, { id: string; name: string; email: string }>();

        receipts.forEach((receipt) => {
            const expandedUser = receipt.expand?.user_id;
            const userId = expandedUser?.id || String(receipt.user_id || '');

            if (!userId || uniqueUsers.has(userId)) {
                return;
            }

            uniqueUsers.set(userId, {
                id: userId,
                name: String(expandedUser?.name || ''),
                email: String(expandedUser?.email || ''),
            });
        });

        return Array.from(uniqueUsers.values()).sort((a, b) => {
            const aLabel = a.name || a.email;
            const bLabel = b.name || b.email;
            return aLabel.localeCompare(bLabel, 'sv');
        });
    }, [receipts]);

    const filteredUsers = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return users;
        }

        return users.filter((u) => {
            const name = u.name.toLowerCase();
            const email = u.email.toLowerCase();
            return name.includes(query) || email.includes(query);
        });
    }, [users, searchQuery]);

    const filteredReceipts = useMemo(() => {
        if (!selectedUserId) {
            return receipts;
        }

        return receipts.filter((receipt) => {
            const expandedUserId = receipt.expand?.user_id?.id;
            const relationUserId = typeof receipt.user_id === 'string' ? receipt.user_id : '';
            return expandedUserId === selectedUserId || relationUserId === selectedUserId;
        });
    }, [receipts, selectedUserId]);

    const selectedUser = useMemo(
        () => users.find((u) => u.id === selectedUserId),
        [users, selectedUserId]
    );

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

        // TODO: Add role check here when implemented
        // if (user.role !== 'admin') {
        //     navigate('/dashboard');
        //     return;
        // }

        fetchReceipts();
    }, [user, navigate, isAuthLoading]);

    useEffect(() => {
        if (selectedUserId && !users.some((u) => u.id === selectedUserId)) {
            setSelectedUserId('');
        }
    }, [users, selectedUserId]);

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
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <label className="form-control w-full md:col-span-2">
                                    <span className="label-text">Sok anvandare (namn eller e-post)</span>
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Exempel: Erik eller erik@..."
                                        className="input input-bordered w-full"
                                    />
                                </label>

                                <label className="form-control w-full">
                                    <span className="label-text">Vald anvandare</span>
                                    <select
                                        className="select select-bordered w-full"
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                    >
                                        <option value="">Visa alla</option>
                                        {filteredUsers.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name || u.email} {u.email ? `(${u.email})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            {selectedUser && (
                                <div className="alert alert-info">
                                    <span>
                                        Visar kvittohistorik for: {selectedUser.name || selectedUser.email}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs"
                                            onClick={() => navigate(`/admin/users/${selectedUser.id}`)}
                                        >
                                            Oppna profil
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs"
                                            onClick={() => setSelectedUserId('')}
                                        >
                                            Rensa filter
                                        </button>
                                    </div>
                                </div>
                            )}

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
                                        {filteredReceipts.map((receipt) => {
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
                                                        {userInfo?.id && (
                                                            <button
                                                                type="button"
                                                                className="btn btn-ghost btn-xs mt-1"
                                                                onClick={() => navigate(`/admin/users/${userInfo.id}`)}
                                                            >
                                                                Oppna profil
                                                            </button>
                                                        )}
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

                                {filteredReceipts.length === 0 && (
                                    <div className="py-8 text-center text-base-content/70">
                                        Inga kvitton hittades for vald anvandare.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Admin;
