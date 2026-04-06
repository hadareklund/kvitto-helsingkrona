import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [passwordSetupMessage, setPasswordSetupMessage] = useState('');
    const [passwordSetupError, setPasswordSetupError] = useState('');
    const [isPasswordSetupLoading, setIsPasswordSetupLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { user, login, requestPasswordSetup, isAuthenticated } = useAuth();
    const { tr } = useLanguage();
    const navigate = useNavigate();

    const hasMissingBankDetails = (profile: unknown) => {
        const record = (profile || {}) as Record<string, unknown>;
        const bankName = String(record.bank_name || '').trim();
        const accountNumber = String(record.account_number || '').trim();
        return !bankName || !accountNumber;
    };

    useEffect(() => {
        // Redirect if already authenticated
        if (isAuthenticated) {
            if (hasMissingBankDetails(user)) {
                navigate('/settings');
                return;
            }

            navigate('/dashboard');
        }
    }, [isAuthenticated, user, navigate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);

        if (result.success) {
            if (hasMissingBankDetails(result.user)) {
                navigate('/settings');
                return;
            }

            navigate('/dashboard');
        } else {
            setError(tr('Felaktig e-post eller lösenord', 'Incorrect email or password'));
            setIsLoading(false);
        }
    };

    const handlePasswordSetupRequest = async () => {
        setPasswordSetupMessage('');
        setPasswordSetupError('');

        if (!email.trim()) {
            setPasswordSetupError(tr('Fyll i din e-postadress först.', 'Please enter your email first.'));
            return;
        }

        setIsPasswordSetupLoading(true);
        const result = await requestPasswordSetup(email.trim());

        if (result.success) {
            setPasswordSetupMessage(
                tr(
                    'Om e-posten finns i systemet har en länk för att skapa lösenord skickats.',
                    'If the email exists in the system, a link to create a password has been sent.'
                )
            );
        } else {
            setPasswordSetupError(
                tr(
                    'Det gick inte att skicka e-post just nu. Försök igen senare.',
                    'Could not send email right now. Please try again later.'
                )
            );
        }

        setIsPasswordSetupLoading(false);
    };

    return (
        <div className="hero min-h-screen bg-base-200 px-4 py-8">
            <div className="hero-content w-full max-w-md">
                <div className="card w-full bg-base-100 shadow-2xl border border-base-300">
                    <div className="card-body gap-6 p-6 sm:p-8">
                        <div className="text-center space-y-3">
                            <div className="badge badge-primary badge-outline">Helsingkrona</div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-base-content">Kvittoportalen</h1>
                            <p className="text-sm sm:text-base text-base-content/70">
                                {tr('Logga in för att hantera dina kvitton', 'Sign in to manage your receipts')}
                            </p>
                        </div>

                        {error && (
                            <div role="alert" className="alert alert-error">
                                <span>{error}</span>
                            </div>
                        )}

                        {passwordSetupMessage && (
                            <div role="status" className="alert alert-success">
                                <span>{passwordSetupMessage}</span>
                            </div>
                        )}

                        {passwordSetupError && (
                            <div role="alert" className="alert alert-warning">
                                <span>{passwordSetupError}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="form-control w-full gap-2">
                                <span className="label-text font-medium text-base-content">{tr('E-postadress', 'Email address')}</span>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input input-bordered input-md w-full"
                                    placeholder={tr('namn@helsingkrona.se', 'name@helsingkrona.se')}
                                />
                            </label>

                            <label className="form-control w-full gap-2">
                                <span className="label-text font-medium text-base-content">{tr('Lösenord', 'Password')}</span>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input input-bordered input-md w-full"
                                    placeholder="••••••••"
                                />
                            </label>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="btn btn-primary btn-block mt-2"
                            >
                                {isLoading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm" />
                                        {tr('Loggar in...', 'Signing in...')}
                                    </>
                                ) : (
                                    tr('Logga in', 'Sign in')
                                )}
                            </button>

                            <button
                                type="button"
                                disabled={isPasswordSetupLoading}
                                onClick={handlePasswordSetupRequest}
                                className="btn btn-outline btn-block"
                            >
                                {isPasswordSetupLoading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm" />
                                        {tr('Skickar...', 'Sending...')}
                                    </>
                                ) : (
                                    tr('Skapa lösenord via e-post', 'Create password via email')
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
