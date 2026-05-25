'use client';

import { useCallback, useRef } from 'react';
import { PokemonType } from '../types/pokemon';

export function useAudio() {
  const isPlayingRef = useRef(false);

  const playPokemonName = useCallback(async (pokemon: PokemonType) => {
    if (typeof window === 'undefined') return;

    isPlayingRef.current = true;

    // If has pre-recorded audio, play that
    if (pokemon.audio_filename) {
      const audio = new Audio(`/audio/${pokemon.audio_filename}`);
      try {
        await audio.play();
        audio.onended = () => {
          isPlayingRef.current = false;
        };
        return;
      } catch {
        // fall through to TTS
      }
    }

    // Use Web Speech API (free, browser-native TTS)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(pokemon.name_zh_simplified);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.8;
      utterance.pitch = 1;

      // Try to find a Chinese voice
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const chineseVoice = voices.find(
          (v) => v.lang.startsWith('zh') || v.lang.startsWith('cmn')
        );
        if (chineseVoice) utterance.voice = chineseVoice;
      };

      loadVoices();
      // Some browsers load voices asynchronously
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', loadVoices, {
          once: true,
        });
      }

      utterance.onend = () => {
        isPlayingRef.current = false;
      };
      utterance.onerror = () => {
        isPlayingRef.current = false;
      };

      window.speechSynthesis.speak(utterance);
    } else {
      isPlayingRef.current = false;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isPlayingRef.current = false;
  }, []);

  return { playPokemonName, stopPlayback };
}
