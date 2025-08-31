
import React from 'react';
import type { Style } from '../types';

interface StyleCardProps {
  style: Style;
  isSelected: boolean;
  onSelect: () => void;
}

export const StyleCard: React.FC<StyleCardProps> = ({ style, isSelected, onSelect }) => {
  const selectionClasses = isSelected
    ? 'ring-4 ring-primary ring-offset-2 ring-offset-brand-bg'
    : 'ring-2 ring-transparent hover:ring-primary/50';

  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer rounded-lg overflow-hidden border border-border-color bg-surface transition-all duration-300 ${selectionClasses}`}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
    >
      <div className="aspect-video overflow-hidden">
        <img
          src={style.imageUrl}
          alt={`Visual style preview for ${style.name}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-3">
        <h4 className="font-semibold text-center text-text-main">{style.name}</h4>
      </div>
    </div>
  );
};
