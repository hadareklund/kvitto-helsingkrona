import { useMemo } from 'react';

interface MoneyDrop {
    id: number;
    emoji: '💸' | '💰';
    left: number;
    duration: number;
    delay: number;
    drift: number;
    size: number;
}

interface MoneyRainProps {
    count?: number;
}

function MoneyRain({ count = 50 }: MoneyRainProps) {
    const drops = useMemo<MoneyDrop[]>(() => {
        return Array.from({ length: count }, (_, index) => ({
            id: index,
            emoji: Math.random() > 0.5 ? '💸' : '💰',
            left: Math.random() * 100,
            duration: 3 + Math.random() * 4,
            delay: Math.random() * 2.5,
            drift: (Math.random() - 0.5) * 18,
            size: 1.2 + Math.random() * 1.1,
        }));
    }, [count]);

    return (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden" aria-hidden="true">
            {drops.map((drop) => (
                <span
                    key={drop.id}
                    className="money-rain-item"
                    style={{
                        left: `${drop.left}%`,
                        animationDuration: `${drop.duration}s`,
                        animationDelay: `${drop.delay}s`,
                        ['--money-drift' as string]: `${drop.drift}vw`,
                        fontSize: `${drop.size}rem`,
                    }}
                >
                    {drop.emoji}
                </span>
            ))}
        </div>
    );
}

export default MoneyRain;
