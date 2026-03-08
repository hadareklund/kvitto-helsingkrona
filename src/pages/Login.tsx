import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
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

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md">
                <div className="card bg-base-100 shadow-xl border border-base-300">
                    <div className="card-body gap-5">
                        <div className="text-center space-y-2">
                            <div className="badge badge-primary badge-outline">Helsingkrona</div>
                            <h1 className="text-3xl font-bold text-base-content">Kvittoportalen</h1>
                            <p className="text-base-content/70">Logga in för att hantera dina kvitton</p>
                        </div>

                        {error && (
                            <div role="alert" className="alert alert-error">
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <label className="form-control w-full">
                                <span className="label-text text-base-content">E-postadress</span>
                                <input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder="namn@helsingkrona.se"
                                />
                            </label>

                            <label className="form-control w-full">
                                <span className="label-text text-base-content">Losenord</span>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input input-bordered w-full"
                                    placeholder="••••••••"
                                />
                            </label>

                            <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                                {isLoading ? 'Loggar in...' : 'Logga in'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
