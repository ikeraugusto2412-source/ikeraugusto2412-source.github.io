import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './ProjectCard.css';

export default function ProjectCard({ project, index }) {
  const { language } = useLanguage();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <div className="project-card" ref={ref}>
      <Link to={`/project/${project.id}`} className="project-link">
        <div className="project-image-container">
          <motion.img 
            style={{ y }}
            src={project.coverImage} 
            alt={project.title} 
            className="project-image"
          />
          <div className="project-overlay">
            <span>{language === 'es' ? 'Ver Proyecto' : 'View Project'}</span>
          </div>
        </div>
        <div className="project-info">
          <h3>{project.title}</h3>
          <p>{typeof project.category === 'object' ? (project.category[language] || project.category.en) : project.category}</p>
        </div>
      </Link>
    </div>
  );
}
