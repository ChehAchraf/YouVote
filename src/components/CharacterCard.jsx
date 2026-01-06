import React from 'react';
import './CharacterCard.css';

const CharacterCard = ({ character, onVote }) => {
    return (
        <div className="character-card">
            <div className="card-image-wrapper">
                <img
                    src={character.image}
                    alt={`${character.firstName} ${character.lastName}`}
                    className="character-image"
                />
            </div>
            <h2 className="character-name">
                {character.firstName} {character.lastName}
            </h2>
            <div className="vote-actions">
                <button
                    className="vote-btn like-btn"
                    onClick={() => onVote('like')}
                    aria-label="Like"
                >
                    👍 Like
                </button>
                <button
                    className="vote-btn dislike-btn"
                    onClick={() => onVote('dislike')}
                    aria-label="Dislike"
                >
                    👎 Dislike
                </button>
            </div>
        </div>
    );
};

export default CharacterCard;
