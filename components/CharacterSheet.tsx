
import React from 'react';
import type { Character, Style } from '../types';
import { CharacterCard } from './CharacterCard';

interface CharacterSheetProps {
    characters: Character[];
    onUpdateCharacter: (character: Character) => void;
    selectedStyle: Style;
}

export const CharacterSheet: React.FC<CharacterSheetProps> = ({ characters, onUpdateCharacter, selectedStyle }) => {
    return (
        <section className="mt-8 animate-fade-in">
            <h2 className="text-xl font-semibold mb-4 text-text-main">3. Character Sheet</h2>
            <p className="text-text-secondary mb-6">
                The AI has identified the following characters. Generate reference portraits in your selected style to ensure visual consistency.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {characters.map((character) => (
                    <CharacterCard
                        key={character.name}
                        character={character}
                        onUpdateCharacter={onUpdateCharacter}
                        selectedStyle={selectedStyle}
                    />
                ))}
            </div>
        </section>
    );
};
