import { useState, useEffect, useRef } from 'react';
import NoiseOverlay from './NoiseOverlay';

export default function App() {
  const [input, setInput] = useState('');
  const [audios, setAudios] = useState(null);
  const [imposterAudios, setImposterAudios] = useState(null);
  const [imposterMode, setImposterMode] = useState('NONE'); // 'NONE', 'ADDED', 'ONLY'
  const [queues, setQueues] = useState({});
  const [currentText, setCurrentText] = useState('');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const audioRef = useRef(null);
  const playTimeoutRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch('/audios.json').then(res => res.json()),
      fetch('/imposter_audios.json').then(res => res.json())
    ])
      .then(([mainData, imposterData]) => {
        setAudios(mainData);
        setImposterAudios(imposterData);
      })
      .catch(err => console.error('Failed to load audios:', err));
  }, []);

  const shuffle = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const playAudioForGrade = (grade) => {
    if (!audios || !imposterAudios) return;

    let category = null;
    const g = grade.toUpperCase();

    if (g === 'A+') category = 'A+';
    else if (g === 'A' || g === 'A-') category = 'A';
    else if (g === 'B+' || g === 'B' || g === 'B-') category = 'B';
    else if (g === 'C+' || g === 'C' || g === 'C-') category = 'C';
    else if (g === 'D+' || g === 'D' || g === 'D-') category = 'D';
    else if (g === 'F') category = 'F';

    if (!category) return;

    // determine pool based on imposterMode
    let pool = [];
    if (imposterMode === 'NONE') {
      pool = audios[category] || [];
    } else if (imposterMode === 'ONLY') {
      pool = imposterAudios[category] || [];
    } else if (imposterMode === 'ADDED') {
      pool = [...(audios[category] || []), ...(imposterAudios[category] || [])];
    }

    if (pool.length > 0) {
      // use unique key including the mode and category
      const queueKey = `${imposterMode}-${category}`;
      let currentQueue = [...(queues[queueKey] || [])];
      
      if (currentQueue.length === 0) {
        currentQueue = shuffle([...Array(pool.length).keys()]);
      }

      const nextIndex = currentQueue.pop();
      setQueues(prev => ({ ...prev, [queueKey]: currentQueue }));

      const randomEntry = pool[nextIndex];
      
      // Collect all possible URLs (main + mirrors)
      const possibleUrls = [randomEntry.url, ...(randomEntry.mirrors || []).map(m => m.url)];
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

  const handleMouseMove = (e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <NoiseOverlay intensity={2} opacity={0.2} />
      <img src="/murkoff.png" className="absolute top-10 left-10 size-20 opacity-30" />

      <audio 
        ref={audioRef} 
        onEnded={() => setCurrentText('')}
      />
      
      <div className="w-full max-w-2xl text-center">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-neutral-500 text-sm font-mono mb-8 mt-0.5 tracking-widest uppercase">
            Easterman Evaluation System
          </h1>
          <button 
            onClick={() => setImposterMode(prev => prev === 'NONE' ? 'ADDED' : prev === 'ADDED' ? 'ONLY' : 'NONE')}
            className={`text-sm font-mono font-bold mb-8 tracking-widest uppercase border px-2 pt-0.5 transition-colors ${imposterMode === 'NONE' ? 'border-neutral-800 text-neutral-500' : imposterMode === 'ADDED' ? 'border-red-600 text-red-600' : 'bg-red-600 text-black border-red-600'}`}
          >
            {imposterMode === 'NONE' ? 'NO IMPOSTERS' : imposterMode === 'ADDED' ? 'IMPOSTERS ADDED' : 'IMPOSTERS ONLY'}
          </button>
        </div>

        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onMouseMove={handleMouseMove}
          placeholder="GRADE?"
          className="w-full bg-transparent border-b-2 border-neutral-800 text-neutral-100 text-8xl font-black text-center focus:outline-none focus:border-red-600 transition-colors uppercase placeholder:text-neutral-900"
          autoFocus
        />

        {isHovering && (
          <div 
            className="fixed pointer-events-none bg-neutral-900/90 border border-neutral-800 px-3 py-1.5 text-neutral-500 text-xs font-mono z-50 whitespace-nowrap shadow-xl"
            style={{ 
              left: mousePos.x + 20, 
              top: mousePos.y + 20 
            }}
          >
            <span className={imposterMode !== 'NONE' ? 'text-red-600' : ''}>
              A+ | A | A- | B+ | B | B- | C+ | C | C- | D+ | D | D-
            </span>
            {imposterMode !== 'ONLY' && (
              <> | <span>F</span></>
            )}
          </div>
        )}

        <div className="min-h-[100px] mt-12 flex items-center justify-center">
          {currentText && (
            <p className="text-neutral-400 text-xl font-mono leading-relaxed max-w-lg italic animate-pulse">
              "{currentText}"
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
