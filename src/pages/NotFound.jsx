import React from 'react';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { useLanguage } from '../context/LanguageContext';
import './NotFound.css';

export default function NotFound({ message }) {
  const { dict, localePath } = useLanguage();

  return (
    <PageTransition>
      <main className="not-found">
        <span className="not-found-code">404</span>
        <h1 className="not-found-title">{message || dict.projectDetail.pageNotFound}</h1>
        <Link to={localePath('/')} className="not-found-link">{dict.projectDetail.backToPortfolio}</Link>
      </main>
    </PageTransition>
  );
}
