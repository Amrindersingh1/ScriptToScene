
export interface Scene {
  scene_id: string;
  location: string;
  time: string;
  mood: string;
  characters: string[];
  camera_movement: string;
}

export interface Character {
  name: string;
  description: string;
  imageUrl?: string;
}

export interface Frame {
  prompt: string;
  imageUrl: string | null;
}

export enum VideoStatus {
  IDLE,
  GENERATING,
  DONE,
  ERROR,
}

export interface VideoState {
  status: VideoStatus;
  url: string | null;
  message: string;
}

export interface Style {
  id: string;
  name: string;
  imageUrl: string;
  promptModifier: string;
}
