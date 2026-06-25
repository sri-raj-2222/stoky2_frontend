'use client';

import { useState } from 'react';

interface FitQuizProps {
  onSelectSize: (size: string) => void;
}

export default function FitQuiz({ onSelectSize }: FitQuizProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  // User input states
  const [heightFeet, setHeightFeet] = useState('5');
  const [heightInches, setHeightInches] = useState('8');
  const [weight, setWeight] = useState(70); // in kg
  const [bodyType, setBodyType] = useState('average'); // slim, average, athletic, husky

  // Calculated results
  const [recommendedSize, setRecommendedSize] = useState('M');
  const [confidence, setConfidence] = useState(94);

  const startQuiz = () => {
    setIsOpen(true);
    setStep(1);
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep((prev) => prev + 1);
    } else if (step === 3) {
      calculateSize();
      setStep(4);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const calculateSize = () => {
    // Sizing heuristic based on weight and height
    let size = 'M';
    let matchPct = 94;

    const w = weight;
    const h = parseInt(heightFeet) * 12 + parseInt(heightInches); // height in inches

    if (w < 60) {
      size = h > 70 ? 'M' : 'S';
      matchPct = bodyType === 'slim' ? 96 : 89;
    } else if (w >= 60 && w < 75) {
      size = 'M';
      matchPct = bodyType === 'average' ? 95 : 91;
    } else if (w >= 75 && w < 88) {
      size = h < 67 ? 'XL' : 'L';
      matchPct = bodyType === 'athletic' ? 97 : 92;
    } else if (w >= 88 && w < 102) {
      size = 'XL';
      matchPct = bodyType === 'husky' ? 94 : 88;
    } else {
      size = 'XXL';
      matchPct = 95;
    }

    setRecommendedSize(size);
    setConfidence(matchPct);
  };

  const handleApplySize = () => {
    onSelectSize(recommendedSize);
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={startQuiz}
          className="text-xs font-light tracking-wider text-brand-amber hover:text-brand-amber/80 transition-colors underline underline-offset-4 cursor-pointer"
        >
          Find My Size
        </button>
      )}

      {/* Quiz Modal/Panel */}
      {isOpen && (
        <div className="mt-4 p-5 border border-white/10 bg-[#070707] rounded-sm space-y-5 transition-all">
          {/* Header */}
          <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
              Sizing Assistant (Step {step}/4)
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-500 hover:text-white transition-colors text-xs"
            >
              ✕ Cancel
            </button>
          </div>

          {/* STEP 1: Height */}
          {step === 1 && (
            <div className="space-y-4">
              <label className="text-[13px] font-medium tracking-wide text-white block">
                Select your height:
              </label>
              <div className="flex gap-4">
                {/* Feet */}
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 block">
                    Feet
                  </span>
                  <select
                    value={heightFeet}
                    onChange={(e) => setHeightFeet(e.target.value)}
                    className="w-full bg-black border border-white/10 text-sm py-2 px-3 focus:outline-none focus:border-brand-amber text-white"
                  >
                    <option value="4">4&apos;</option>
                    <option value="5">5&apos;</option>
                    <option value="6">6&apos;</option>
                    <option value="7">7&apos;</option>
                  </select>
                </div>

                {/* Inches */}
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 block">
                    Inches
                  </span>
                  <select
                    value={heightInches}
                    onChange={(e) => setHeightInches(e.target.value)}
                    className="w-full bg-black border border-white/10 text-sm py-2 px-3 focus:outline-none focus:border-brand-amber text-white"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={String(i)}>
                        {i}&quot;
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Weight Range Slider */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <label className="text-[13px] font-medium tracking-wide text-white">
                  Select your weight:
                </label>
                <span className="text-sm font-bold text-brand-amber">
                  {weight} kg ({Math.round(weight * 2.20462)} lbs)
                </span>
              </div>
              <input
                type="range"
                min="45"
                max="130"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value))}
                className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-brand-amber"
              />
              <div className="flex justify-between text-[9px] text-neutral-500 uppercase tracking-wider font-bold">
                <span>45 kg</span>
                <span>85 kg</span>
                <span>130 kg</span>
              </div>
            </div>
          )}

          {/* STEP 3: Body Type Silhouettes */}
          {step === 3 && (
            <div className="space-y-4">
              <label className="text-[13px] font-medium tracking-wide text-white block">
                Select your body type:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'slim', label: 'Slim', desc: 'Lean build' },
                  { id: 'average', label: 'Average', desc: 'Standard build' },
                  { id: 'athletic', label: 'Athletic', desc: 'Muscular build' },
                  { id: 'husky', label: 'Husky', desc: 'Broad build' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      setBodyType(type.id);
                      // Auto calculate and advance
                      const prevBodyType = bodyType;
                      setBodyType(type.id);
                      setTimeout(() => {
                        calculateSize();
                        setStep(4);
                      }, 100);
                    }}
                    className={`p-3 text-left border transition-all ${
                      bodyType === type.id
                        ? 'border-brand-amber bg-brand-amber/5'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span className={`text-xs font-bold uppercase tracking-wider block ${
                      bodyType === type.id ? 'text-brand-amber' : 'text-white'
                    }`}>
                      {type.label}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-light mt-0.5 block">
                      {type.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Recommended Size & Confidence Bar */}
          {step === 4 && (
            <div className="space-y-4 text-center py-2">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-neutral-400 block">
                  Recommended Fit
                </span>
                <p className="text-4xl font-black text-white">{recommendedSize}</p>
              </div>

              {/* Confidence Bar */}
              <div className="space-y-2 max-w-xs mx-auto">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <span>Sizing Confidence</span>
                  <span className="text-brand-amber">{confidence}% Match</span>
                </div>
                <div className="relative w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-brand-amber transition-all duration-1000"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2">
                <button
                  onClick={handleApplySize}
                  className="w-full bg-white text-black py-2.5 text-xs font-bold uppercase tracking-[0.2em] hover:bg-neutral-200 transition-colors"
                >
                  Apply {recommendedSize} Sizing
                </button>
              </div>
            </div>
          )}

          {/* Navigation Controls (except step 4) */}
          {step < 4 && (
            <div className="flex gap-2 pt-2 border-t border-white/5 justify-between">
              {step > 1 ? (
                <button
                  onClick={handlePrevStep}
                  className="text-xs border border-white/10 text-white hover:bg-white/5 py-2 px-4 uppercase font-bold tracking-wider"
                >
                  ← Back
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={handleNextStep}
                className="text-xs bg-white text-black hover:bg-neutral-200 py-2 px-4 uppercase font-bold tracking-wider"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
