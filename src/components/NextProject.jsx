import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { sizedSrc } from '../lib/images';
import './NextProject.css';

/*
 * End of a gallery (after bunqlabs.com / daikifujita.com): the next project's cover grows from a
 * framed card to the full screen as you keep scrolling, and at the very end you are taken into
 * it. Tapping the cover goes there straight away.
 */
const ENTER_AT = 0.985;

export default function NextProject({ project }) {
  const { dict, localePath } = useLanguage();
  const t = dict.projectDetail;
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const ref = useRef(null);
  const [entering, setEntering] = useState(false);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  const clipPath = useTransform(scrollYProgress, [0, 0.8], ['inset(18% 22% 18% 22% round 16px)', 'inset(0% 0% 0% 0% round 0px)']);
  const scale = useTransform(scrollYProgress, [0, 0.8], [1.25, 1]);
  const titleY = useTransform(scrollYProgress, [0, 0.8], ['40%', '0%']);
  const bar = useTransform(scrollYProgress, [0.8, ENTER_AT], [0, 1]);

  const enter = () => {
    if (entering) return;
    setEntering(true);
    setTimeout(() => navigate(localePath(`/project/${project.id}`)), 650);
  };

  useMotionValueEvent(scrollYProgress, 'change', (p) => {
    if (p >= ENTER_AT) enter();
  });

  return (
    <section ref={ref} className="next-project" aria-label={`${t.nextProject}: ${project.title}`}>
      <div className="next-project-sticky">
        <motion.button
          type="button"
          className="next-project-media"
          style={reduceMotion ? undefined : { clipPath }}
          onClick={enter}
          data-cursor-text="VIEW"
          aria-label={`${t.nextProject}: ${project.title}`}
        >
          <motion.img
            src={sizedSrc(project.coverImage, window.innerWidth * (window.devicePixelRatio || 1))}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ ...(reduceMotion ? {} : { scale }), objectPosition: project.coverPosition || 'center' }}
          />
          <span className="next-project-shade" />
        </motion.button>
        <motion.div className="next-project-title" style={reduceMotion ? undefined : { y: titleY }} aria-hidden="true">
          <span>{t.nextProject}</span>
          <strong>{project.title}</strong>
          {project.subtitle && <em>{project.subtitle}</em>}
        </motion.div>
        <div className="next-project-bar" aria-hidden="true">
          <motion.span style={{ scaleX: bar }} />
          <small>{t.nextHint}</small>
        </div>
        {entering && (
          <motion.div className="next-project-entering" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {t.nextEntering}
          </motion.div>
        )}
      </div>
    </section>
  );
}
