import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { Scene, Frame, VideoState, Character, Style } from '../types';
import { VideoStatus } from '../types';
import { generateImageForPrompt, generateVideoForScene, getApiErrorMessage } from '../services/geminiService';
import { ImageIcon } from './icons/ImageIcon';
import { VideoIcon } from './icons/VideoIcon';
import { Loader } from './Loader';
import { VIDEO_GENERATION_MESSAGES } from '../constants';

interface SceneCardProps {
  scene: Scene;
  sceneNumber: number;
  characters: Character[];
  selectedStyle: Style;
}

const MetadataItem: React.FC<{ label: string; value: string | string[] }> = ({ label, value }) => (
    <div className="text-sm">
        <span className="font-semibold text-text-secondary">{label}: </span>
        <span className="text-text-main">{Array.isArray(value) ? value.join(', ') : value}</span>
    </div>
);

const FrameDisplay: React.FC<{
  title: string,
  frame: Frame,
  isLoading: boolean,
  onPromptChange: (newPrompt: string) => void,
  onRegenerate: () => void,
  isDisabled: boolean,
}> = ({ title, frame, isLoading, onPromptChange, onRegenerate, isDisabled }) => (
    <div className="flex-1 flex flex-col">
        <h5 className="text-sm font-medium text-text-secondary mb-1">{title}</h5>
        <div className="aspect-video bg-brand-bg rounded border border-dashed border-border-color flex items-center justify-center overflow-hidden shrink-0">
            {isLoading ? (
                <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
            ) : frame.imageUrl ? (
                <img src={frame.imageUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
                <ImageIcon className="w-8 h-8 text-border-color" />
            )}
        </div>
        <div className="mt-2 flex flex-col gap-2">
            <textarea
                value={frame.prompt}
                onChange={(e) => onPromptChange(e.target.value)}
                placeholder={`Prompt for ${title}...`}
                className="w-full text-xs h-24 p-2 bg-brand-bg border border-border-color rounded focus:ring-1 focus:ring-primary focus:outline-none transition-shadow duration-200 resize-y"
                disabled={isDisabled}
                aria-label={`${title} prompt`}
            />
            <button
                onClick={onRegenerate}
                disabled={isDisabled || isLoading || !frame.prompt.trim()}
                className="text-xs w-full flex items-center justify-center gap-1 px-2 py-1 bg-primary/20 text-primary-hover font-semibold rounded hover:bg-primary/30 disabled:bg-gray-700 disabled:text-text-secondary disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? <><Loader /> Regenerating...</> : 'Regenerate'}
            </button>
        </div>
    </div>
);


export const SceneCard: React.FC<SceneCardProps> = ({ scene, sceneNumber, characters, selectedStyle }) => {
  const [startFrame, setStartFrame] = useState<Frame>({ prompt: '', imageUrl: null });
  const [endFrame, setEndFrame] = useState<Frame>({ prompt: '', imageUrl: null });
  const [videoState, setVideoState] = useState<VideoState>({ status: VideoStatus.IDLE, url: null, message: '' });
  
  const [isGeneratingStartFrame, setIsGeneratingStartFrame] = useState(false);
  const [isGeneratingEndFrame, setIsGeneratingEndFrame] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentLoadingMessage, setCurrentLoadingMessage] = useState(VIDEO_GENERATION_MESSAGES[0]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (videoState.status === VideoStatus.GENERATING) {
            interval = setInterval(() => {
                setCurrentLoadingMessage(prev => {
                    const currentIndex = VIDEO_GENERATION_MESSAGES.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % VIDEO_GENERATION_MESSAGES.length;
                    return VIDEO_GENERATION_MESSAGES[nextIndex];
                });
            }, 4000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [videoState.status]);

  const basePrompt = useMemo(() => {
    const characterDetails = scene.characters
        .map(charName => {
            const charData = characters.find(c => c.name.toLowerCase() === charName.toLowerCase());
            if (charData) {
                const charDescription = charData.imageUrl 
                    ? `who looks like the provided image reference` 
                    : `(${charData.description})`;
                return `${charData.name} ${charDescription}`;
            }
            return charName;
        })
        .join(', ');

    return `${selectedStyle.promptModifier}. 
    Location: ${scene.location}. Time: ${scene.time}. Mood: ${scene.mood}. 
    Characters present: ${characterDetails || 'None'}.`.replace(/\s+/g, ' ').trim();
  }, [scene, characters, selectedStyle]);

  const generatePrompts = useCallback(() => {
    const startPrompt = `${basePrompt} Wide shot establishing the scene. Camera movement suggests: ${scene.camera_movement}.`;
    const endPrompt = `${basePrompt} Close-up shot focusing on a key character or object, showing emotional development.`;
    setStartFrame(f => ({ ...f, prompt: startPrompt }));
    setEndFrame(f => ({ ...f, prompt: endPrompt }));
  }, [basePrompt, scene.camera_movement]);

  useEffect(() => {
    generatePrompts();
  }, [generatePrompts]);

 const getBase64Data = (dataUrl: string) => {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1];
    return { data, mimeType: mimeType || 'image/png' };
  };

  const handleGenerateStartFrame = useCallback(async () => {
    setIsGeneratingStartFrame(true);
    setError(null);
    try {
      const sceneCharacterNames = scene.characters.map(c => c.toLowerCase());
      const relevantCharacters = characters.filter(
        c => c.imageUrl && sceneCharacterNames.includes(c.name.toLowerCase())
      );
      
      const baseImages = relevantCharacters.map(char => {
        const { data, mimeType } = getBase64Data(char.imageUrl!);
        return { inlineData: { data, mimeType } };
      });
      
      const imageUrl = await generateImageForPrompt(startFrame.prompt, '16:9', baseImages);
      setStartFrame(f => ({ ...f, imageUrl }));
      return imageUrl;
    } catch (err) {
      console.error("Start frame generation failed:", err);
      setError(`Failed to generate start frame: ${getApiErrorMessage(err)}`);
      throw err; // re-throw to stop sequence
    } finally {
      setIsGeneratingStartFrame(false);
    }
  }, [startFrame.prompt, scene.characters, characters]);
  
  const handleGenerateEndFrame = useCallback(async (startFrameImageUrl: string) => {
    setIsGeneratingEndFrame(true);
    setError(null);
    try {
      const { data: startFrameData, mimeType: startFrameMimeType } = getBase64Data(startFrameImageUrl);
      const startFrameImage = { inlineData: { data: startFrameData, mimeType: startFrameMimeType } };
      
      const sceneCharacterNames = scene.characters.map(c => c.toLowerCase());
      const relevantCharacters = characters.filter(
        c => c.imageUrl && sceneCharacterNames.includes(c.name.toLowerCase())
      );
      
      const characterImages = relevantCharacters.map(char => {
        const { data, mimeType } = getBase64Data(char.imageUrl!);
        return { inlineData: { data, mimeType } };
      });

      const baseImages = [startFrameImage, ...characterImages];
      const imageUrl = await generateImageForPrompt(endFrame.prompt, '16:9', baseImages);
      setEndFrame(f => ({ ...f, imageUrl }));
    } catch (err) {
      console.error("End frame generation failed:", err);
      setError(`Failed to generate end frame: ${getApiErrorMessage(err)}`);
    } finally {
      setIsGeneratingEndFrame(false);
    }
  }, [endFrame.prompt, scene.characters, characters]);

  const handleGenerateImages = useCallback(async () => {
    try {
      const newStartFrameUrl = await handleGenerateStartFrame();
      if (newStartFrameUrl) {
          await handleGenerateEndFrame(newStartFrameUrl);
      }
    } catch(err) {
      // Error is already set by individual generation functions
    }
  }, [handleGenerateStartFrame, handleGenerateEndFrame]);

  const handleGenerateVideo = useCallback(async () => {
    if (!startFrame.imageUrl) {
        setError("Please generate the start frame image first.");
        return;
    }
    setVideoState({ status: VideoStatus.GENERATING, url: null, message: VIDEO_GENERATION_MESSAGES[0] });
    setError(null);
    try {
        const videoPrompt = `Animate this scene with this camera movement: ${scene.camera_movement}. 
                             The scene is at ${scene.location} during the ${scene.time}. The mood is ${scene.mood}.`;
        const videoUrl = await generateVideoForScene(videoPrompt, startFrame.imageUrl);
        setVideoState({ status: VideoStatus.DONE, url: videoUrl, message: '' });
    } catch (err) {
        console.error("Video generation failed:", err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`${message} This is an experimental feature and may fail. Please try again.`);
        setVideoState({ status: VideoStatus.ERROR, url: null, message: '' });
    }
  }, [startFrame.imageUrl, scene]);
  

  const canGenerateVideo = startFrame.imageUrl && endFrame.imageUrl && videoState.status === VideoStatus.IDLE;
  const isAnyImageLoading = isGeneratingStartFrame || isGeneratingEndFrame;
  const isBusy = isAnyImageLoading || videoState.status === VideoStatus.GENERATING;

  return (
    <div className="bg-surface border border-border-color rounded-lg shadow-lg p-6 animate-fade-in">
        <h3 className="text-lg font-bold text-primary mb-2">Scene {sceneNumber}: {scene.location} - {scene.time}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <MetadataItem label="Mood" value={scene.mood} />
            <MetadataItem label="Characters" value={scene.characters} />
            <MetadataItem label="Camera" value={scene.camera_movement} />
        </div>
        
        {error && <div className="my-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-md"><p>{error}</p></div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Image Generation Section */}
            <div>
                 <h4 className="font-semibold text-text-main mb-2">Frames (Director Console)</h4>
                <div className="flex flex-col md:flex-row gap-4">
                    <FrameDisplay
                        title="Start Frame"
                        frame={startFrame}
                        isLoading={isGeneratingStartFrame}
                        onPromptChange={(p) => setStartFrame(f => ({ ...f, prompt: p }))}
                        onRegenerate={handleGenerateStartFrame}
                        isDisabled={isBusy}
                    />
                    <FrameDisplay
                        title="End Frame"
                        frame={endFrame}
                        isLoading={isGeneratingEndFrame}
                        onPromptChange={(p) => setEndFrame(f => ({ ...f, prompt: p }))}
                        onRegenerate={() => startFrame.imageUrl && handleGenerateEndFrame(startFrame.imageUrl)}
                        isDisabled={isBusy || !startFrame.imageUrl}
                    />
                </div>
                 <button 
                    onClick={handleGenerateImages}
                    disabled={isBusy}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-secondary/80 text-white font-semibold rounded-md hover:bg-secondary disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                >
                    {isAnyImageLoading ? <><Loader /> Generating Frames...</> : <><ImageIcon className="w-5 h-5" /> Generate Start & End Frames</>}
                </button>
            </div>
            {/* Video Generation Section */}
            <div>
                <h4 className="font-semibold text-text-main mb-2">Cinematic Clip</h4>
                <div className="aspect-video bg-brand-bg rounded border border-dashed border-border-color flex items-center justify-center">
                   {videoState.status === VideoStatus.IDLE && <p className="text-sm text-text-secondary">Video will appear here</p>}
                   {videoState.status === VideoStatus.GENERATING && (
                       <div className="text-center p-4">
                           <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                           <p className="text-sm text-text-secondary animate-pulse-fast">{currentLoadingMessage}</p>
                       </div>
                   )}
                   {videoState.status === VideoStatus.DONE && videoState.url && (
                       <video src={videoState.url} controls autoPlay loop className="w-full h-full rounded"></video>
                   )}
                   {videoState.status === VideoStatus.ERROR && <p className="text-sm text-red-400">Video generation failed.</p>}
                </div>
                 <button
                    onClick={handleGenerateVideo}
                    disabled={!canGenerateVideo || videoState.status === VideoStatus.GENERATING}
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-semibold rounded-md hover:bg-primary-hover disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
                 >
                    {videoState.status === VideoStatus.GENERATING ? <><Loader /> Generating Clip...</> : <><VideoIcon className="w-5 h-5" /> Generate Video</>}
                 </button>
            </div>
        </div>
    </div>
  );
};