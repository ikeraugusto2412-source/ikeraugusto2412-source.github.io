import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import Footer from '../components/Footer';
import { useLanguage } from '../context/LanguageContext';
import { sileo } from 'sileo';
import ContactSphereCompanion from '../components/ContactSphereCompanion';
import DrawLine from '../components/DrawLine';
import { pressable, lift } from '../components/motion/pressable';
import './Contact.css';

const CONTACT_EMAIL = 'ikeraugusto2412@gmail.com';
// Web3Forms access key (public by design). Without it the form falls back to the visitor's email app.
const FORM_KEY = import.meta.env.VITE_WEB3FORMS_KEY;

/* ─── Shared Animated Divider ─── */
function Line({ delay = 0 }) {
  return (
    <motion.div
      className="contact-line"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay }}
      style={{ originX: 0 }}
    />
  );
}

export default function Contact() {
  const { dict } = useLanguage();

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    timeline: '',
    message: '',
    sourceIdx: 0,
  });
  const [submitted, setSubmitted] = useState(false); // false | 'sent' | 'mailto'
  const [sending, setSending] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [typingTick, setTypingTick] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCopyEmail = () => {
    Promise.resolve(navigator.clipboard?.writeText(CONTACT_EMAIL))
      .then(() => {
        if (!navigator.clipboard) throw new Error('no clipboard');
        sileo.success({ title: dict.contact.toastEmailCopied, description: CONTACT_EMAIL });
      })
      .catch(() => {
        sileo.error({ title: dict.contact.toastCopyFailed, description: dict.contact.toastCopyFailedDesc });
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTypingTick((t) => t + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    if (!FORM_KEY) {
      // No form service configured: hand the message to the visitor's email app
      window.location.assign(generateMailto());
      sileo.info({ title: dict.contact.toastMailtoTitle, description: dict.contact.toastMailtoDesc });
      setSubmitted('mailto');
      return;
    }

    // Honeypot: bots tick the hidden checkbox, people never see it
    if (e.currentTarget.elements.botcheck?.checked) {
      setSubmitted('sent');
      return;
    }

    setSending(true);
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: FORM_KEY,
          subject: `Consulta Web — ${formData.name || 'Mensaje de contacto'}`,
          from_name: formData.name,
          replyto: formData.email,
          name: formData.name,
          email: formData.email,
          company: formData.company,
          timeline: formData.timeline,
          source: dict.contact.sourceOptions[formData.sourceIdx],
          message: formData.message,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || `HTTP ${res.status}`);
      sileo.success({ title: dict.contact.toastSentTitle, description: dict.contact.toastSentDesc });
      setSubmitted('sent');
    } catch {
      sileo.error({ title: dict.contact.toastSendErrorTitle, description: dict.contact.toastSendErrorDesc });
    } finally {
      setSending(false);
    }
  };

  const generateMailto = () => {
    const subject = encodeURIComponent(
      `Consulta Web — ${formData.name || 'Mensaje de contacto'}`
    );
    const body = encodeURIComponent(
      `Hola Iker,\n\n` +
      `Te contacto a través de la web:\n\n` +
      `• Nombre / Name: ${formData.name}\n` +
      `• Email: ${formData.email}\n` +
      (formData.company ? `• Marca / Company: ${formData.company}\n` : '') +
      (formData.timeline ? `• Fechas / Timeline: ${formData.timeline}\n` : '') +
      `• Origen / Source: ${dict.contact.sourceOptions[formData.sourceIdx]}\n` +
      `\nMensaje / Message:\n${formData.message}\n\n` +
      `Un saludo / Best regards!`
    );
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <PageTransition>
      <main className="contact-page">
        {/* ════════ HERO ════════ */}
        <section className="contact-hero">
          <div className="contact-hero-inner container">
            <motion.span
              className="contact-tag"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {dict.contact.tag}
            </motion.span>

            <div className="contact-hero-heading">
              <div style={{ overflow: 'hidden' }}>
                <motion.h1
                  className="contact-h1-line"
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                >
                  SAY
                </motion.h1>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <motion.h1
                  className="contact-h1-line contact-h1-italic"
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.23 }}
                >
                  {dict.contact.h1}
                </motion.h1>
              </div>
            </div>

            <motion.div
              className="contact-hero-meta"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.42 }}
            >
              <p className="contact-hero-desc">
                {dict.contact.heroDesc}
              </p>
            </motion.div>
          </div>
        </section>

        <Line />

        {/* ════════ MAIN CONTACT: INFO + FORM ════════ */}
        <section className="contact-main container">
          <div className="contact-grid">
            {/* ─── Left Column: Big Interactive Sphere + Direct Info ─── */}
            <motion.div
              className="contact-info-col"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-8%' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Esfera Procedural Interactiva GRANDE */}
              <ContactSphereCompanion
                focusedField={focusedField}
                formData={formData}
                isTyping={typingTick}
                submitted={submitted}
                size={290}
              />

              {/* Direct email block */}
              <div className="contact-info-block">
                <span className="contact-info-label">{dict.contact.directEmail}</span>
                <a
                  href="mailto:ikeraugusto2412@gmail.com"
                  className="contact-info-email"
                >
                  ikeraugusto2412@gmail.com
                </a>
                <div className="contact-actions-row">
                  <motion.button
                    onClick={handleCopyEmail}
                    className="contact-btn-ghost"
                    title={dict.contact.copyEmailTitle}
                    {...pressable}
                  >
                    {dict.contact.copyEmail}
                  </motion.button>
                  <motion.a
                    href="mailto:ikeraugusto2412@gmail.com"
                    className="contact-btn-ghost"
                    {...pressable}
                  >
                    {dict.contact.openInApp}
                  </motion.a>
                </div>
              </div>

              {/* Social */}
              <div className="contact-info-block">
                <span className="contact-info-label">SOCIAL</span>
                <a
                  href="https://www.instagram.com/ikeraugusto_ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="contact-social-link"
                >
                  <div>
                    <span className="contact-social-name">INSTAGRAM</span>
                    <span className="contact-social-handle">@ikeraugusto_ph</span>
                  </div>
                  <span className="contact-social-arrow">↗</span>
                </a>
              </div>
            </motion.div>

            {/* ─── Right Column: Interactive Inquiry Form ─── */}
            <motion.div
              className="contact-form-col"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-8%' }}
              transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              {!submitted ? (
                <form onSubmit={handleSubmit}>
                  <div className="contact-form-header">
                    <h2 className="contact-form-title">
                      {dict.contact.formTitle}
                      <DrawLine trigger="inView" duration={550} delay={200} className="draw-line--accent" />
                    </h2>
                    <p className="contact-form-subtitle">
                      {dict.contact.formSubtitle}
                    </p>
                  </div>

                  {/* Input Fields */}
                  <div className="form-input-grid">
                    <div className="form-field">
                      <label className="form-label" htmlFor="contact-name">{dict.contact.nameLabel}</label>
                      <input
                        id="contact-name"
                        type="text"
                        name="name"
                        autoComplete="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        placeholder={dict.contact.namePlaceholder}
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label" htmlFor="contact-email">{dict.contact.emailLabel}</label>
                      <input
                        id="contact-email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        placeholder={dict.contact.emailPlaceholder}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-input-grid">
                    <div className="form-field">
                      <label className="form-label" htmlFor="contact-company">{dict.contact.companyLabel}</label>
                      <input
                        id="contact-company"
                        type="text"
                        name="company"
                        autoComplete="organization"
                        value={formData.company}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('company')}
                        onBlur={() => setFocusedField(null)}
                        placeholder={dict.contact.companyPlaceholder}
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label" htmlFor="contact-timeline">{dict.contact.timelineLabel}</label>
                      <input
                        id="contact-timeline"
                        type="text"
                        name="timeline"
                        value={formData.timeline}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('timeline')}
                        onBlur={() => setFocusedField(null)}
                        placeholder={dict.contact.timelinePlaceholder}
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-field full-width">
                    <label className="form-label" htmlFor="contact-message">{dict.contact.messageLabel}</label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('message')}
                      onBlur={() => setFocusedField(null)}
                      placeholder={dict.contact.messagePlaceholder}
                      className="form-textarea"
                    ></textarea>
                  </div>

                  <div className="form-field full-width">
                    <label className="form-label" htmlFor="contact-source">{dict.contact.sourceLabel}</label>
                    <select
                      id="contact-source"
                      name="sourceIdx"
                      value={formData.sourceIdx}
                      onChange={handleInputChange}
                      onFocus={() => setFocusedField('source')}
                      onBlur={() => setFocusedField(null)}
                      className="form-select"
                    >
                      {dict.contact.sourceOptions.map((opt, i) => (
                        <option key={opt} value={i} style={{ background: '#111', color: '#fff' }}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input type="checkbox" name="botcheck" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ display: 'none' }} />

                  <motion.button
                    type="submit"
                    className="form-submit-btn"
                    disabled={sending}
                    aria-busy={sending}
                    onMouseEnter={() => setFocusedField('submit')}
                    onMouseLeave={() => setFocusedField(null)}
                    {...lift}
                  >
                    <span>{sending ? dict.contact.sending : dict.contact.submitBtn}</span>
                    <span className="form-submit-arrow">→</span>
                  </motion.button>
                </form>
              ) : (
                <motion.div
                  className="contact-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="contact-success-icon">✓</div>
                  <h3 className="contact-success-title">
                    {submitted === 'sent' ? dict.contact.sentTitle : dict.contact.successTitle}
                  </h3>
                  <p className="contact-success-desc">
                    {(submitted === 'sent' ? dict.contact.sentDesc : dict.contact.successDesc)
                      .replace('{name}', formData.name)
                      .replace('{email}', formData.email)}
                  </p>

                  <div className="contact-success-brief">
                    <div className="brief-item">
                      <span className="contact-muted">{dict.contact.briefName}</span>
                      <span>{formData.name}</span>
                    </div>
                    <div className="brief-item">
                      <span className="contact-muted">{dict.contact.briefContact}</span>
                      <span>{formData.email}</span>
                    </div>
                    {formData.company && (
                      <div className="brief-item">
                        <span className="contact-muted">{dict.contact.briefCompany}</span>
                        <span>{formData.company}</span>
                      </div>
                    )}
                  </div>

                  {submitted === 'mailto' && (
                  <div className="contact-actions-row" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
                    <motion.a
                      href={generateMailto()}
                      className="form-submit-btn"
                      style={{ textDecoration: 'none', textAlign: 'center' }}
                      {...lift}
                    >
                      <span>{dict.contact.confirmEmailBtn}</span>
                    </motion.a>
                  </div>
                  )}

                  <motion.button
                    onClick={() => setSubmitted(false)}
                    className="contact-btn-ghost"
                    style={{ marginTop: '0.5rem' }}
                    {...pressable}
                  >
                    {dict.contact.editBtn}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>

        <Footer />
      </main>
    </PageTransition>
  );
}
