import React, { useState } from 'react';
import { motion } from 'framer-motion';
import AppleSwitch from '../components/AppleSwitch';
import PageTransition from '../components/PageTransition';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import './AppleSwitchShowcase.css';

export default function AppleSwitchShowcase() {
  const { language, setLanguage } = useLanguage();
  const [switch1, setSwitch1] = useState(true);
  const [switch2, setSwitch2] = useState(false);
  const [switch3, setSwitch3] = useState(true);
  const [switchTone, setSwitchTone] = useState(false);
  const [switchCustom, setSwitchCustom] = useState(true);

  return (
    <PageTransition>
      <main className="switch-showcase-page container">
        <header className="switch-showcase-header">
          <span className="switch-showcase-tag">[ COMPONENT SPECIFICATION ]</span>
          <h1 className="switch-showcase-title">APPLE SWITCH</h1>
          <p className="switch-showcase-desc">
            Animated toggle switch inspired by iOS, crafted with draggable thumb,
            liquid press feedback, spring physics, size presets, and tone variants.
            Designed by Léo (Unlumen UI).
          </p>
        </header>

        {/* Section 1: Live Interactive Test Bench */}
        <section className="switch-showcase-section">
          <h2 className="switch-section-heading">01 / SIZE PRESETS &amp; DRAGGABLE INTERACTION</h2>
          <div className="switch-cards-grid">
            {/* Small */}
            <div className="switch-card">
              <div className="switch-card-badge">SIZE: SM (44 × 24px)</div>
              <div className="switch-card-preview">
                <AppleSwitch
                  size="sm"
                  checked={switch1}
                  onCheckedChange={setSwitch1}
                  label="Haptic feedback"
                  description="Subtle vibration on trigger"
                />
              </div>
              <div className="switch-card-footer">
                <span>STATE: {switch1 ? 'ON (TRUE)' : 'OFF (FALSE)'}</span>
              </div>
            </div>

            {/* Medium */}
            <div className="switch-card">
              <div className="switch-card-badge">SIZE: MD (58 × 32px)</div>
              <div className="switch-card-preview">
                <AppleSwitch
                  size="md"
                  checked={switch2}
                  onCheckedChange={setSwitch2}
                  label="Auto sync"
                  description="Keep project data up to date."
                />
              </div>
              <div className="switch-card-footer">
                <span>STATE: {switch2 ? 'ON (TRUE)' : 'OFF (FALSE)'}</span>
              </div>
            </div>

            {/* Large */}
            <div className="switch-card">
              <div className="switch-card-badge">SIZE: LG (72 × 38px)</div>
              <div className="switch-card-preview">
                <AppleSwitch
                  size="lg"
                  checked={switch3}
                  onCheckedChange={setSwitch3}
                  label="Cinema 4K Stream"
                  description="Prioritize uncompressed video buffer"
                />
              </div>
              <div className="switch-card-footer">
                <span>STATE: {switch3 ? 'ON (TRUE)' : 'OFF (FALSE)'}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Tone Variants */}
        <section className="switch-showcase-section">
          <h2 className="switch-section-heading">02 / TONE VARIANTS</h2>
          <div className="switch-cards-grid">
            <div className="switch-card">
              <div className="switch-card-badge">TONE: NEUTRAL (APPLE GREEN)</div>
              <div className="switch-card-preview">
                <AppleSwitch
                  tone="neutral"
                  size="md"
                  checked={switchTone}
                  onCheckedChange={setSwitchTone}
                  label="Classic iOS Green"
                  description="#34c759 active glow"
                />
              </div>
            </div>

            <div className="switch-card">
              <div className="switch-card-badge">TONE: ACCENT (MONOCHROME WHITE)</div>
              <div className="switch-card-preview">
                <AppleSwitch
                  tone="accent"
                  size="md"
                  checked={!switchTone}
                  onCheckedChange={(val) => setSwitchTone(!val)}
                  label="Minimalist White"
                  description="High contrast archival look"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Live Portfolio Language Connection */}
        <section className="switch-showcase-section">
          <h2 className="switch-section-heading">03 / LIVE PORTFOLIO CONNECTION (ES / EN)</h2>
          <div className="switch-card switch-card-full">
            <div className="switch-card-badge">GLOBAL LANGUAGE SYNC</div>
            <div className="switch-card-preview">
              <AppleSwitch
                size="md"
                tone="neutral"
                checked={language === 'en'}
                onCheckedChange={(val) => setLanguage(val ? 'en' : 'es')}
                label={language === 'en' ? 'English Language Active' : 'Idioma Español Activo'}
                description={
                  language === 'en'
                    ? 'All project titles and narratives are rendered in English.'
                    : 'Todos los títulos y textos se muestran en castellano.'
                }
              />
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </PageTransition>
  );
}
