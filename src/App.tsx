/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Timer, RefreshCw, Info, ChevronRight, Play, AlertCircle } from 'lucide-react';

interface Color {
  h: number;
  s: number;
  l: number;
}

export default function App() {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(2); // Start with 2x2 for tutorial feel, then quickly go to 5x5
  const [colors, setColors] = useState<{ base: Color; target: Color; targetIndex: number } | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const generateColors = useCallback((currentLevel: number) => {
    const h = Math.floor(Math.random() * 360);
    const s = Math.floor(Math.random() * 60) + 20; // 20-80%
    const l = Math.floor(Math.random() * 40) + 30; // 30-70% (avoid too dark/light)

    const base: Color = { h, s, l };
    
    // Difficulty scaling: delta decreases as level increases
    // Level 1: delta 15%
    // Level 20: delta 2%
    const delta = Math.max(1, 15 - Math.floor(currentLevel / 2));
    
    // Randomly adjust H, S, or L for the target
    const target = { ...base };
    const factor = Math.random() > 0.5 ? 1 : -1;
    const channel = Math.floor(Math.random() * 3);
    
    if (channel === 0) target.h = (target.h + delta * factor + 360) % 360;
    else if (channel === 1) target.s = Math.min(100, Math.max(0, target.s + delta * factor));
    else target.l = Math.min(100, Math.max(0, target.l + delta * factor));

    // Grid size logic: start small, then lock at 5x5
    let currentGridSize = 5;
    if (currentLevel === 1) currentGridSize = 2;
    else if (currentLevel === 2) currentGridSize = 3;
    else if (currentLevel === 3) currentGridSize = 4;
    else currentGridSize = 5;

    setGridSize(currentGridSize);
    setColors({
      base,
      target,
      targetIndex: Math.floor(Math.random() * (currentGridSize * currentGridSize))
    });
  }, []);

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setTimeLeft(15);
    setGameState('playing');
    generateColors(1);
  };

  const handleBlockClick = (index: number) => {
    if (gameState !== 'playing' || !colors) return;

    if (index === colors.targetIndex) {
      // Correct!
      const newScore = score + 1;
      const newLevel = level + 1;
      setScore(newScore);
      setLevel(newLevel);
      setTimeLeft(prev => Math.min(15, prev + 2)); // Add some time back
      generateColors(newLevel);
    } else {
      // Wrong! Penalty
      setTimeLeft(prev => Math.max(0, prev - 3));
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setGameState('gameover');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, timeLeft]);

  const colorToCSS = (c: Color) => `hsl(${c.h}, ${c.s}%, ${c.l}%)`;

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#1a1a1a] font-sans selection:bg-black selection:text-white flex flex-col items-center p-4 md:p-8">
      {/* Header */}
      <header className="w-full max-w-2xl flex justify-between items-center mb-8">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Chroma Vision</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium opacity-60">Art Student Challenge</p>
        </div>
        <button 
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 rounded-full hover:bg-black/5 transition-colors"
        >
          <Info size={20} />
        </button>
      </header>

      {/* Main Game Area */}
      <main className="w-full max-w-2xl flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {gameState === 'idle' && (
            <motion.div 
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white p-8 rounded-3xl shadow-sm border border-black/5 text-center max-w-md"
            >
              <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Play size={32} fill="currentColor" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Ready to test your eyes?</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Find the one square that has a slightly different color. The differences will become more subtle as you progress.
              </p>
              <button 
                onClick={startGame}
                className="w-full py-4 bg-black text-white rounded-2xl font-semibold hover:bg-black/90 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Start Challenge <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div 
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full flex flex-col items-center"
            >
              {/* Stats Bar */}
              <div className="w-full flex justify-between mb-8 px-4">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Score</span>
                    <div className="flex items-center gap-2">
                      <Trophy size={16} className="text-amber-500" />
                      <span className="text-2xl font-mono font-medium">{score}</span>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-black/10 mx-2" />
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Level</span>
                    <span className="text-2xl font-mono font-medium">{level}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Time Remaining</span>
                  <div className={`flex items-center gap-2 ${timeLeft < 5 ? 'text-red-500 animate-pulse' : ''}`}>
                    <Timer size={16} />
                    <span className="text-2xl font-mono font-medium">{timeLeft}s</span>
                  </div>
                </div>
              </div>

              {/* Grid Container */}
              <div 
                className="aspect-square w-full max-w-[500px] bg-white p-4 rounded-3xl shadow-sm border border-black/5 grid gap-3"
                style={{ 
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  gridTemplateRows: `repeat(${gridSize}, 1fr)`
                }}
              >
                {colors && Array.from({ length: gridSize * gridSize }).map((_, i) => (
                  <motion.button
                    key={`${level}-${i}`}
                    whileHover={{ scale: 0.98 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleBlockClick(i)}
                    className="rounded-xl w-full h-full transition-shadow hover:shadow-inner cursor-pointer"
                    style={{ 
                      backgroundColor: i === colors.targetIndex ? colorToCSS(colors.target) : colorToCSS(colors.base)
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              key="gameover"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white p-10 rounded-3xl shadow-sm border border-black/5 text-center max-w-md w-full"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-3xl font-bold mb-1">Time's Up!</h2>
              <p className="text-gray-500 mb-8">Your color sensitivity is impressive.</p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-[#f9f9f9] p-4 rounded-2xl">
                  <span className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Final Score</span>
                  <span className="text-3xl font-mono font-bold">{score}</span>
                </div>
                <div className="bg-[#f9f9f9] p-4 rounded-2xl">
                  <span className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Max Level</span>
                  <span className="text-3xl font-mono font-bold">{level}</span>
                </div>
              </div>

              <button 
                onClick={startGame}
                className="w-full py-4 bg-black text-white rounded-2xl font-semibold hover:bg-black/90 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                Try Again <RefreshCw size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Info Modal / Overlay */}
      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowInfo(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white max-w-lg w-full rounded-3xl p-8 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">How it works</h3>
              <div className="space-y-4 text-gray-600 leading-relaxed">
                <p>
                  This challenge tests your <span className="text-black font-medium">Just-Noticeable Difference (JND)</span>—the smallest change in a stimulus that can be detected.
                </p>
                <div className="bg-[#f5f5f5] p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-black">Hue (H)</span>
                    <span className="text-xs">The color type (0-360°)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-blue-300" />
                    <span className="text-sm font-medium text-black">Saturation (S)</span>
                    <span className="text-xs">The intensity of the color</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-gray-400" />
                    <span className="text-sm font-medium text-black">Lightness (L)</span>
                    <span className="text-xs">The brightness of the color</span>
                  </div>
                </div>
                <p className="text-sm italic">
                  As you level up, the "Delta" (difference) between the base color and the target square decreases from 15% down to as low as 1%.
                </p>
              </div>
              <button 
                onClick={() => setShowInfo(false)}
                className="mt-8 w-full py-3 bg-[#f5f5f5] text-black rounded-xl font-medium hover:bg-black/5 transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="mt-8 text-center">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          Designed for Visual Training
        </p>
      </footer>
    </div>
  );
}
