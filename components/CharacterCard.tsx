import React, { useState, useRef } from 'react';
import type { Character, Style } from '../types';
import { generateImageForPrompt, getApiErrorMessage } from '../services/geminiService';
import { Loader } from './Loader';
import { UserIcon } from './icons/UserIcon';
import { ImageIcon } from './icons/ImageIcon';
import { UploadIcon } from './icons/UploadIcon';

interface CharacterCardProps {
    character: Character;
    onUpdateCharacter: (character: Character) => void;
    selectedStyle: Style;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ character, onUpdateCharacter, selectedStyle }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(character.imageUrl || null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGeneratePortrait = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const prompt = `Character portrait of ${character.name}, ${character.description}. Style: ${selectedStyle.promptModifier}. Centered, high-detail, neutral background.`;
            const newImageUrl = await generateImageForPrompt(prompt, '1:1');
            setImageUrl(newImageUrl);
            onUpdateCharacter({ ...character, imageUrl: newImageUrl });
        } catch (err) {
            console.error("Failed to generate character portrait:", err);
            setError(`Image generation failed: ${getApiErrorMessage(err)}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setError(null);
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setImageUrl(result);
            onUpdateCharacter({ ...character, imageUrl: result });
        };
        reader.onerror = () => {
            setError("Failed to read the selected file.");
        };
        reader.readAsDataURL(file);
        
        event.target.value = '';
    };

    return (
        <div className="bg-surface border border-border-color rounded-lg shadow-lg p-4 flex flex-col">
            <h4 className="text-lg font-bold text-primary mb-2">{character.name}</h4>
            <div className="aspect-square bg-brand-bg rounded border border-dashed border-border-color flex items-center justify-center overflow-hidden mb-3">
                 {isLoading ? (
                    <div className="w-8 h-8 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                ) : imageUrl ? (
                    <img src={imageUrl} alt={`Portrait of ${character.name}`} className="w-full h-full object-cover" />
                ) : (
                    <UserIcon className="w-12 h-12 text-border-color" />
                )}
            </div>
            <p className="text-sm text-text-secondary flex-grow mb-4">{character.description}</p>
            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
            
             <div className="mt-auto grid grid-cols-2 gap-2">
                <button
                    onClick={handleGeneratePortrait}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-secondary/80 text-white font-semibold rounded-md hover:bg-secondary disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    {isLoading ? <><Loader /> Wait...</> : <><ImageIcon className="w-5 h-5" /> {imageUrl ? 'Regenerate' : 'Generate'}</>}
                </button>

                <button
                    onClick={handleUploadClick}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-primary/80 text-white font-semibold rounded-md hover:bg-primary disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    <UploadIcon className="w-5 h-5" />
                    {imageUrl ? 'Replace' : 'Upload'}
                </button>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
            />
        </div>
    );
};