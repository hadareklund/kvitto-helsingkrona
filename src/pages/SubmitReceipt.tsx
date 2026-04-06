import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import pb from '../lib/pocketbase';
import { useLanguage } from '../i18n/LanguageContext';
import MoneyRain from '../components/MoneyRain';

const DEV_AUTH_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';
const SUCCESS_REDIRECT_DELAY_MS = 5500;

function SubmitReceipt() {
    const [amount, setAmount] = useState('');
    const [slabb, setSlabb] = useState('');
    const [anledning, setAnledning] = useState('');
    const [dateForSlabb, setDateForSlabb] = useState('');
    const [receiptImage, setReceiptImage] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const [success, setSuccess] = useState(false);

    const { user, isLoading: isAuthLoading } = useAuth();
    const { tr } = useLanguage();
    const navigate = useNavigate();

    const hasMissingBankDetails = (profile: unknown) => {
        const record = (profile || {}) as Record<string, unknown>;
        const bankName = String(record.bank_name || '').trim();
        const accountNumber = String(record.account_number || '').trim();
        return !bankName || !accountNumber;
    };

    const slabbOptions = [
        'Bak/Tvätt',
        'Brunch',
        'Eftersläpp',
        'Sittning',
        'Fredmans',
        'Cocktail',
        'Winbladhs',
        'Lunch',
        'Novischperiod',
        'Terminsstädning',
        'Övrigt',
    ];

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReceiptImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setWarning('');
        setSuccess(false);

        if (!user) {
            setError(tr('Du måste vara inloggad för att skicka in ett kvitto', 'You must be signed in to submit a receipt'));
            return;
        }

        if (!receiptImage) {
            setError(tr('Du måste ladda upp en bild av kvittot', 'You must upload an image of the receipt'));
            return;
        }

        if (hasMissingBankDetails(user)) {
            setWarning(
                tr(
                    'Dina bankuppgifter saknas, vänligen skriv in. Eller vill du inte ha pengarna? Skriv gärna in SEB 5226 1234435',
                    'Your bank details are missing, please fill them in. Or do you not want the money? Please enter SEB 5226 1234435'
                )
            );
            return;
        }

        setIsLoading(true);

        try {
            if (!DEV_AUTH_BYPASS) {
                const profile = await pb.collection('receipt_user').getOne(user.id);

                if (hasMissingBankDetails(profile)) {
                    setWarning(
                        tr(
                            'Dina bankuppgifter saknas, vänligen skriv in. Eller vill du inte ha pengarna? Skriv gärna in SEB 5226 1234435',
                            'Your bank details are missing, please fill them in. Or do you not want the money? Please enter SEB 5226 1234435'
                        )
                    );
                    setIsLoading(false);
                    return;
                }
            }

            if (DEV_AUTH_BYPASS) {
                setSuccess(true);
                setAmount('');
                setSlabb('');
                setAnledning('');
                setDateForSlabb('');
                setReceiptImage(null);

                const fileInput = document.getElementById('receipt_image') as HTMLInputElement;
                if (fileInput) fileInput.value = '';

                setTimeout(() => {
                    navigate('/dashboard');
                }, SUCCESS_REDIRECT_DELAY_MS);
                return;
            }

            const formData = new FormData();
            formData.append('user_id', user.id);
            formData.append('amount', amount);
            formData.append('slabb', slabb);
            formData.append('anledning', anledning);
            formData.append('date_for_slabb', dateForSlabb);
            formData.append('receipt_image', receiptImage);
            formData.append('status', 'Pending');

            await pb.collection('receipts').create(formData);

            setSuccess(true);
            // Reset form
            setAmount('');
            setSlabb('');
            setAnledning('');
            setDateForSlabb('');
            setReceiptImage(null);

            // Reset file input
            const fileInput = document.getElementById('receipt_image') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            // Keep celebration visible a bit longer before redirecting.
            setTimeout(() => {
                navigate('/dashboard');
            }, SUCCESS_REDIRECT_DELAY_MS);
        } catch (err) {
            console.error('Error submitting receipt:', err);
            setError(tr('Ett fel uppstod vid inskick av kvittot. Försök igen.', 'An error occurred while submitting the receipt. Please try again.'));
        } finally {
            setIsLoading(false);
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
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-100 py-12 px-4">
                <div className="max-w-md w-full">
                    <p className="text-center text-base-content">
                        {tr('Du måste vara inloggad för att skicka in kvitton.', 'You must be signed in to submit receipts.')}
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary w-full mt-4"
                    >
                        {tr('Logga in', 'Sign in')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-100 py-12 px-4 sm:px-6 lg:px-8">
            {success && <MoneyRain count={50} />}
            <div className="max-w-2xl mx-auto">
                <div className="card bg-base-100 shadow-xl px-8 py-6">
                    <h2 className="text-2xl font-bold text-base-content mb-6">
                        {tr('Skicka in kvitto', 'Submit receipt')}
                    </h2>

                    {success && (
                        <div className="alert alert-success mb-6">
                            <p className="text-sm">
                                {tr('Kvittot har skickats in! Omdirigerar till dashboard...', 'Receipt submitted! Redirecting to dashboard...')}
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error mb-6">
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {warning && (
                        <div className="alert alert-warning mb-6">
                            <p className="text-sm">{warning}</p>
                            <button
                                type="button"
                                className="btn btn-xs btn-warning"
                                onClick={() => navigate('/settings')}
                            >
                                {tr('Gå till inställningar', 'Go to settings')}
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="amount"
                                className="block text-sm font-medium text-base-content mb-2"
                            >
                                {tr('Belopp (kr) *', 'Amount (SEK) *')}
                            </label>
                            <input
                                type="number"
                                id="amount"
                                required
                                min="0"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="input input-bordered w-full"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="slabb"
                                className="block text-sm font-medium text-base-content mb-2"
                            >
                                Slabb *
                            </label>
                            <select
                                id="slabb"
                                required
                                value={slabb}
                                onChange={(e) => setSlabb(e.target.value)}
                                className="select select-bordered w-full"
                            >
                                <option value="">{tr('Välj slabb...', 'Choose event...')}</option>
                                {slabbOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="anledning"
                                className="block text-sm font-medium text-base-content mb-2"
                            >
                                {tr('Anledning *', 'Reason *')}
                            </label>
                            <textarea
                                id="anledning"
                                required
                                rows={3}
                                value={anledning}
                                onChange={(e) => setAnledning(e.target.value)}
                                className="textarea textarea-bordered w-full"
                                placeholder={tr('Beskriv vad kvittot avser...', 'Describe what the receipt is for...')}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="date_for_slabb"
                                className="block text-sm font-medium text-base-content mb-2"
                            >
                                {tr('Datum för slabb *', 'Date for event *')}
                            </label>
                            <input
                                type="date"
                                id="date_for_slabb"
                                required
                                value={dateForSlabb}
                                onChange={(e) => setDateForSlabb(e.target.value)}
                                className="input input-bordered w-full"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="receipt_image"
                                className="block text-sm font-medium text-base-content mb-2"
                            >
                                {tr('Kvittobild *', 'Receipt image *')}
                            </label>
                            <input
                                type="file"
                                id="receipt_image"
                                required
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            <p className="mt-2 text-xs text-base-content/70">
                                {tr('PNG, JPG, eller PDF (max 10MB)', 'PNG, JPG, or PDF (max 10MB)')}
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary w-full"
                            >
                                {isLoading ? tr('Skickar in...', 'Submitting...') : tr('Skicka in kvitto', 'Submit receipt')}
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="btn btn-ghost btn-sm"
                            >
                                {tr('Avbryt och gå tillbaka', 'Cancel and go back')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default SubmitReceipt;
