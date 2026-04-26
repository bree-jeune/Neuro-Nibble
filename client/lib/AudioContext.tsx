import React, { createContext, useContext, ReactNode } from "react";

interface AudioContextType {
  isPlaying: boolean;
  isLoaded: boolean;
  toggleAudio: () => Promise<void>;
  startAudio: () => Promise<void>;
  stopAudio: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

interface AudioProviderProps {
  children: ReactNode;
}

// Audio is intentionally a no-op for now. The previous remote brown-noise URL
// caused AVPlayerItem -1102 errors on iOS and surfaced a red error banner that
// disrupted the calm UX. We'll restore audio once we bundle a local file.
export function AudioProvider({ children }: AudioProviderProps) {
  return (
    <AudioContext.Provider
      value={{
        isPlaying: false,
        isLoaded: false,
        toggleAudio: async () => {},
        startAudio: async () => {},
        stopAudio: async () => {},
      }}
    >
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
