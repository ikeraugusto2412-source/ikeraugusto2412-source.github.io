import { motion } from 'framer-motion';
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { photoProjects, videoProjects } from '../data/projects';
import ProjectCard from '../components/ProjectCard';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import './PortfolioCategory.css';

export default function PortfolioCategory() {
  const { dict } = useLanguage();
  const { type } = useParams();
  const isPhoto = type === 'fotografia' || type === 'photography' || type === 'photo';
  const projects = isPhoto ? photoProjects : videoProjects;
  const title = isPhoto ? dict.portfolioCategory.photoTitle : dict.portfolioCategory.videoTitle;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  return (
    <PageTransition>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.8 }}
        className="portfolio-category-page"
      >
        {/* Page header */}
        <div className="portfolio-category-header container">
          <motion.div
            className="portfolio-category-breadcrumb"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
          >
            <Link to="/#portfolio" className="breadcrumb-link">{dict.portfolioCategory.breadcrumb}</Link>
            <span className="breadcrumb-sep">→</span>
            <span>{title}</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="portfolio-category-title"
          >
            {title}
          </motion.h1>
        </div>

        {/* Projects list or coming soon */}
        <section className="portfolio-category-list container">
          {projects.length > 0 ? (
            projects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))
          ) : (
            <motion.div
              className="coming-soon"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <p className="coming-soon-label">{dict.portfolioCategory.comingSoon}</p>
              <p className="coming-soon-desc">{dict.portfolioCategory.comingSoonDesc}</p>
              <Link to="/#portfolio" className="coming-soon-back">
                {dict.portfolioCategory.back}
              </Link>
            </motion.div>
          )}
        </section>

        <Footer />
      </motion.div>
    </PageTransition>
  );
}
