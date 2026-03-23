import { Link } from 'react-router-dom';

function SiteLogo() {
    return (
        <Link
            to="/"
            className="fixed top-4 left-4 z-[9999] rounded-box bg-base-100/90 p-2 shadow-lg border border-base-300"
            title="Helsingkrona"
            aria-label="Helsingkrona"
        >
            <img
                src="/logo.png"
                alt="Helsingkrona logo"
                className="h-10 w-10 sm:h-12 sm:w-12 object-contain"
            />
        </Link>
    );
}

export default SiteLogo;