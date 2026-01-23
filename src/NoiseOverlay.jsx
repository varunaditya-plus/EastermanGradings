import { useEffect, useRef } from 'react';

export default function NoiseOverlay({ intensity = 1.0, opacity = 0.4, grainSize = 3 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    
    // Set canvas size to match viewport
    const generateNoise = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Generate larger grain noise by drawing blocks
      for (let x = 0; x < canvas.width; x += grainSize) {
        for (let y = 0; y < canvas.height; y += grainSize) {
          // Random value between 0-255, scaled by intensity
          const noise = Math.random() * 255 * intensity;
          ctx.fillStyle = `rgb(${noise}, ${noise}, ${noise})`;
          ctx.fillRect(x, y, grainSize, grainSize);
        }
      }

      // Add scanlines for imperfections
      ctx.strokeStyle = `rgba(0, 0, 0, ${0.15 * opacity})`;
      ctx.lineWidth = 1;
      
      for (let y = 0; y < canvas.height; y += 3) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Add random imperfections (glitches)
      const glitchCount = Math.floor(canvas.height / 200);
      
      for (let i = 0; i < glitchCount; i++) {
        const y = Math.random() * canvas.height;
        const height = Math.random() * 3 + 1;
        const alpha = Math.random() * 0.3 * opacity;
        
        ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,0,0' : '0,255,255'}, ${alpha})`;
        ctx.fillRect(0, y, canvas.width, height);
      }
    };
    
    generateNoise();
    window.addEventListener('resize', generateNoise);

    return () => {
      window.removeEventListener('resize', generateNoise);
    };
  }, [intensity, opacity, grainSize]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: opacity,
        mixBlendMode: 'overlay',
      }}
    />
  );
}
