import { useState, useEffect, useRef, useCallback } from 'react';

export interface UseVoiceAssistantReturn {
  isSpeechRecognitionSupported: boolean;
  isSpeechSynthesisSupported: boolean;
  isListening: boolean;
  transcript: string;
  speechError: string | null;
  currentlySpeakingId: string | null;
  autoSpeak: boolean;
  startListening: (langCode?: string) => void;
  stopListening: () => void;
  cancelListening: () => void;
  speak: (text: string, langCode?: string, messageId?: string) => void;
  stopSpeaking: () => void;
  toggleAutoSpeak: () => void;
  resetSpeechError: () => void;
}

export const useVoiceAssistant = (): UseVoiceAssistantReturn => {
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState<boolean>(false);
  const [isSpeechSynthesisSupported, setIsSpeechSynthesisSupported] = useState<boolean>(false);
  
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [speechError, setSpeechError] = useState<string | null>(null);

  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      setIsSpeechRecognitionSupported(!!SpeechRec);
      setIsSpeechSynthesisSupported('speechSynthesis' in window);
    }
  }, []);

  const getRecognitionLang = (langCode: string = 'auto') => {
    const l = langCode.toLowerCase();
    if (l === 'hi' || l === 'hindi') return 'hi-IN';
    if (l === 'en' || l === 'english') return 'en-IN';
    if (l === 'hinglish') return 'en-IN'; // Practical fallback for Hinglish
    return navigator.language || 'en-IN';
  };

  const startListening = useCallback((langCode: string = 'auto') => {
    if (typeof window === 'undefined') return;
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechError('Voice input is not supported in this browser. You can continue using the text assistant.');
      return;
    }

    // Stop existing recognition if active
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }

    setSpeechError(null);
    setTranscript('');

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = getRecognitionLang(langCode);

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      rec.onerror = (event: any) => {
        setIsListening(false);
        const errType = event.error;
        if (errType === 'not-allowed' || errType === 'permission-denied') {
          setSpeechError('Microphone access was not granted. You can continue using the text assistant.');
        } else if (errType === 'no-speech') {
          setSpeechError('No speech was detected. Please try again.');
        } else if (errType === 'audio-capture') {
          setSpeechError('Microphone not detected or unavailable.');
        } else if (errType === 'network') {
          setSpeechError('Network issue encountered during speech recognition.');
        } else if (errType !== 'aborted') {
          setSpeechError(`Speech recognition error (${errType}).`);
        }
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (err: any) {
      setIsListening(false);
      setSpeechError('Failed to initiate speech recognition.');
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const cancelListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        // ignore
      }
    }
    setIsListening(false);
    setTranscript('');
    setSpeechError(null);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingId(null);
  }, []);

  const speak = useCallback((text: string, langCode: string = 'en', messageId: string = 'speech') => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Stop any active speech
    window.speechSynthesis.cancel();
    setCurrentlySpeakingId(null);

    if (!text.trim()) return;

    // Clean text of markdown characters for smooth reading
    const cleanText = text
      .replace(/[\*\_~`# font]/g, '')
      .replace(/•/g, ', ')
      .replace(/\n+/g, '. ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLang = getRecognitionLang(langCode);
    utterance.lang = targetLang;

    // Find voice matching language if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const matchedVoice = voices.find(v => v.lang.toLowerCase().includes(targetLang.toLowerCase()) || v.lang.toLowerCase().includes(langCode.toLowerCase()));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onend = () => {
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = () => {
      setCurrentlySpeakingId(null);
    };

    setCurrentlySpeakingId(messageId);
    window.speechSynthesis.speak(utterance);
  }, []);

  const toggleAutoSpeak = useCallback(() => {
    setAutoSpeak(prev => !prev);
  }, []);

  const resetSpeechError = useCallback(() => {
    setSpeechError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isSpeechRecognitionSupported,
    isSpeechSynthesisSupported,
    isListening,
    transcript,
    speechError,
    currentlySpeakingId,
    autoSpeak,
    startListening,
    stopListening,
    cancelListening,
    speak,
    stopSpeaking,
    toggleAutoSpeak,
    resetSpeechError
  };
};
