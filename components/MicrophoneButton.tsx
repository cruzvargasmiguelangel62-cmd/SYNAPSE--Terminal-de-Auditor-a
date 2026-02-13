
import React, { useEffect, useRef } from 'react';

interface MicrophoneButtonProps {
  onTranscript: (text: string) => void;
  isListening: boolean;
  setIsListening: (val: boolean) => void;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ 
  onTranscript, 
  isListening, 
  setIsListening 
}) => {
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = 'es-ES';
      rec.interimResults = true;
      rec.continuous = true;

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) onTranscript(finalTranscript);
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, [onTranscript, setIsListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  if (!recognitionRef.current) return null;

  return (
    <button
      onClick={toggleListening}
      className={`flex items-center gap-3 px-5 py-2.5 rounded border transition-all duration-300 ${
        isListening 
          ? 'border-red-500 bg-red-500/10 text-red-500' 
          : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-sky-500 hover:text-sky-400'
      }`}
    >
      <div className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`} />
      <span className="text-xs font-bold uppercase tracking-widest">
        {isListening ? 'Grabando Audio...' : 'Dictado por Voz'}
      </span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    </button>
  );
};
