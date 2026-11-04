import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { projects } from '../data/projects';
import { MAP_LAND, MAP_VIEW } from '../data/mapLand';
import { sizedSrc } from '../lib/images';
import './ProjectMap.css';

/*
 * Where the work was made: a dotted map with one point per project. Hover (or tap) a point to
 * see the project; click it (or the card) to open it. Hugo Bravo's ride is drawn as a route.
 * The land outline is pre-projected by scripts/build-map.mjs.
 */
const PLACES = {
  'new-york': [-74.0, 40.71],
  london: [-0.13, 51.5],
  norway: [6.86, 61.7],
  'huck-knife-pro': [9.19, 45.46],
  'the-weeknd': [2.15, 41.36],
  'tour-de-france': [1.81, 41.24],
  'hugo-bravo': [2.35, 48.85], // Paris, start of the Paris → Sitges ride
};
const ROUTES = { 'hugo-bravo': [[2.35, 48.85], [1.81, 41.24]] };
const LABEL_BELOW = new Set(['tour-de-france']);

const { lon0, lon1, lat0, lat1, width: W, height: H } = MAP_VIEW;
const proj = ([lon, lat]) => [((lon - lon0) / (lon1 - lon0)) * W, ((lat1 - lat) / (lat1 - lat0)) * H];

export default function ProjectMap() {
  const { dict, localePath, language } = useLanguage();
  const t = dict.works;
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const firstTap = useRef(false); // touch: was this point not yet shown when the finger went down?
  const points = projects.filter((p) => PLACES[p.id]);
  const current = points.find((p) => p.id === active);

  const open = (id) => navigate(localePath(`/project/${id}`));

  return (
    <section className="project-map" aria-label={t.mapTitle}>
      <div className="project-map-head">
        <h2>{t.mapTitle}</h2>
        <span>{t.mapHint}</span>
      </div>
      <div className="project-map-frame">
        <svg viewBox={`0 0 ${W} ${H}`} role="presentation">
          <defs>
            <pattern id="project-map-dots" width="7" height="7" patternUnits="userSpaceOnUse">
              <circle cx="3.5" cy="3.5" r="1.3" />
            </pattern>
            <clipPath id="project-map-clip">
              <rect width={W} height={H} />
            </clipPath>
          </defs>
          <path d={MAP_LAND} className="project-map-land" clipPath="url(#project-map-clip)" />
          {Object.entries(ROUTES).map(([id, [a, b]]) => {
            const [x0, y0] = proj(a);
            const [x1, y1] = proj(b);
            return (
              <path
                key={id}
                d={`M${x0},${y0} Q${x0 + 30},${(y0 + y1) / 2} ${x1},${y1}`}
                className={`project-map-route ${active === id ? 'is-on' : ''}`}
              />
            );
          })}
          {points.map((p) => {
            const [x, y] = proj(PLACES[p.id]);
            const below = LABEL_BELOW.has(p.id);
            return (
              <g
                key={p.id}
                className={`project-map-point ${active === p.id ? 'is-on' : ''}`}
                role="link"
                tabIndex={0}
                aria-label={`${p.title} — ${t.places[p.id]}`}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(p.id)}
                onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
                onFocus={() => setActive(p.id)}
                onBlur={() => setActive(null)}
                onPointerDown={(e) => {
                  firstTap.current = e.pointerType !== 'mouse' && active !== p.id;
                }}
                onClick={() => {
                  // Touch: the first tap shows the card, a second tap (or the card) opens the project
                  if (firstTap.current) setActive(p.id);
                  else open(p.id);
                  firstTap.current = false;
                }}
                onKeyDown={(e) => e.key === 'Enter' && open(p.id)}
                data-cursor-text="VIEW"
              >
                <circle cx={x} cy={y} r="22" className="project-map-hit" />
                <circle cx={x} cy={y} r="16" className="project-map-pulse" />
                <circle cx={x} cy={y} r="5" className="project-map-pin" />
                <text x={below ? x - 10 : x + 10} y={below ? y + 24 : y - 10} textAnchor={below ? 'end' : 'start'}>
                  {t.places[p.id]}
                </text>
              </g>
            );
          })}
        </svg>

        <AnimatePresence>
          {current && (
            <motion.div
              key={current.id}
              className="project-map-card"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Link to={localePath(`/project/${current.id}`)} tabIndex={-1}>
                <img src={sizedSrc(current.coverImage, 320)} alt="" style={{ objectPosition: current.coverPosition }} />
                <span>
                  <strong>{current.title}</strong>
                  <small>{typeof current.category === 'object' ? current.category[language] || current.category.en : current.category}</small>
                </span>
                <span className="project-map-card-arrow" aria-hidden="true">→</span>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
