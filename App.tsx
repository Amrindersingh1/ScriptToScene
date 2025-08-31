import React, { useState, useCallback } from 'react';
import { parseScriptToScenes, extractCharactersFromScript, getApiErrorMessage } from './services/geminiService';
import type { Scene, Character, Style } from './types';
import { ScriptInput } from './components/ScriptInput';
import { Timeline } from './components/Timeline';
import { FilmIcon } from './components/icons/FilmIcon';
import { CharacterSheet } from './components/CharacterSheet';
import { StyleSelector } from './components/StyleSelector';

const App: React.FC = () => {
  const [script, setScript] = useState<string>('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeScript = useCallback(async () => {
    if (!script.trim()) {
      setError('Script cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setScenes([]);
    setCharacters([]);
    setSelectedStyle(null);

    try {
      const [parsedScenes, extractedCharacters] = await Promise.all([
        parseScriptToScenes(script),
        extractCharactersFromScript(script)
      ]);
      setScenes(parsedScenes);
      setCharacters(extractedCharacters);
    } catch (err) {
      console.error('Error analyzing script:', err);
      const friendlyMessage = getApiErrorMessage(err);
      setError(`Failed to analyze script: ${friendlyMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [script]);
  
  const handleUpdateCharacter = useCallback((updatedCharacter: Character) => {
    setCharacters(prev => 
      prev.map(c => c.name === updatedCharacter.name ? updatedCharacter : c)
    );
  }, []);

  return (
    <div className="min-h-screen bg-brand-bg text-text-main font-sans">
      <header className="bg-surface border-b border-border-color p-4 shadow-lg">
        <div className="container mx-auto flex items-center gap-4">
          <FilmIcon className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Script-to-Scene AI</h1>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <ScriptInput
          script={script}
          setScript={setScript}
          onGenerate={handleAnalyzeScript}
          isLoading={isLoading}
        />

        {error && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-md animate-fade-in">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {isLoading && scenes.length === 0 && (
           <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-text-secondary">Analyzing script for scenes and characters...</p>
          </div>
        )}
        
        {characters.length > 0 && (
          <StyleSelector 
            onSelectStyle={setSelectedStyle} 
            selectedStyle={selectedStyle}
          />
        )}
        
        {characters.length > 0 && selectedStyle && (
          <CharacterSheet 
            characters={characters} 
            onUpdateCharacter={handleUpdateCharacter}
            selectedStyle={selectedStyle}
          />
        )}
        {scenes.length > 0 && characters.length > 0 && selectedStyle && (
          <Timeline 
            scenes={scenes} 
            characters={characters}
            selectedStyle={selectedStyle}
          />
        )}
      </main>

       <footer className="text-center p-4 mt-8 border-t border-border-color text-text-secondary text-sm">
        <p>Powered by Gemini API. Built for creative pre-production.</p>
      </footer>
    </div>
  );
};

export default App;