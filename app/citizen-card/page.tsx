"use client";

import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { Download, Upload, User } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';

export default function CitizenCardPage() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Soldato');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [barcodePattern, setBarcodePattern] = useState<number[]>([]);
  const [issueDate, setIssueDate] = useState('');
  
  const [couganLogo, setCouganLogo] = useState('');
  const [swagLogo, setSwagLogo] = useState('');
  
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBarcodePattern([...Array(30)].map(() => Math.random() > 0.5 ? 1 : 0));
    setIssueDate(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase());

    const fetchAsBase64 = async (url: string, setter: (val: string) => void) => {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const reader = new FileReader();
        reader.onloadend = () => setter(reader.result as string);
        reader.readAsDataURL(blob);
      } catch (e) {
        console.error('Failed to fetch image', url, e);
      }
    };

    fetchAsBase64('/images/logo/LOGO-COUGAN-transparan.webp', setCouganLogo);
    fetchAsBase64('/images/logo/swag.webp', setSwagLogo);
  }, []);

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (cardRef.current === null) return;
    try {
      const dataUrl = await toPng(cardRef.current, { 
        cacheBust: true, 
        pixelRatio: 2,
        skipFonts: true
      });
      const link = document.createElement('a');
      link.download = `Cougan-Citizen-ID-${name || 'Unknown'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      console.error('Failed to generate image:', err?.message || err);
      alert('Failed to generate image. Please check console.');
    }
  };

  const roles = ["Associate", "Soldato", "Capo", "Underboss", "Consigliere", "Don"];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-zinc-100 font-sans flex items-center justify-center pt-28 pb-12 px-4 sm:px-6 relative overflow-hidden">
        
        {/* Grayscale minimalist background lighting - No orange/amber */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-white/2 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl w-full mx-auto relative z-10">
          
          {/* Clean Header - Pure Grayscale */}
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-5xl font-serif tracking-wide text-white mb-3">
              Citizen <span className="text-zinc-400 italic">Dossier</span>
            </h1>
            <p className="text-zinc-500 tracking-[0.2em] text-[10px] uppercase font-medium">
              The Cougan Family Registry
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            
            {/* LEFT COLUMN: Clean Minimalist Controls (Grayscale) */}
            <div className="space-y-8 bg-[#080808] border border-zinc-900 p-8 rounded-xl shadow-2xl">
              
              <div className="space-y-6">
                
                {/* Avatar Upload */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                    Photo Identification
                  </label>
                  <div className="relative group cursor-pointer">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex items-center justify-center w-full h-32 border border-zinc-800 hover:border-zinc-600 bg-background rounded-lg transition-colors overflow-hidden">
                      {avatarUrl ? (
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-zinc-700">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover grayscale contrast-125" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-zinc-600 group-hover:text-zinc-300 transition-colors">
                          <Upload size={20} />
                          <span className="font-mono text-[9px] font-medium tracking-widest">UPLOAD PHOTO</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name Input */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                    Full Name
                  </label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase())}
                    placeholder="Enter designation..."
                    className="w-full bg-background border border-zinc-800 focus:border-zinc-600 rounded-lg p-3 text-white placeholder:text-zinc-700 outline-none transition-colors font-mono uppercase text-sm"
                  />
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold tracking-widest text-zinc-400 uppercase">
                    Syndicate Rank
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map(r => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`py-2.5 px-3 rounded-lg border text-[10px] font-medium tracking-wide uppercase transition-colors text-left
                          ${role === r 
                            ? 'bg-zinc-800 border-zinc-500 text-white' 
                            : 'bg-background border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Minimalist Generate Button */}
              <button 
                onClick={handleDownload}
                className="w-full bg-zinc-100 hover:bg-white text-black transition-colors rounded-lg py-3.5 flex items-center justify-center gap-2 mt-4"
              >
                <Download size={16} />
                <span className="font-bold tracking-wide text-sm">
                  Download ID Card
                </span>
              </button>
            </div>

            {/* RIGHT COLUMN: The Aesthetic Mafia ID Card */}
            <div className="flex flex-col items-center justify-center lg:sticky lg:top-32">
              
              <div className="w-full flex justify-between items-center mb-4">
                <span className="text-[9px] font-mono tracking-widest text-zinc-500 uppercase">Live Preview</span>
                <span className="text-[9px] font-mono text-zinc-600">ID: {name.length > 0 ? name.length * 149 : '0000'}</span>
              </div>

              {/* Card Wrapper for html-to-image */}
              <div className="w-full flex justify-center">
                
                {/* The Card - Luxury Mafia Aesthetic */}
                <div 
                  ref={cardRef}
                  className="relative w-[400px] max-w-full bg-[#080808] border border-zinc-800 rounded-xl overflow-hidden flex flex-col box-border shadow-2xl shrink-0"
                >
                  
                  {/* Subtle inner gold/amber border highlight to make it look premium */}
                  <div className="absolute inset-1 border border-amber-900/20 rounded-lg pointer-events-none z-10" />

                  {/* Gentle gradient */}
                  <div className="absolute inset-0 bg-linier-to-br from-amber-900/5 to-transparent pointer-events-none z-0" />

                  {/* Prominent but Minimalist Watermarks */}
                  {couganLogo && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.05]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={couganLogo} alt="Cougan Watermark" className="w-[110%] h-[110%] object-contain scale-110 grayscale" />
                    </div>
                  )}

                  {swagLogo && (
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-[0.08] pointer-events-none z-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={swagLogo} alt="Swag Watermark" className="w-full h-full object-contain grayscale" />
                    </div>
                  )}

                  {/* Header Section */}
                  <div className="flex justify-between items-center px-6 py-4 bg-transparent relative z-10">
                    <div className="flex items-center gap-3">
                      {couganLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={couganLogo} alt="Cougan Logo" className="w-9 h-9 object-contain opacity-90" />
                      ) : (
                        <div className="w-9 h-9 bg-zinc-900 rounded-full" />
                      )}
                      <div className="pl-1 border-l border-amber-900/30">
                        <div className="text-zinc-200 font-serif font-bold text-[15px] tracking-[0.15em] uppercase leading-none">The Cougan</div>
                        <div className="text-amber-700/60 font-mono text-[7px] tracking-[0.3em] uppercase mt-1.5">Official Syndicate</div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 flex px-6 gap-6 relative z-10 items-center pb-6">
                    {/* Left: Avatar - Aesthetic portrait frame */}
                    <div className="w-24 aspect-3/4 bg-background p-1 border border-zinc-800 rounded-sm overflow-hidden shrink-0 shadow-lg relative">
                      <div className="w-full h-full border border-amber-900/30 relative">
                        {avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover grayscale contrast-110" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-700 bg-[#0a0a0a]">
                            <User size={24} />
                          </div>
                        )}
                        {/* Corner gold accents on photo */}
                        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-amber-700/50" />
                        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-amber-700/50" />
                      </div>
                    </div>

                    {/* Right: Details */}
                    <div className="flex-1 flex flex-col space-y-4">
                      <div className="border-b border-zinc-800/80 pb-1.5">
                        <div className="text-[7px] font-semibold text-amber-700/80 tracking-[0.2em] uppercase mb-1">Subject Alias</div>
                        <div className="font-serif text-xl font-bold text-zinc-100 leading-none truncate">
                          {name || 'Unknown Subject'}
                        </div>
                      </div>
                      
                      <div className="border-b border-zinc-800/80 pb-1.5">
                        <div className="text-[7px] font-semibold text-amber-700/80 tracking-[0.2em] uppercase mb-1">Rank & Title</div>
                        <div className="font-mono text-xs font-semibold text-zinc-300 uppercase leading-none">
                          {role}
                        </div>
                      </div>

                      <div className="flex items-end justify-between pt-1">
                        <div>
                          <div className="text-[6px] font-bold text-zinc-600 tracking-widest uppercase mb-1">Issued</div>
                          <div className="font-mono text-[9px] text-zinc-400 uppercase leading-none">
                            {issueDate}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[6px] font-bold text-zinc-600 tracking-widest uppercase mb-1">Status</div>
                          <div className="font-mono text-[9px] font-bold text-amber-600 uppercase leading-none">AUTHORIZED</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Clean elegant footer */}
                  <div className="px-6 py-3 bg-background flex items-center justify-between border-t border-zinc-900 mt-auto z-10">
                    <div className="font-serif text-[8.5px] font-semibold text-zinc-500 tracking-widest italic">
                      By Order Of The Cougan Family
                    </div>
                    {swagLogo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={swagLogo} alt="Swag Logo" className="w-6 h-6 object-contain opacity-40 grayscale contrast-125" />
                    )}
                  </div>
                </div>
              </div>
              
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
