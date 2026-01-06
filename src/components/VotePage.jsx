import React, { useState, useEffect } from 'react';
import { useUser, SignInButton, SignUpButton } from '@clerk/clerk-react';
import CharacterCard from './CharacterCard';
import charactersData from '../data/characters.json';
import { supabase } from '../supabaseClient';
import './VotePage.css'; // Create this if needed for auth container styles

const VotePage = () => {
    const { isSignedIn, user, isLoaded } = useUser();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [complete, setComplete] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userVotedKeys, setUserVotedKeys] = useState(new Set());

    // Helper to generate a unique key for each character
    const getCharacterKey = (char) => `${char.firstName}-${char.lastName}`;

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            fetchUserVotes();
        } else if (isLoaded && !isSignedIn) {
            setLoading(false);
        }
    }, [isLoaded, isSignedIn, user]);

    const fetchUserVotes = async () => {
        try {
            const { data, error } = await supabase
                .from('votes')
                .select('character_id')
                .eq('user_id', user.id);

            if (error) throw error;

            const votedSet = new Set(data.map(v => v.character_id));
            setUserVotedKeys(votedSet);

            // Determine first unvoted index
            let nextIndex = 0;
            while (nextIndex < charactersData.length && votedSet.has(getCharacterKey(charactersData[nextIndex]))) {
                nextIndex++;
            }

            if (nextIndex >= charactersData.length) {
                setComplete(true);
            } else {
                setCurrentIndex(nextIndex);
            }
        } catch (err) {
            console.error('Error fetching user votes:', err);
            if (err.code === '42703') {
                alert("DATABASE ERROR: The 'user_id' column is missing in Supabase. Please run the SQL command provided in the chat.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (voteType) => {
        if (!isSignedIn) return;

        const character = charactersData[currentIndex];
        const key = getCharacterKey(character);

        // Optimistic update
        const newCtx = currentIndex + 1;
        let nextIndex = newCtx;
        // Skip any locally known voted ones (unlikely if synced, but safe)
        while (nextIndex < charactersData.length && userVotedKeys.has(getCharacterKey(charactersData[nextIndex]))) {
            nextIndex++;
        }

        if (nextIndex >= charactersData.length) {
            setComplete(true);
        } else {
            setCurrentIndex(nextIndex);
        }

        // Send to Supabase
        try {
            const { error } = await supabase
                .from('votes')
                .insert([
                    { character_id: key, vote_type: voteType, user_id: user.id }
                ]);

            if (error) {
                console.error('Error saving vote:', error);
                if (error.code === '42703') {
                    alert("DATABASE ERROR: Missing 'user_id' column. Run the SQL migration!");
                } else if (error.code === '23505') { // Unique violation
                    // Silent fail or toast
                    console.warn('Duplicate vote prevented');
                }
            } else {
                // Update local set
                setUserVotedKeys(prev => new Set(prev).add(key));
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        }
    };

    if (!isLoaded || loading) {
        return <div style={{ textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;
    }

    if (!isSignedIn) {
        return (
            <div className="auth-container">
                <h2>Welcome to Character Voting!</h2>
                <p>Please sign in to start voting.</p>
                <div className="auth-buttons">
                    <div className="auth-btn-wrapper">
                        <SignInButton mode="modal">
                            <button className="auth-btn">Sign In</button>
                        </SignInButton>
                    </div>
                    <div className="auth-btn-wrapper">
                        <SignUpButton mode="modal">
                            <button className="auth-btn secondary">Sign Up</button>
                        </SignUpButton>
                    </div>
                </div>
            </div>
        );
    }

    if (complete) {
        return (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
                <h2>All Caught Up!</h2>
                <p style={{ color: 'var(--color-text-secondary)', marginTop: '1rem' }}>
                    You have voted on all available characters.
                    <br /> Check out the statistics!
                </p>
            </div>
        );
    }

    const currentCharacter = charactersData[currentIndex];
    if (!currentCharacter) return null;

    return (
        <div>
            <CharacterCard
                key={getCharacterKey(currentCharacter)}
                character={currentCharacter}
                onVote={handleVote}
            />
        </div>
    );
};

export default VotePage;
