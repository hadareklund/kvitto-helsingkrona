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
    kommentar?: string;
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
    const [commentDraft, setCommentDraft] = useState('');
    const [isSavingComment, setIsSavingComment] = useState(false);
    const [commentMessage, setCommentMessage] = useState('');
    const [isEditingComment, setIsEditingComment] = useState(false);
    const [isCommentMenuOpen, setIsCommentMenuOpen] = useState(false);

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
                setCommentDraft(String(record.kommentar || ''));
                setIsEditingComment(false);
                setIsCommentMenuOpen(false);
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

    const handleSaveComment = async () => {
        if (!receipt || role !== 'pqe') {
            return;
        }

        const nextComment = commentDraft.trim();

        setIsSavingComment(true);
        setCommentMessage('');

        try {
            const updated = await pb.collection('receipts').update<ReceiptWithUser>(receipt.id, {
                kommentar: nextComment,
            });

            setReceipt(updated);
            setCommentDraft(String(updated.kommentar || ''));
            setIsEditingComment(false);
            setIsCommentMenuOpen(false);
            setCommentMessage(tr('Kommentaren sparades.', 'Comment saved.'));
            window.setTimeout(() => setCommentMessage(''), 2500);
        } catch (err) {
            console.error('Error saving comment:', err);
            setCommentMessage(tr('Det gick inte att spara kommentaren.', 'Could not save the comment.'));
        } finally {
            setIsSavingComment(false);
        }
    };

    const role = String(user?.role || '').toLowerCase();
    const hasAdminViewAccess = role === 'admin' || role === 'pqe';
    const canEditComment = role === 'pqe';
    const canViewComment = role === 'admin' || role === 'pqe';
    const submittedByUser = receipt?.expand?.user_id;
    const submittedByUserId =
        typeof receipt?.user_id === 'string' ? receipt.user_id : submittedByUser?.id;
    const existingComment = String(receipt?.kommentar || '').trim();
    const isCommentDirty = commentDraft.trim() !== existingComment;
    const hasExistingComment = existingComment.length > 0;
    const shouldShowEditor = canEditComment && (!hasExistingComment || isEditingComment);

    const startEditingComment = () => {
        setIsEditingComment(true);
        setIsCommentMenuOpen(false);
    };

    const cancelEditingComment = () => {
        setIsEditingComment(false);
        setCommentDraft(existingComment);
        setIsCommentMenuOpen(false);
    };

    const handleDeleteComment = async () => {
        if (!receipt || role !== 'pqe') {
            return;
        }

        const confirmed = window.confirm(tr('Vill du ta bort kommentaren?', 'Do you want to delete the comment?'));
        if (!confirmed) {
            return;
        }

        setIsSavingComment(true);
        setCommentMessage('');

        try {
            const updated = await pb.collection('receipts').update<ReceiptWithUser>(receipt.id, {
                kommentar: '',
            });

            setReceipt(updated);
            setCommentDraft('');
            setIsEditingComment(false);
            setIsCommentMenuOpen(false);
            setCommentMessage(tr('Kommentaren togs bort.', 'Comment deleted.'));
            window.setTimeout(() => setCommentMessage(''), 2500);
        } catch (err) {
            console.error('Error deleting comment:', err);
            setCommentMessage(tr('Det gick inte att ta bort kommentaren.', 'Could not delete the comment.'));
        } finally {
            setIsSavingComment(false);
        }
    };

    const toggleCommentMenu = () => {
        setIsCommentMenuOpen((current) => !current);
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
                                    <div className="flex items-start justify-between gap-4">
                                        <span className="text-sm text-base-content/70">{tr('Inskickat av', 'Submitted by')}</span>
                                        <span className="font-medium text-right break-all">
                                            {String(submittedByUser?.name || submittedByUser?.email || '-')}
                                            {submittedByUser?.email && submittedByUser?.name ? ` (${String(submittedByUser.email)})` : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-base-content/70">{tr('Bank', 'Bank')}</span>
                                        <span className="font-medium">{String(submittedByUser?.bank_name || '-')}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-sm text-base-content/70">{tr('Kontonummer', 'Account number')}</span>
                                        <span className="font-medium">{String(submittedByUser?.account_number || '-')}</span>
                                    </div>
                                    <div className="rounded-box bg-base-200 p-3">
                                        <p className="text-sm text-base-content/70 mb-1">{tr('Anledning', 'Reason')}</p>
                                        <p className="text-sm">{String(receipt.anledning || '-')}</p>
                                    </div>

                                    {canViewComment && (
                                        <div className="rounded-box border border-amber-300 bg-amber-100 px-4 py-3 shadow-md rotate-[-1deg]">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-amber-950">
                                                        {tr('Kommentar', 'Comment')}
                                                    </p>
                                                    {shouldShowEditor ? (
                                                        <textarea
                                                            value={commentDraft}
                                                            onChange={(e) => setCommentDraft(e.target.value)}
                                                            placeholder={tr('Skriv en kommentar...', 'Write a comment...')}
                                                            className="textarea textarea-bordered mt-2 w-full bg-amber-50 text-amber-950 placeholder:text-amber-700 resize-none"
                                                            rows={4}
                                                        />
                                                    ) : (
                                                        <p className="mt-2 whitespace-pre-wrap text-sm text-amber-950">
                                                            {existingComment || tr('Ingen kommentar än.', 'No comment yet.')}
                                                        </p>
                                                    )}
                                                </div>

                                                {canEditComment && hasExistingComment && !isEditingComment && (
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            className="btn btn-ghost btn-xs btn-circle text-amber-950 hover:bg-amber-200"
                                                            onClick={toggleCommentMenu}
                                                            aria-label={tr('Kommentaralternativ', 'Comment options')}
                                                        >
                                                            <svg
                                                                viewBox="0 0 24 24"
                                                                className="h-5 w-5"
                                                                fill="currentColor"
                                                                aria-hidden="true"
                                                            >
                                                                <circle cx="12" cy="5" r="1.9" />
                                                                <circle cx="12" cy="12" r="1.9" />
                                                                <circle cx="12" cy="19" r="1.9" />
                                                            </svg>
                                                        </button>
                                                        {isCommentMenuOpen && (
                                                            <div className="absolute right-0 top-10 z-10 w-40 rounded-box border border-base-300 bg-base-100 p-2 shadow">
                                                                <button
                                                                    type="button"
                                                                    onClick={startEditingComment}
                                                                    className="block w-full rounded-btn px-3 py-2 text-left text-sm hover:bg-base-200"
                                                                >
                                                                    {tr('Ändra', 'Edit')}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleDeleteComment}
                                                                    className="block w-full rounded-btn px-3 py-2 text-left text-sm hover:bg-base-200"
                                                                >
                                                                    {tr('Ta bort', 'Delete')}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {canEditComment && shouldShowEditor && isCommentDirty && (
                                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                                    <button
                                                        onClick={handleSaveComment}
                                                        className="btn btn-sm bg-amber-300 border-amber-400 text-amber-950 hover:bg-amber-200"
                                                        disabled={isSavingComment}
                                                    >
                                                        {isSavingComment ? tr('Sparar...', 'Saving...') : tr('Spara kommentar', 'Save comment')}
                                                    </button>
                                                    {hasExistingComment && (
                                                        <button
                                                            onClick={cancelEditingComment}
                                                            className="btn btn-sm btn-ghost text-amber-950 hover:bg-amber-200"
                                                            disabled={isSavingComment}
                                                        >
                                                            {tr('Avbryt', 'Cancel')}
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {commentMessage && (
                                                <p className="mt-2 text-sm text-amber-950">{commentMessage}</p>
                                            )}
                                        </div>
                                    )}

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
