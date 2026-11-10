import React, { useEffect } from 'react';
import PageTransition from '../components/PageTransition';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import './Legal.css';

/*
 * Legal notice, privacy policy and cookies on one page (LSSI-CE + RGPD). The texts live in
 * translations.js (legal.sections); each section has an anchor (#aviso, #privacidad, #cookies)
 * so the contact form can link straight to the privacy part.
 */
export default function Legal() {
  const { dict } = useLanguage();
  const t = dict.legal;

  useEffect(() => {
    const id = window.location.hash.slice(1);
    const el = id && document.getElementById(id);
    if (el) el.scrollIntoView();
    else window.scrollTo(0, 0);
  }, []);

  return (
    <PageTransition>
      <main className="legal-page">
        <header className="legal-head container">
          <span className="legal-tag">{t.tag}</span>
          <h1 className="legal-title">{t.title}</h1>
          <p className="legal-updated">{t.updated}</p>
          <nav className="legal-toc" aria-label={t.title}>
            {t.sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}>{s.title}</a>
            ))}
          </nav>
        </header>

        <div className="legal-body container">
          {t.sections.map((s, i) => (
            <section key={s.id} id={s.id} className="legal-section">
              <span className="legal-num">{String(i + 1).padStart(2, '0')}</span>
              <div>
                <h2>{s.title}</h2>
                {s.blocks.map((b) => (
                  <div key={b.h} className="legal-block">
                    <h3>{b.h}</h3>
                    {b.p.map((p) => <p key={p}>{p}</p>)}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <Footer />
    </PageTransition>
  );
}
