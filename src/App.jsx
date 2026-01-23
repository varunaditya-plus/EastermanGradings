import { useState, useEffect, useRef } from 'react';
import NoiseOverlay from './NoiseOverlay';

export default function App() {
  const [input, setInput] = useState('');
  const [audios, setAudios] = useState(null);
  const [currentText, setCurrentText] = useState('');
  const audioRef = useRef(null);
  const playTimeoutRef = useRef(null);

  useEffect(() => {
    fetch('/audios.json')
      .then(res => res.json())
      .then(data => setAudios(data))
      .catch(err => console.error('Failed to load audios:', err));
  }, []);

  const playAudioForGrade = (grade) => {
    if (!audios) return;

    let category = null;
    const g = grade.toUpperCase();

    if (g === 'A+') category = 'A+';
    else if (g === 'A' || g === 'A-') category = 'A';
    else if (g === 'B+' || g === 'B' || g === 'B-') category = 'B';
    else if (g === 'C+' || g === 'C' || g === 'C-') category = 'C';
    else if (g === 'D+' || g === 'D' || g === 'D-') category = 'D';
    else if (g === 'F') category = 'F';

    if (category && audios[category]) {
      const entries = audios[category];
      const randomEntry = entries[Math.floor(Math.random() * entries.length)];
      
      // Collect all possible URLs (main + mirrors)
      const possibleUrls = [randomEntry.url, ...randomEntry.mirrors.map(m => m.url)];
      const randomUrl = possibleUrls[Math.floor(Math.random() * possibleUrls.length)];

      if (audioRef.current) {
        setCurrentText(randomEntry.text);
        audioRef.current.src = randomUrl;
        audioRef.current.play().catch(e => console.error('Playback failed:', e));
      }
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toUpperCase();
    setInput(value);

    if (playTimeoutRef.current) {
      clearTimeout(playTimeoutRef.current);
    }

    const validGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];
    if (validGrades.includes(value)) {
      playTimeoutRef.current = setTimeout(() => {
        playAudioForGrade(value);
        setTimeout(() => setInput(''), 500);
      }, 300);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <NoiseOverlay intensity={2} opacity={0.2} />
      <img src="/murkoff.webp" className="absolute top-10 left-10 size-20 opacity-30" style={{ filter: 'invert(1) brightness(2)' }} />

      <audio 
        ref={audioRef} 
        onEnded={() => setCurrentText('')}
      />
      
      <div className="w-full max-w-2xl text-center">
        <h1 className="text-neutral-500 text-sm font-mono mb-8 tracking-widest uppercase">
          Easterman Evaluation System
        </h1>
        
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder="GRADE?"
          className="w-full bg-transparent border-b-2 border-neutral-800 text-neutral-100 text-8xl font-black text-center focus:outline-none focus:border-red-600 transition-colors uppercase placeholder:text-neutral-900"
          autoFocus
        />

        <div className="min-h-[100px] mt-12 flex items-center justify-center">
          {currentText && (
            <p className="text-neutral-400 text-xl font-mono leading-relaxed max-w-lg italic animate-pulse">
              "{currentText}"
            </p>
          )}
        </div>
        
        <div className="mt-8 text-neutral-700 text-xs font-mono">
          A+ | A | A- | B+ | B | B- | C+ | C | C- | D+ | D | D- | F
        </div>
      </div>
    </div>
  );
}
