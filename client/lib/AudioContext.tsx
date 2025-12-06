import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";

interface AudioContextType {
  isPlaying: boolean;
  isLoaded: boolean;
  toggleAudio: () => Promise<void>;
  startAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const BROWN_NOISE_URL = "https://cdn.pixabay.com/download/audio/2022/10/25/audio_946f80a3c9.mp3?filename=brown-noise-127897.mp3";

interface AudioProviderProps {
  children: ReactNode;
}

export function AudioProvider({ children }: AudioProviderProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: BROWN_NOISE_URL },
          { 
            isLooping: true,
            shouldPlay: false,
            volume: 0.5,
          }
        );

        soundRef.current = sound;
        setIsLoaded(true);

        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
          }
        });
      } catch (error) {
        console.error("Failed to load audio:", error);
      }
    };

    setupAudio();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const startAudio = useCallback(async () => {
    if (soundRef.current && isLoaded) {
      try {
        await soundRef.current.playAsync();
      } catch (error) {
        console.error("Failed to play audio:", error);
      }
    }
  }, [isLoaded]);

  const stopAudio = useCallback(async () => {
    if (soundRef.current && isLoaded) {
      try {
        await soundRef.current.pauseAsync();
      } catch (error) {
        console.error("Failed to pause audio:", error);
      }
    }
  }, [isLoaded]);

  const toggleAudio = useCallback(async () => {
    if (isPlaying) {
      await stopAudio();
    } else {
      await startAudio();
    }
  }, [isPlaying, startAudio, stopAudio]);

  return (
    <AudioContext.Provider value={{ isPlaying, isLoaded, toggleAudio, startAudio, stopAudio }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
