import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import pb from '../lib/pocketbase';

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
            setError('Länken saknar token. Öppna länken från e-posten igen.');
            return;
        }

        if (password.length < 8) {
            setError('Lösenordet måste vara minst 8 tecken.');
            return;
        }

        if (password !== passwordConfirm) {
            setError('Lösenorden matchar inte.');
            return;
        }

        setIsSubmitting(true);

        try {
            await pb.collection('receipt_user').confirmPasswordReset(token, password, passwordConfirm);
            setSuccessMessage('Ditt lösenord är uppdaterat. Du kan nu logga in.');
            setPassword('');
            setPasswordConfirm('');
        } catch (submitError) {
            console.error('Password reset confirm error:', submitError);
            setError('Länken är ogiltig eller har gått ut. Begär en ny länk från inloggningssidan.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="hero min-h-screen bg-base-200 px-4 py-8">
            <div className="hero-content w-full max-w-md">
                <div className="card w-full bg-base-100 shadow-2xl border border-base-300">
                    <div className="card-body gap-6 p-6 sm:p-8">
                        <div className="text-center space-y-3">
                            <div className="badge badge-primary badge-outline">Helsingkrona</div>
                            <h1 className="text-3xl sm:text-4xl font-bold text-base-content">Skapa nytt lösenord</h1>
                            <p className="text-sm sm:text-base text-base-content/70">
                                Ange ditt nya lösenord för att slutföra inloggningen.
                            </p>
                        </div>

                        {!token && (
                            <div role="alert" className="alert alert-warning">
                                <span>Ingen reset-token hittades i URL:en.</span>
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
                                <span className="label-text font-medium text-base-content">Nytt lösenord</span>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    className="input input-bordered input-md w-full"
                                    placeholder="Minst 8 tecken"
                                />
                            </label>

                            <label className="form-control w-full gap-2">
                                <span className="label-text font-medium text-base-content">Bekräfta lösenord</span>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    value={passwordConfirm}
                                    onChange={(event) => setPasswordConfirm(event.target.value)}
                                    className="input input-bordered input-md w-full"
                                    placeholder="Upprepa lösenord"
                                />
                            </label>

                            <button
                                type="submit"
                                disabled={isSubmitting || !token}
                                className="btn btn-primary btn-block"
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm" />
                                        Uppdaterar...
                                    </>
                                ) : (
                                    'Spara nytt lösenord'
                                )}
                            </button>
                        </form>

                        <div className="text-center text-sm">
                            <Link className="link link-primary" to="/login">
                                Tillbaka till inloggning
                            </Link>
                        </div>

                        {successMessage && (
                            <div className="card-actions justify-center">
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => navigate('/login')}
                                >
                                    Gå till inloggning
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