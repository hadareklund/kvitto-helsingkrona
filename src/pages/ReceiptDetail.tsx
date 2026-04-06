import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import pb from '../lib/pocketbase';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import type { RecordModel } from 'pocketbase';

interface ReceiptUserRecord extends RecordModel {
    name?: string;
    email?: string;
    bank_name?: string;
    account_number?: string;
}

interface ReceiptWithUser extends RecordModel {
    expand?: {
        user_id?: ReceiptUserRecord;
    };
}

function ReceiptDetail() {
    const { receiptId } = useParams();
    const navigate = useNavigate();
    const { user, logout, isLoading: isAuthLoading } = useAuth();
    const { tr, locale } = useLanguage();
    const [receipt, setReceipt] = useState<ReceiptWithUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }

        if (!receiptId) {
            setError(tr('Saknar kvitto-ID.', 'Missing receipt ID.'));
            setIsLoading(false);
            return;
        }

        const fetchReceipt = async () => {
            try {
                const record = await pb.collection('receipts').getOne<ReceiptWithUser>(receiptId, {
                    expand: 'user_id',
                });

                const receiptUserId =
                    typeof record.user_id === 'string' ? record.user_id : record.expand?.user_id?.id;
                const role = String(user.role || '').toLowerCase();
                const hasAdminViewAccess = role === 'admin' || role === 'pqe';

                if (!hasAdminViewAccess && receiptUserId !== user.id) {
                    navigate('/dashboard');
                    return;
                }

                setReceipt(record);
            } catch (err) {
                console.error('Error fetching receipt details:', err);
                setError(tr('Det gick inte att hämta kvittot.', 'Could not fetch the receipt.'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchReceipt();
    }, [receiptId, user, isAuthLoading, navigate]);

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

    const getReceiptImageUrl = (record: RecordModel) => {
        if (!record.receipt_image) {
            return null;
        }

        const fileName = String(record.receipt_image);
        const collectionId = String(record.collectionId || '');

        if (!collectionId || !record.id) {
            return null;
        }

        return `/api/files/${collectionId}/${record.id}/${encodeURIComponent(fileName)}?token=`;
    };

    const isImageFile = (filename: string) => {
        const ext = filename.toLowerCase().split('.').pop();
        return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
    };

    const isPdfFile = (filename: string) => {
        return filename.toLowerCase().endsWith('.pdf');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const role = String(user?.role || '').toLowerCase();
    const hasAdminViewAccess = role === 'admin' || role === 'pqe';
    const submittedByUser = receipt?.expand?.user_id;
    const submittedByUserId =
        typeof receipt?.user_id === 'string' ? receipt.user_id : submittedByUser?.id;

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
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-base-content">{tr('Kvitto-detaljer', 'Receipt details')}</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="btn btn-secondary btn-sm"
                        >
                            {tr('Tillbaka', 'Back')}
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

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="card bg-base-100 shadow-xl p-8 text-center">
                        <p className="text-base-content/70">{tr('Laddar kvitto...', 'Loading receipt...')}</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-error">
                        <span>{error}</span>
                    </div>
                ) : !receipt ? (
                    <div className="alert alert-warning">
                        <span>{tr('Kvittot kunde inte hittas.', 'Receipt could not be found.')}</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title">{tr('Information', 'Information')}</h2>
                                <div className="divider my-1" />
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-base-content/70">{tr('Datum', 'Date')}</span>
                                        <span className="font-medium">{formatDate(receipt.date_for_slabb)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-base-content/70">Slabb</span>
                                        <span className="font-medium">{String(receipt.slabb || '-')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-base-content/70">{tr('Belopp', 'Amount')}</span>
                                        <span className="font-medium">{Number(receipt.amount || 0).toFixed(2)} {tr('kr', 'SEK')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-base-content/70">Status</span>
                                        <span className={getStatusBadgeColor(String(receipt.status || ''))}>
                                            {String(receipt.status || '-')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-base-content/70">{tr('Kvittonummer', 'Receipt number')}</span>
                                        <span className="font-medium">{String(receipt.receipt_number || '-')}</span>
                                    </div>
                                    <div className="rounded-box bg-base-200 p-3">
                                        <p className="text-sm text-base-content/70 mb-1">{tr('Anledning', 'Reason')}</p>
                                        <p className="text-sm">{String(receipt.anledning || '-')}</p>
                                    </div>

                                    <div className="divider my-1" />

                                    <div className="rounded-box bg-base-200 p-3 space-y-2">
                                        <p className="text-sm text-base-content/70">{tr('Inskickat av', 'Submitted by')}</p>
                                        <p className="font-medium">{String(submittedByUser?.name || submittedByUser?.email || '-')}</p>
                                        {submittedByUser?.email && (
                                            <p className="text-sm text-base-content/80 break-all">{String(submittedByUser.email)}</p>
                                        )}
                                    </div>

                                    <div className="rounded-box bg-base-200 p-3 space-y-2">
                                        <p className="text-sm text-base-content/70">{tr('Bankuppgifter', 'Bank details')}</p>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-sm text-base-content/70">{tr('Bank', 'Bank')}</span>
                                            <span className="font-medium">{String(submittedByUser?.bank_name || '-')}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-sm text-base-content/70">{tr('Kontonummer', 'Account number')}</span>
                                            <span className="font-medium">{String(submittedByUser?.account_number || '-')}</span>
                                        </div>
                                    </div>

                                    {hasAdminViewAccess && submittedByUserId && (
                                        <button
                                            onClick={() => navigate(`/admin/users/${submittedByUserId}`)}
                                            className="btn btn-primary btn-sm w-full"
                                        >
                                            {tr('Öppna användarprofil', 'Open user profile')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title">{tr('Kvitto-bild', 'Receipt image')}</h2>
                                <div className="divider my-1" />
                                {getReceiptImageUrl(receipt) ? (
                                    <>
                                        {isPdfFile(String(receipt.receipt_image)) ? (
                                            <div className="rounded-box bg-base-200 p-3">
                                                <iframe
                                                    src={getReceiptImageUrl(receipt) || ''}
                                                    title="Kvitto PDF"
                                                    className="w-full rounded-lg h-[70vh]"
                                                />
                                            </div>
                                        ) : isImageFile(String(receipt.receipt_image)) ? (
                                            <figure className="rounded-box bg-base-200 p-3">
                                                <img
                                                    src={getReceiptImageUrl(receipt) || ''}
                                                    alt="Kvitto"
                                                    className="w-full rounded-lg object-contain max-h-[70vh]"
                                                />
                                            </figure>
                                        ) : (
                                            <div className="alert alert-info">
                                                <span>{tr('Filformat stöds ej for förhandsgranskning.', 'File format is not supported for preview.')}</span>
                                            </div>
                                        )}
                                        <a
                                            href={getReceiptImageUrl(receipt) || '#'}
                                            target="_blänk"
                                            rel="noopener noreferrer"
                                            className="btn btn-ghost btn-sm mt-3"
                                        >
                                            {tr('Öppna fil i ny flik', 'Open file in new tab')}
                                        </a>
                                    </>
                                ) : (
                                    <div className="alert alert-info">
                                        <span>{tr('Ingen kvitto-bild uppladdad.', 'No receipt image uploaded.')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ReceiptDetail;
