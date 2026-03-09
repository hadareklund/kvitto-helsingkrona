import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function Home() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
}

export default Home;
