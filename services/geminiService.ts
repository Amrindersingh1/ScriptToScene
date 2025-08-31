import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { Scene, Character } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Parses a caught error to extract a user-friendly message from the Gemini API response.
 * @param error The error object caught in a try/catch block.
 * @returns A string containing the user-friendly error message.
 */
export function getApiErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        try {
            // The API error is often a JSON string inside the 'message' property
            const errorBody = JSON.parse(error.message);
            if (errorBody.error && errorBody.error.message) {
                return errorBody.error.message;
            }
        } catch (e) {
            // If parsing fails, it's likely not the expected JSON structure.
            // Fallback to the standard error message.
            return error.message;
        }
    }
    return 'An unexpected error occurred. Please try again.';
}

/**
 * Wraps an API call with a retry mechanism that uses exponential backoff.
 * This is useful for handling rate-limiting errors (429).
 * @param apiCall The asynchronous function to call.
 * @param maxRetries The maximum number of times to retry.
 * @param initialDelay The initial delay in milliseconds before the first retry.
 * @returns A Promise that resolves with the result of the API call.
 */
const callApiWithRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 5, initialDelay = 1000): Promise<T> => {
    let lastError: unknown;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error;
            let isRateLimitError = false;

            if (error instanceof Error) {
                 try {
                    const errorBody = JSON.parse(error.message);
                    if (errorBody?.error?.status === 'RESOURCE_EXHAUSTED' || errorBody?.error?.code === 429) {
                        isRateLimitError = true;
                    }
                } catch (e) {
                    // Not a JSON error message, it's not a rate limit error we can parse.
                }
            }

            if (isRateLimitError) {
                const delay = initialDelay * Math.pow(2, i) + Math.random() * 1000; // Add jitter
                console.warn(`Rate limit exceeded. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // Not a retriable error, so fail fast.
                throw error;
            }
        }
    }
    throw lastError; // Rethrow the last error after all retries fail.
};

const sceneSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      scene_id: { type: Type.STRING, description: "A unique identifier for the scene, e.g., S01, S02." },
      location: { type: Type.STRING, description: "The primary location of the scene." },
      time: { type: Type.STRING, description: "The time of day, e.g., Morning, Night, Dusk." },
      mood: { type: Type.STRING, description: "The emotional tone or visual mood of the scene." },
      characters: { type: Type.ARRAY, items: { type: Type.STRING }, description: "A list of character names present in the scene." },
      camera_movement: { type: Type.STRING, description: "A suggested cinematic camera movement, e.g., 'Slow dolly-in, 50mm lens'." },
    },
    required: ["scene_id", "location", "time", "mood", "characters", "camera_movement"],
  },
};

const characterSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: "The name of the character." },
            description: { type: Type.STRING, description: "A detailed visual description of the character's appearance, including hair, clothing, age, and defining features. Suitable for an image generation model." }
        },
        required: ["name", "description"],
    },
};


export async function parseScriptToScenes(script: string): Promise<Scene[]> {
  const prompt = `
    Analyze the following film script. Your task is to break it down into distinct scenes and extract key metadata for each one.
    For each scene, identify the scene ID, location, time of day, emotional tone/mood, characters involved, and suggest a cinematic camera movement.
    Only include characters explicitly mentioned in the scene.
    Return the output as a JSON array of scene objects.

    SCRIPT:
    ---
    ${script}
    ---
  `;

  const response = await callApiWithRetry(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: sceneSchema,
    },
  }));

  const jsonString = response.text.trim();
  try {
    return JSON.parse(jsonString) as Scene[];
  } catch (error) {
    console.error("Failed to parse scene JSON response:", jsonString);
    throw new Error("The AI returned an invalid JSON format for scenes.");
  }
}

export async function extractCharactersFromScript(script: string): Promise<Character[]> {
    const prompt = `
        Analyze the provided script and identify all the main characters. For each character, create a detailed visual description that can be used for a text-to-image model.
        Focus on physical attributes, clothing style, estimated age, and any unique features mentioned or implied.
        Return the output as a JSON array of character objects.

        SCRIPT:
        ---
        ${script}
        ---
    `;

    const response = await callApiWithRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: characterSchema,
        },
    }));

    const jsonString = response.text.trim();
    try {
        return JSON.parse(jsonString) as Character[];
    } catch (error) {
        console.error("Failed to parse character JSON response:", jsonString);
        throw new Error("The AI returned an invalid JSON format for characters.");
    }
}

export async function generateImageForPrompt(prompt: string, aspectRatio: '16:9' | '1:1' = '16:9'): Promise<string> {
  const fullPrompt = `${prompt}. Aspect ratio: ${aspectRatio}.`;

  const response = await callApiWithRetry(() => ai.models.generateContent({
    model: 'gemini-2.5-flash-image-preview',
    contents: {
      parts: [{ text: fullPrompt }],
    },
    config: {
      responseModalities: [Modality.IMAGE, Modality.TEXT],
    },
  }));

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
      }
    }
  }
  
  throw new Error("Image generation failed to return an image.");
}


export async function generateVideoForScene(prompt: string, startFrameBase64: string): Promise<string> {
    const base64Data = startFrameBase64.split(',')[1];
    
    let operation = await callApiWithRetry(() => ai.models.generateVideos({
        model: 'veo-2.0-generate-001',
        prompt: prompt,
        image: {
            imageBytes: base64Data,
            mimeType: 'image/png',
        },
        config: {
            numberOfVideos: 1,
        }
    }));

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await callApiWithRetry(() => ai.operations.getVideosOperation({ operation: operation }));
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }

    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error("Failed to download the generated video file.");
    }

    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
}