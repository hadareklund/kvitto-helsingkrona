import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import pb from '../lib/pocketbase';

function SubmitReceipt() {
    const [amount, setAmount] = useState('');
    const [slabb, setSlabb] = useState('');
    const [anledning, setAnledning] = useState('');
    const [dateForSlabb, setDateForSlabb] = useState('');
    const [receiptImage, setReceiptImage] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    const slabbOptions = [
        'Pub',
        'Sittning',
        'Förfest',
        'Klubbmästeriet',
        'Idrott',
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
        setSuccess(false);

        if (!user) {
            setError('Du måste vara inloggad för att skicka in ett kvitto');
            return;
        }

        if (!receiptImage) {
            setError('Du måste ladda upp en bild av kvittot');
            return;
        }

        setIsLoading(true);

        try {
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

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                navigate('/dashboard');
            }, 2000);
        } catch (err) {
            console.error('Error submitting receipt:', err);
            setError('Ett fel uppstod vid inskick av kvittot. Försök igen.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
                <div className="max-w-md w-full">
                    <p className="text-center text-gray-700">
                        Du måste vara inloggad för att skicka in kvitton.
                    </p>
                    <button
                        onClick={() => navigate('/login')}
                        className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        Logga in
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white shadow-md rounded-lg px-8 py-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Skicka in kvitto
                    </h2>

                    {success && (
                        <div className="mb-6 rounded-md bg-green-50 p-4">
                            <p className="text-sm text-green-800">
                                Kvittot har skickats in! Omdirigerar till dashboard...
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 rounded-md bg-red-50 p-4">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="amount"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Belopp (kr) *
                            </label>
                            <input
                                type="number"
                                id="amount"
                                required
                                min="0"
                                step="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="slabb"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Slabb *
                            </label>
                            <select
                                id="slabb"
                                required
                                value={slabb}
                                onChange={(e) => setSlabb(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                                <option value="">Välj slabb...</option>
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
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Anledning *
                            </label>
                            <textarea
                                id="anledning"
                                required
                                rows={3}
                                value={anledning}
                                onChange={(e) => setAnledning(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Beskriv vad kvittot avser..."
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="date_for_slabb"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Datum för slabb *
                            </label>
                            <input
                                type="date"
                                id="date_for_slabb"
                                required
                                value={dateForSlabb}
                                onChange={(e) => setDateForSlabb(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="receipt_image"
                                className="block text-sm font-medium text-gray-700 mb-2"
                            >
                                Kvittobild *
                            </label>
                            <input
                                type="file"
                                id="receipt_image"
                                required
                                accept="image/*,.pdf"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                            <p className="mt-2 text-xs text-gray-500">
                                PNG, JPG, eller PDF (max 10MB)
                            </p>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Skickar in...' : 'Skicka in kvitto'}
                            </button>
                        </div>

                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/dashboard')}
                                className="text-sm text-indigo-600 hover:text-indigo-500"
                            >
                                Avbryt och gå tillbaka
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default SubmitReceipt;
