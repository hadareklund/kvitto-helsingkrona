import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import pb from '../lib/pocketbase';
import { useLanguage } from '../i18n/LanguageContext';

const DEV_AUTH_BYPASS = import.meta.env.VITE_DEV_AUTH_BYPASS === 'true';

function Settings() {
    const navigate = useNavigate();
    const { user, isLoading: isAuthLoading } = useAuth();
    const { tr } = useLanguage();

    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        if (!user) {
            navigate('/login');
            return;
        }

        if (DEV_AUTH_BYPASS) {
            setBankName(String(user.bank_name || ''));
            setAccountNumber(String(user.account_number || ''));
            setIsLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const profile = await pb.collection('receipt_user').getOne(user.id);
                setBankName(String(profile.bank_name || ''));
                setAccountNumber(String(profile.account_number || ''));
            } catch (fetchError) {
                console.error('Error fetching settings profile:', fetchError);
                setError(tr('Det gick inte att hämta dina uppgifter.', 'Could not fetch your details.'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [isAuthLoading, navigate, user]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!user) {
            setError(tr('Du måste vara inloggad.', 'You must be signed in.'));
            return;
        }

        if (!bankName.trim() || !accountNumber.trim()) {
            setError(tr('Fyll i bade bank och kontonummer.', 'Fill in both bank and account number.'));
            return;
        }

        setIsSaving(true);

        try {
            if (!DEV_AUTH_BYPASS) {
                await pb.collection('receipt_user').update(user.id, {
                    bank_name: bankName.trim(),
                    account_number: accountNumber.trim(),
                });
            }

            setSuccessMessage(tr('Dina bankuppgifter har uppdaterats.', 'Your bank details have been updated.'));
        } catch (saveError) {
            console.error('Error updating bank settings:', saveError);
            setError(tr('Det gick inte att spara ändringarna. Försök igen.', 'Could not save your changes. Please try again.'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isAuthLoading || isLoading) {
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
        <div className="min-h-screen bg-base-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <div className="card bg-base-100 shadow-xl border border-base-300">
                    <div className="card-body p-6 sm:p-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-base-content">{tr('Inställningar', 'Settings')}</h1>
                        <p className="text-sm text-base-content/70">
                            {tr('Uppdatera dina bankuppgifter for utbetalningar.', 'Update your bank details for payouts.')}
                        </p>

                        {error && (
                            <div role="alert" className="alert alert-error mt-2">
                                <span>{error}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div role="status" className="alert alert-success mt-2">
                                <span>{successMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                            <label className="form-control w-full gap-2">
                                <span className="label-text font-medium text-base-content">Bank</span>
                                <input
                                    type="text"
                                    value={bankName}
                                    onChange={(event) => setBankName(event.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={tr('Exempel: Swedbank', 'Example: Swedbank')}
                                    required
                                />
                            </label>

                            <label className="form-control w-full gap-2">
                                <span className="label-text font-medium text-base-content">{tr('Kontonummer', 'Account number')}</span>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(event) => setAccountNumber(event.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder={tr('Exempel: 8327-9, 123 456 789-0', 'Example: 8327-9, 123 456 789-0')}
                                    required
                                />
                            </label>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm" />
                                            {tr('Sparar...', 'Saving...')}
                                        </>
                                    ) : (
                                        tr('Spara', 'Save')
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    {tr('Tillbaka', 'Back')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Settings;