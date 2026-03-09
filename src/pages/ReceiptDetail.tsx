import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import pb from '../lib/pocketbase';
import { useAuth } from '../hooks/useAuth';
import type { RecordModel } from 'pocketbase';

interface ReceiptWithUser extends RecordModel {
    expand?: {
        user_id?: RecordModel;
    };
}

function ReceiptDetail() {
    const { receiptId } = useParams();
    const navigate = useNavigate();
    const { user, logout, isLoading: isAuthLoading } = useAuth();
    const [receipt, setReceipt] = useState<ReceiptWithUser | null>(null);
    const [fileToken, setFileToken] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [useFallbackUrl, setUseFallbackUrl] = useState(false);

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }

        if (!receiptId) {
            setError('Saknar kvitto-ID.');
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
                const isAdmin = String(user.role || '').toLowerCase() === 'admin';

                if (!isAdmin && receiptUserId !== user.id) {
                    navigate('/dashboard');
                    return;
                }

                // Needed when PocketBase files are protected by API rules.
                const token = await pb.files.getToken().catch(() => '');
                setFileToken(token);
                setReceipt(record);
            } catch (err) {
                console.error('Error fetching receipt details:', err);
                setError('Det gick inte att hamta kvittot.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchReceipt();
    }, [receiptId, user, isAuthLoading, navigate]);

    useEffect(() => {
        setUseFallbackUrl(false);
    }, [receiptId]);

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

    const getReceiptImageUrl = (record: RecordModel) => {
        const rawFile = record.receipt_image;
        if (!rawFile) {
            return null;
        }

        const fileName = Array.isArray(rawFile) ? rawFile[0] : String(rawFile);
        if (!fileName) {
            return null;
        }

        return pb.files.getUrl(record, fileName, fileToken ? { token: fileToken } : {});
    };

    const getReceiptImageFallbackUrl = (record: RecordModel) => {
        const fileName = getReceiptFileName(record);
        if (!fileName) {
            return null;
        }

        const params = new URLSearchParams();
        if (fileToken) {
            params.set('token', fileToken);
        }

        const queryString = params.toString();
        return `/api/files/${record.collectionId}/${record.id}/${encodeURIComponent(fileName)}${
            queryString ? `?${queryString}` : ''
        }`;
    };

    const getReceiptFileName = (record: RecordModel) => {
        const rawFile = record.receipt_image;
        if (!rawFile) {
            return '';
        }

        if (Array.isArray(rawFile)) {
            return String(rawFile[0] || '');
        }

        return String(rawFile);
    };

    const getReceiptFileKind = (record: RecordModel) => {
        const fileName = getReceiptFileName(record).toLowerCase();

        if (fileName.endsWith('.pdf')) {
            return 'pdf';
        }

        return 'image';
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
            <div className="bg-base-200 shadow">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-base-content">Kvitto-detaljer</h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="btn btn-secondary btn-sm"
                        >
                            Tillbaka
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

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="card bg-base-100 shadow-xl p-8 text-center">
                        <p className="text-base-content/70">Laddar kvitto...</p>
                    </div>
                ) : error ? (
                    <div className="alert alert-error">
                        <span>{error}</span>
                    </div>
                ) : !receipt ? (
                    <div className="alert alert-warning">
                        <span>Kvittot kunde inte hittas.</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title">Information</h2>
                                <div className="divider my-1" />
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-base-content/70">Datum</span>
                                        <span className="font-medium">{formatDate(receipt.date_for_slabb)}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-base-content/70">Slabb</span>
                                        <span className="font-medium">{String(receipt.slabb || '-')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-base-content/70">Belopp</span>
                                        <span className="font-medium">{Number(receipt.amount || 0).toFixed(2)} kr</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-base-content/70">Status</span>
                                        <span className={getStatusBadgeColor(String(receipt.status || ''))}>
                                            {String(receipt.status || '-')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-base-content/70">Kvittonummer</span>
                                        <span className="font-medium">{String(receipt.receipt_number || '-')}</span>
                                    </div>
                                    <div className="rounded-box bg-base-200 p-3">
                                        <p className="text-sm text-base-content/70 mb-1">Anledning</p>
                                        <p className="text-sm">{String(receipt.anledning || '-')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card bg-base-100 shadow-xl">
                            <div className="card-body">
                                <h2 className="card-title">Kvitto-bild</h2>
                                <div className="divider my-1" />
                                {(getReceiptImageUrl(receipt) || getReceiptImageFallbackUrl(receipt)) ? (
                                    <>
                                        {getReceiptFileKind(receipt) === 'pdf' ? (
                                            <div className="rounded-box bg-base-200 p-3">
                                                <iframe
                                                    src={
                                                        (useFallbackUrl
                                                            ? getReceiptImageFallbackUrl(receipt)
                                                            : getReceiptImageUrl(receipt)) ||
                                                        getReceiptImageFallbackUrl(receipt) ||
                                                        ''
                                                    }
                                                    title="Kvitto PDF"
                                                    className="w-full rounded-lg h-[70vh]"
                                                />
                                            </div>
                                        ) : (
                                            <figure className="rounded-box bg-base-200 p-3">
                                                <img
                                                    src={
                                                        (useFallbackUrl
                                                            ? getReceiptImageFallbackUrl(receipt)
                                                            : getReceiptImageUrl(receipt)) ||
                                                        getReceiptImageFallbackUrl(receipt) ||
                                                        ''
                                                    }
                                                    alt="Kvitto"
                                                    className="w-full rounded-lg object-contain max-h-[70vh]"
                                                    onError={() => {
                                                        if (!useFallbackUrl && getReceiptImageFallbackUrl(receipt)) {
                                                            setUseFallbackUrl(true);
                                                        }
                                                    }}
                                                />
                                            </figure>
                                        )}
                                        <a
                                            href={
                                                (useFallbackUrl
                                                    ? getReceiptImageFallbackUrl(receipt)
                                                    : getReceiptImageUrl(receipt)) ||
                                                getReceiptImageFallbackUrl(receipt) ||
                                                '#'
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-ghost btn-sm mt-3"
                                        >
                                            Oppna fil i ny flik
                                        </a>
                                    </>
                                ) : (
                                    <div className="alert alert-info">
                                        <span>Ingen kvitto-bild uppladdad.</span>
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
