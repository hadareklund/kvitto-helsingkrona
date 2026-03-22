import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import pb from '../lib/pocketbase';
import { useLanguage } from '../i18n/LanguageContext';

function readTokenFromHash(hash: string): string {
    if (!hash) {
        return '';
    }

    const rawHash = hash.startsWith('#') ? hash.slice(1) : hash;
    const hashParams = new URLSearchParams(rawHash);
    return hashParams.get('token') || '';
}

function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { tr } = useLanguage();

    const token = useMemo(() => {
        const searchToken = searchParams.get('token') || '';
        if (searchToken) {
            return searchToken;
        }

        return readTokenFromHash(window.location.hash);
    }, [searchParams]);

    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!token) {
            setError(tr('Länken saknar token. Öppna länken fran e-posten igen.', 'The link is missing a token. Open the email link again.'));
            return;
        }

        if (password.length < 5) {
            setError(tr('Lösenordet måste vara minst 5 tecken.', 'The password must be at least 5 characters.'));
            return;
        }

        if (password !== passwordConfirm) {
            setError(tr('Lösenorden matchar inte.', 'Passwords do not match.'));
            return;
        }

        setIsSubmitting(true);

        try {
            await pb.collection('receipt_user').confirmPasswordReset(token, password, passwordConfirm);
            setSuccessMessage(tr('Ditt lösenord ar uppdaterat. Du kan nu logga in.', 'Your password has been updated. You can now sign in.'));
            setPassword('');
            setPasswordConfirm('');
        } catch (submitError) {
            console.error('Password reset confirm error:', submitError);
            setError(tr('Länken ar ogiltig eller har gatt ut. Begar en ny länk fran inloggningssidan.', 'The link is invalid or expired. Request a new link from the login page.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="hero min-h-screen bg-base-200 px-6 py-12 sm:px-8">
            <div className="hero-content w-full max-w-md px-0">
                <div className="card w-full bg-base-100 shadow-2xl border border-base-300">
                    <div className="card-body gap-6 p-7 sm:p-9">
                        <div className="text-center space-y-3">
                            <div className="badge badge-primary badge-outline">Helsingkrona</div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-base-content">{tr('Skapa nytt lösenord', 'Create new password')}</h1>
                            <p className="text-sm sm:text-base text-base-content/70">
                                {tr('Ange ditt nya lösenord för att slutföra inloggningen.', 'Enter your new password to complete sign-in.')}
                            </p>
                        </div>

                        {!token && (
                            <div role="alert" className="alert alert-warning">
                                <span>{tr('Ingen reset-token hittades i URL:en.', 'No reset token was found in the URL.')}</span>
                            </div>
                        )}

                        {error && (
                            <div role="alert" className="alert alert-error">
                                <span>{error}</span>
                            </div>
                        )}

                        {successMessage && (
                            <div role="status" className="alert alert-success">
                                <span>{successMessage}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="form-control w-full gap-2">
                                <span className="label-text font-medium text-base-content">{tr('Nytt lösenord', 'New password')}</span>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    minLength={5}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="input input-bordered input-md w-full"
                                    placeholder={tr('Minst 5 tecken', 'At least 5 characters')}
                                />
                            </label>

                            <label className="form-control w-full gap-2">
                                <span className="label-text font-medium text-base-content">{tr('Bekräfta lösenord', 'Confirm password')}</span>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    minLength={5}
                                    value={passwordConfirm}
                                    onChange={(event) => setPasswordConfirm(event.target.value)}
                                    className="input input-bordered input-md w-full"
                                    placeholder={tr('Upprepa lösenord', 'Repeat password')}
                                />
                            </label>

                            <div className="pt-3">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !token}
                                    className="btn btn-primary btn-block"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm" />
                                            {tr('Uppdaterar...', 'Updating...')}
                                        </>
                                    ) : (
                                        tr('Spara nytt lösenord', 'Save new password')
                                    )}
                                </button>
                            </div>
                        </form>

                        <div className="text-center text-sm">
                            <Link className="link link-primary" to="/login">
                                {tr('Tillbaka till inloggning', 'Back to login')}
                            </Link>
                        </div>

                        {successMessage && (
                            <div className="card-actions justify-center">
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => navigate('/login')}
                                >
                                    {tr('Gå till inloggning', 'Go to login')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResetPassword;