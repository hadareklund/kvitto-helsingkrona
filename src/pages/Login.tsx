import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [passwordSetupMessage, setPasswordSetupMessage] = useState('');
    const [passwordSetupError, setPasswordSetupError] = useState('');
    const [isPasswordSetupLoading, setIsPasswordSetupLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login, requestPasswordSetup, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect if already authenticated
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email, password);

        if (result.success) {
            navigate('/dashboard');
        } else {
            setError('Felaktig e-post eller lösenord');
            setIsLoading(false);
        }
    };

    const handlePasswordSetupRequest = async () => {
        setPasswordSetupMessage('');
        setPasswordSetupError('');

        if (!email.trim()) {
            setPasswordSetupError('Fyll i din e-postadress först.');
            return;
        }

        setIsPasswordSetupLoading(true);
        const result = await requestPasswordSetup(email.trim());

        if (result.success) {
            setPasswordSetupMessage('Om e-posten finns i systemet har en länk för att skapa lösenord skickats.');
        } else {
            const debugDetails =
                'errorMessage' in result && typeof result.errorMessage === 'string'
                    ? result.errorMessage
                    : 'Inga extra feldetaljer tillgängliga.';
            setPasswordSetupError(`Det gick inte att skicka e-post just nu. [TEMP DEBUG] ${debugDetails}`);
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
                                Logga in för att hantera dina kvitton
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
                                <span className="label-text font-medium text-base-content">E-postadress</span>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input input-bordered input-md w-full"
                                    placeholder="namn@helsingkrona.se"
                                />
                            </label>

                            <label className="form-control w-full gap-2">
                                <span className="label-text font-medium text-base-content">Lösenord</span>
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
                                        Loggar in...
                                    </>
                                ) : (
                                    'Logga in'
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
                                        Skickar...
                                    </>
                                ) : (
                                    'Skapa lösenord via e-post'
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
