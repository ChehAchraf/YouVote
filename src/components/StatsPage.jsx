import React, { useEffect, useState } from 'react';
import charactersData from '../data/characters.json';
import { supabase } from '../supabaseClient';
import './StatsPage.css';

const StatsPage = () => {
    const [lists, setLists] = useState({ beloved: [], hated: [], neutral: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();

        const subscription = supabase
            .channel('votes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, () => {
                fetchStats();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        }
    }, []);

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase
                .from('votes')
                .select('character_id, vote_type');

            if (error) throw error;

            // Calculate Scores
            const scoreMap = {};

            data.forEach(vote => {
                const id = vote.character_id;
                if (!scoreMap[id]) scoreMap[id] = 0;

                if (vote.vote_type === 'like') {
                    scoreMap[id] += 1;
                } else if (vote.vote_type === 'dislike') {
                    scoreMap[id] -= 1;
                }
            });

            // Map and Sort
            const allChars = charactersData.map(char => {
                const key = `${char.firstName}-${char.lastName}`;
                const score = scoreMap[key] || 0;
                return { ...char, score };
            });

            // Categorize
            const beloved = allChars.filter(c => c.score > 0).sort((a, b) => b.score - a.score);
            const hated = allChars.filter(c => c.score < 0).sort((a, b) => a.score - b.score); // Ascending (most negative first)
            const neutral = allChars.filter(c => c.score === 0);

            setLists({ beloved, hated, neutral });
            setLoading(false);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError('Could not load global stats.');
            setLoading(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading Scores...</div>;

    return (
        <div className="stats-container">
            <div className="stats-header">
                <h2>Global Rankings (Net Score)</h2>
            </div>

            {error && <div className="text-danger" style={{ padding: '0.5rem' }}>{error}</div>}

            <div className="stats-grid">
                <div className="stat-column">
                    <h3 className="text-success">The Beloved (Positive Score)</h3>
                    <ul className="stat-list">
                        {lists.beloved.map(char => (
                            <li key={char.firstName} className="stat-item">
                                <img src={char.image} alt="" className="stat-thumb" />
                                <div style={{ flex: 1 }}>
                                    <span>{char.firstName} {char.lastName}</span>
                                </div>
                                <strong className="text-success">+{char.score}</strong>
                            </li>
                        ))}
                        {lists.beloved.length === 0 && <p className="empty-msg">No heroes yet...</p>}
                    </ul>
                </div>

                <div className="stat-column">
                    <h3 className="text-danger">The Hated (Negative Score)</h3>
                    <ul className="stat-list">
                        {lists.hated.map(char => (
                            <li key={char.firstName} className="stat-item">
                                <img src={char.image} alt="" className="stat-thumb" />
                                <div style={{ flex: 1 }}>
                                    <span>{char.firstName} {char.lastName}</span>
                                </div>
                                <strong className="text-danger">{char.score}</strong>
                            </li>
                        ))}
                        {lists.hated.length === 0 && <p className="empty-msg">No villains yet...</p>}
                    </ul>
                </div>
            </div>

            {lists.neutral.length > 0 && (
                <div style={{ marginTop: '2rem' }}>
                    <h3>Neutral / No Score</h3>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                        {lists.neutral.map(char => (
                            <div key={char.firstName} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.9rem' }}>
                                {char.firstName}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatsPage;
