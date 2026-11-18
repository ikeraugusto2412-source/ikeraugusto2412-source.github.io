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
 * see the project; click it (or the card) to open it.
 * The land outline is pre-projected by scripts/build-map.mjs.
 */
const PLACES = {
  'new-york': [-74.0, 40.71],
  london: [-0.13, 51.5],
  norway: [6.86, 61.7],
  'huck-knife-pro': [2.04, 42.5], // Font-Romeu, France
  'the-weeknd': [2.15, 41.36],
  'vie-nuit': [2.19, 41.4],
  'hyrox-barcelona': [2.13, 41.355],
  'tour-de-france': [1.81, 41.24],
};
// Points closer than this (in map units, 1000 wide) are merged into one pin, so the map never
// shows a pile of dots on top of each other. The merged pin sits on the nearest named area.
const MERGE_DIST = 45;
const AREAS = {
  barcelona: [2.17, 41.39],
};
const LABEL = { dx: 10, dy: -10, anchor: 'start' };

const { lon0, lon1, lat0, lat1, width: W, height: H } = MAP_VIEW;
const proj = ([lon, lat]) => [((lon - lon0) / (lon1 - lon0)) * W, ((lat1 - lat) / (lat1 - lat0)) * H];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// [{ id, xy, projects: [...], area? }]
function groupPoints(list) {
  const groups = [];
  list.forEach((p) => {
    const xy = proj(PLACES[p.id]);
    const near = groups.find((g) => g.members.some((m) => dist(m.xy, xy) < MERGE_DIST));
    if (near) near.members.push({ p, xy });
    else groups.push({ members: [{ p, xy }] });
  });
  return groups.map(({ members }) => {
    if (members.length === 1) return { id: members[0].p.id, xy: members[0].xy, projects: [members[0].p] };
    const c = [0, 1].map((i) => members.reduce((s, m) => s + m.xy[i], 0) / members.length);
    const area = Object.entries(AREAS)
      .map(([key, ll]) => ({ key, xy: proj(ll) }))
      .sort((a, b) => dist(a.xy, c) - dist(b.xy, c))[0];
    const onArea = area && dist(area.xy, c) < MERGE_DIST;
    return {
      id: onArea ? `area-${area.key}` : `group-${members[0].p.id}`,
      area: onArea ? area.key : null,
      xy: onArea ? area.xy : c,
      projects: members.map((m) => m.p),
    };
  });
}

const POINTS = groupPoints(projects.filter((p) => PLACES[p.id]));

export default function ProjectMap() {
  const { dict, localePath, language } = useLanguage();
  const t = dict.works;
  const navigate = useNavigate();
  const [active, setActive] = useState(null);
  const firstTap = useRef(false); // touch: was this point not yet shown when the finger went down?
  const current = POINTS.find((g) => g.id === active);

  const open = (id) => navigate(localePath(`/project/${id}`));
  const placeOf = (g) => (g.area ? t.areas[g.area] : t.places[g.id]);
  const categoryOf = (p) => (typeof p.category === 'object' ? p.category[language] || p.category.en : p.category);

  return (
    <section className="project-map" aria-label={t.mapTitle}>
      <div className="project-map-head">
        <h2>{t.mapTitle}</h2>
        <span>{t.mapHint}</span>
      </div>
      <div className="project-map-frame" onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}>
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
          {POINTS.map((g) => {
            const [x, y] = g.xy;
            const many = g.projects.length > 1;
            const place = placeOf(g);
            return (
              <g
                key={g.id}
                className={`project-map-point ${many ? 'is-group' : ''} ${active === g.id ? 'is-on' : ''}`}
                role={many ? 'button' : 'link'}
                tabIndex={0}
                aria-label={many ? `${place} — ${g.projects.length} ${t.mapProjects}` : `${g.projects[0].title} — ${place}`}
                aria-expanded={many ? active === g.id : undefined}
                onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(g.id)}
                // a group's card stays open so the pointer can reach it; it closes when leaving the map
                onPointerLeave={(e) => !many && e.pointerType === 'mouse' && setActive(null)}
                onFocus={() => setActive(g.id)}
                onPointerDown={(e) => {
                  firstTap.current = e.pointerType !== 'mouse' && active !== g.id;
                }}
                onClick={() => {
                  // Touch: the first tap shows the card, a second tap (or the card) opens the project.
                  // A group never navigates by itself: its card lists the projects.
                  if (many || firstTap.current) setActive(g.id);
                  else open(g.id);
                  firstTap.current = false;
                }}
                onKeyDown={(e) => e.key === 'Enter' && !many && open(g.id)}
                data-cursor-text={many ? undefined : 'VIEW'}
              >
                <circle cx={x} cy={y} r="22" className="project-map-hit" />
                <circle cx={x} cy={y} r={many ? 22 : 16} className="project-map-pulse" />
                <circle cx={x} cy={y} r={many ? 7 : 5} className="project-map-pin" />
                <text x={x + LABEL.dx} y={y + LABEL.dy} textAnchor={LABEL.anchor}>
                  {place}
                  {many && <tspan className="project-map-count">{` · ${g.projects.length}`}</tspan>}
                </text>
              </g>
            );
          })}
        </svg>

        <AnimatePresence>
          {current && (
            <motion.div
              key={current.id}
              className={`project-map-card ${current.projects.length > 1 ? 'is-list' : ''}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {current.projects.length > 1 && (
                <p className="project-map-card-head">
                  {placeOf(current)} · {current.projects.length} {t.mapProjects}
                </p>
              )}
              {current.projects.map((p) => (
                <Link key={p.id} to={localePath(`/project/${p.id}`)} tabIndex={current.projects.length > 1 ? 0 : -1}>
                  <img src={sizedSrc(p.coverImage, 320)} alt="" style={{ objectPosition: p.coverPosition }} />
                  <span>
                    <strong>{p.title}</strong>
                    <small>{current.projects.length > 1 ? t.places[p.id] : categoryOf(p)}</small>
                  </span>
                  <span className="project-map-card-arrow" aria-hidden="true">→</span>
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
