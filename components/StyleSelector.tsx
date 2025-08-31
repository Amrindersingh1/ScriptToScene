
import React from 'react';
import { STYLES } from '../constants';
import type { Style } from '../types';
import { StyleCard } from './StyleCard';

interface StyleSelectorProps {
  onSelectStyle: (style: Style) => void;
  selectedStyle: Style | null;
}

export const StyleSelector: React.FC<StyleSelectorProps> = ({ onSelectStyle, selectedStyle }) => {
  return (
    <section className="mt-8 animate-fade-in">
      <h2 className="text-xl font-semibold mb-4 text-text-main">2. Select a Visual Style</h2>
      <p className="text-text-secondary mb-6">
        Choose a style to apply to all generated characters and scenes. This will ensure a consistent look and feel.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STYLES.map((style) => (
          <StyleCard
            key={style.id}
            style={style}
            isSelected={selectedStyle?.id === style.id}
            onSelect={() => onSelectStyle(style)}
          />
        ))}
      </div>
    </section>
  );
};
