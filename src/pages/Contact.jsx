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
  const [submitted, setSubmitted] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [typingTick, setTypingTick] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('ikeraugusto2412@gmail.com').then(() => {
      sileo.success({
        title: '¡Email copiado!',
        description: 'ikeraugusto2412@gmail.com',
      });
    }).catch(() => {
      sileo.error({
        title: 'No se pudo copiar',
        description: 'Cópialo manualmente.',
      });
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTypingTick((t) => t + 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Open mailto and show success toast
    window.location.assign(generateMailto());
    sileo.success({
      title: '¡Mensaje listo!',
      description: 'Se ha abierto tu cliente de correo.',
    });
    setSubmitted(true);
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
    return `mailto:ikeraugusto2412@gmail.com?subject=${subject}&body=${body}`;
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
                    title="Copiar email al portapapeles"
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
                      <label className="form-label">{dict.contact.nameLabel}</label>
                      <input
                        type="text"
                        name="name"
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
                      <label className="form-label">{dict.contact.emailLabel}</label>
                      <input
                        type="email"
                        name="email"
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
                      <label className="form-label">{dict.contact.companyLabel}</label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField('company')}
                        onBlur={() => setFocusedField(null)}
                        placeholder={dict.contact.companyPlaceholder}
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">{dict.contact.timelineLabel}</label>
                      <input
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
                    <label className="form-label">{dict.contact.messageLabel}</label>
                    <textarea
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
                    <label className="form-label">{dict.contact.sourceLabel}</label>
                    <select
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

                  <motion.button
                    type="submit"
                    className="form-submit-btn"
                    onMouseEnter={() => setFocusedField('submit')}
                    onMouseLeave={() => setFocusedField(null)}
                    {...lift}
                  >
                    <span>{dict.contact.submitBtn}</span>
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
                  <h3 className="contact-success-title">{dict.contact.successTitle}</h3>
                  <p className="contact-success-desc">
                    {dict.contact.successDesc.replace('{name}', formData.name)}
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
