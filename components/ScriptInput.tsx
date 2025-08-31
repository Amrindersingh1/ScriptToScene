
import React from 'react';
import { Loader } from './Loader';

interface ScriptInputProps {
  script: string;
  setScript: (script: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export const ScriptInput: React.FC<ScriptInputProps> = ({ script, setScript, onGenerate, isLoading }) => {
  return (
    <section className="bg-surface p-6 rounded-lg border border-border-color shadow-md animate-fade-in">
      <h2 className="text-xl font-semibold mb-4 text-text-main">1. Input Your Script</h2>
      <p className="text-text-secondary mb-4">Paste your script below. The AI will identify characters and parse scenes with detailed metadata.</p>
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="e.g., INT. COFFEE SHOP - MORNING. The protagonist nervously stirs his coffee..."
        className="w-full h-48 p-3 bg-brand-bg border border-border-color rounded-md focus:ring-2 focus:ring-primary focus:outline-none transition-shadow duration-200 resize-y"
        disabled={isLoading}
      />
      <div className="mt-4 flex justify-end">
        <button
          onClick={onGenerate}
          disabled={isLoading || !script.trim()}
          className="flex items-center justify-center px-6 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? (
            <>
              <Loader />
              <span>Analyzing Script...</span>
            </>
          ) : (
            'Analyze Script'
          )}
        </button>
      </div>
    </section>
  );
};
