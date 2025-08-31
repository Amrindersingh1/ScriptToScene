
import React from 'react';
import { SceneCard } from './SceneCard';
import type { Scene, Character, Style } from '../types';

interface TimelineProps {
  scenes: Scene[];
  characters: Character[];
  selectedStyle: Style;
}

export const Timeline: React.FC<TimelineProps> = ({ scenes, characters, selectedStyle }) => {
  return (
    <section className="mt-8 animate-fade-in">
       <h2 className="text-xl font-semibold mb-4 text-text-main">4. Scene Timeline</h2>
       <p className="text-text-secondary mb-6">Your script has been broken down. Now, generate the visuals for each scene using your selected style and defined characters.</p>
      <div className="space-y-8">
        {scenes.map((scene, index) => (
          <SceneCard 
            key={scene.scene_id || index} 
            scene={scene} 
            sceneNumber={index + 1}
            characters={characters}
            selectedStyle={selectedStyle}
          />
        ))}
      </div>
    </section>
  );
};
