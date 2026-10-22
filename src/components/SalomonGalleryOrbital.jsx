import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { createRenderGate, isLowPowerViewport } from '../lib/renderGate';
import { sizedSrc } from '../lib/images';
import './SalomonGallery.css';

/**
 * SalomonGalleryOrbital — Orbital Rings 3D (v3)
 *
 * Arquitectura billboard:
 *  - Las tarjetas se posicionan directamente en world-space cada frame
 *  - mesh.lookAt(camera.position) → siempre cara a la cámara, sin UV invertidas
 *  - Sin grupos rotantes que distorsionen la orientación de las texturas
 *  - MeshBasicMaterial puro → sin shaders ni filtros de color
 */
export default function SalomonGalleryOrbital({
  images = [],
  title = 'Huck Knife Pro',
  isReady = true,
}) {
  const containerRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const isReadyRef = useRef(isReady);
  useEffect(() => { isReadyRef.current = isReady; }, [isReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !images.length) return;

    let isDisposed = false;
    let animFrameId = null;

    // ── Scene ────────────────────────────────────────────────────────────────
    const width  = container.clientWidth  || window.innerWidth;
    const height = container.clientHeight || 750;

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 500);
    camera.position.set(0, 3, 17);
    camera.lookAt(0, 0, 0);

    // Phones: capped pixel ratio and no MSAA keep older iPhones smooth
    const lowPower = isLowPowerViewport();

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !lowPower,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
      renderer.setSize(width, height);
      renderer.setClearAlpha(0);
      // Asegurar color limpio sin tone mapping
      renderer.toneMapping = THREE.NoToneMapping;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.style.cssText = 'width:100%;height:100%;display:block;pointer-events:none;';
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL init failed:', e);
      return;
    }

    // ── Textures ─────────────────────────────────────────────────────────────
    const loader   = new THREE.TextureLoader();
    const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
    const totalImgs = Math.min(images.length, 13);

    const textures = images.slice(0, totalImgs).map(src => {
      // Full-size photos would cost ~29 MB of GPU memory each; cards never need more than this
      const t = loader.load(sizedSrc(src, lowPower ? 640 : 1280));
      // ⚠️ Sin mipmaps para evitar artefactos de color en bordes
      t.minFilter   = THREE.LinearFilter;
      t.magFilter   = THREE.LinearFilter;
      t.generateMipmaps = false;
      t.anisotropy  = maxAniso;
      return t;
    });

    // ── Aspect ratio: portrait 2:3 (fotos Salomon son 1467×2200) ─────────────
    const CARD_W_R1 = 2.1;
    const CARD_H_R1 = CARD_W_R1 * (2200 / 1467); // ≈ 3.15

    const CARD_W_R2 = 1.7;
    const CARD_H_R2 = CARD_W_R2 * (2200 / 1467);

    // ── Billboard card builder ────────────────────────────────────────────────
    // Las cards NO están dentro de ningún grupo rotante —
    // se añaden directamente a scene y se posicionan en worldspace cada frame.
    const ring1Imgs = images.slice(1, 5);   // 4 fotos — anillo interior
    const ring2Imgs = images.slice(5, 13);  // 8 fotos — anillo exterior

    const cards = [];

    // Ring 1 — inner orbit
    ring1Imgs.forEach((_, i) => {
      const texIdx = Math.min(1 + i, textures.length - 1);
      const geo = new THREE.PlaneGeometry(CARD_W_R1, CARD_H_R1);
      const mat = new THREE.MeshBasicMaterial({
        map: textures[texIdx],
        transparent: true,
        opacity: 0,                 // starts transparent for intro
        side: THREE.FrontSide,      // FrontSide solo — billboard garantiza que siempre mirará a cámara
      });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      cards.push({
        mesh,
        baseAngle: (i / ring1Imgs.length) * Math.PI * 2,
        radius: 6.0,
        tiltX: 0.28,        // inclinación del plano orbital
        speed: 0.11,        // rad/s sentido horario
        ring: 1,
      });
    });

    // Ring 2 — outer orbit
    ring2Imgs.forEach((_, i) => {
      const texIdx = Math.min(5 + i, textures.length - 1);
      const geo = new THREE.PlaneGeometry(CARD_W_R2, CARD_H_R2);
      const mat = new THREE.MeshBasicMaterial({
        map: textures[texIdx],
        transparent: true,
        opacity: 0,
        side: THREE.FrontSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      cards.push({
        mesh,
        baseAngle: (i / ring2Imgs.length) * Math.PI * 2,
        radius: 10.8,
        tiltX: -0.16,
        speed: -0.065,      // rad/s sentido antihorario
        ring: 2,
      });
    });

    // ── Hero central ─────────────────────────────────────────────────────────
    const heroW = CARD_W_R1 * 2.0;
    const heroH = heroW * (2200 / 1467);
    const heroGeo = new THREE.PlaneGeometry(heroW, heroH);
    const heroMat = new THREE.MeshBasicMaterial({
      map: textures[0],
      transparent: true,
      opacity: 0,
      side: THREE.FrontSide,
    });
    const heroMesh = new THREE.Mesh(heroGeo, heroMat);
    scene.add(heroMesh);

    // Halo dorado detrás del hero
    const glowGeo = new THREE.CircleGeometry(heroW * 0.72, 64);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x9a7840,
      transparent: true,
      opacity: 0,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.z = -0.3;
    scene.add(glowMesh);

    // ── Orbital path rings (torus decorativos) ───────────────────────────────
    const buildTorus = (radius, tiltX) => {
      const geo = new THREE.TorusGeometry(radius, 0.012, 6, 128);
      const mat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.055,
      });
      const m = new THREE.Mesh(geo, mat);
      m.rotation.x = tiltX;
      scene.add(m);
      return m;
    };
    buildTorus(6.0,  0.28);
    buildTorus(10.8, -0.16);

    // ── Interaction ───────────────────────────────────────────────────────────
    let dragOffset  = 0;
    let dragVel     = 0;
    let isDragging  = false;
    let prevX       = 0;
    let camTiltY    = 3;         // camera Y position (modulated by hover)
    let targetCamY  = 3;
    let introStartTime = null;

    const onMouseDown = (e) => {
      isDragging = true;
      setIsInteracting(true);
      prevX   = e.clientX;
      dragVel = 0;
    };
    const onMouseUp = () => { isDragging = false; setIsInteracting(false); };

    const onMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      targetCamY = 3 - ny * 3;     // hover vertical moves camera -1.5…+4.5
      if (isDragging) {
        const dx = e.clientX - prevX;
        dragVel   = dx * 0.006;
        dragOffset += dragVel;
        prevX = e.clientX;
      }
    };

    const onTouchStart = (e) => {
      const t = e.touches[0]; if (!t) return;
      isDragging = true; setIsInteracting(true);
      prevX = t.clientX; dragVel = 0;
    };
    const onTouchEnd   = () => { isDragging = false; setIsInteracting(false); };
    const onTouchMove  = (e) => {
      const t = e.touches[0]; if (!t) return;
      const dx = t.clientX - prevX;
      dragVel   = dx * 0.006;
      dragOffset += dragVel;
      prevX = t.clientX;
    };

    const onResize = () => {
      const w = container.clientWidth  || window.innerWidth;
      const h = container.clientHeight || 750;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    container.addEventListener('mousedown',  onMouseDown);
    window.addEventListener('mousemove',     onMouseMove, { passive: true });
    window.addEventListener('mouseup',       onMouseUp);
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove',     onTouchMove,  { passive: true });
    window.addEventListener('touchend',      onTouchEnd);
    window.addEventListener('resize',        onResize);

    // ── Animation loop ────────────────────────────────────────────────────────
    const animate = (now) => {
      if (isDisposed) return;
      // Off screen or tab hidden: stop until the gate reopens
      if (!gate.active) {
        animFrameId = null;
        return;
      }
      animFrameId = requestAnimationFrame(animate);

      // Intro
      if (isReadyRef.current && !introStartTime) introStartTime = now;
      const introProg = introStartTime ? Math.min(1, (now - introStartTime) / 1500) : 0;
      const introEase = 1 - Math.pow(2, -10 * introProg);

      // Drag inertia
      if (!isDragging) {
        dragVel    *= 0.93;
        dragOffset += dragVel;
      }

      const t = now * 0.001;

      // Smooth camera vertical
      camTiltY += (targetCamY - camTiltY) * 0.045;
      camera.position.y = camTiltY;
      camera.lookAt(0, 0, 0);

      // ── Billboard cards ───────────────────────────────────────────────────
      cards.forEach(card => {
        // Compute orbital angle this frame
        const spin    = card.speed * t;
        const sign    = card.ring === 1 ? 1 : -1;
        const angle   = card.baseAngle + spin + sign * dragOffset;

        // World-space position on tilted orbital plane
        const x = Math.cos(angle) * card.radius;
        const zFlat = Math.sin(angle) * card.radius;
        const y = zFlat * Math.sin(card.tiltX);
        const z = zFlat * Math.cos(card.tiltX);

        card.mesh.position.set(x, y, z);

        // ✅ Billboard: siempre mira a la cámara → textura siempre frontal y limpia
        card.mesh.lookAt(camera.position);

        // Escala intro
        const s = 0.35 + 0.65 * introEase;
        card.mesh.scale.setScalar(s);
        card.mesh.material.opacity = introEase * 0.92;
      });

      // ── Hero float ────────────────────────────────────────────────────────
      heroMesh.position.y = Math.sin(t * 0.5)  * 0.14;
      heroMesh.position.z = Math.sin(t * 0.32) * 0.08;
      heroMesh.lookAt(camera.position);       // hero también billboard

      glowMesh.position.y  = heroMesh.position.y;
      glowMesh.position.z  = heroMesh.position.z - 0.3;
      glowMesh.lookAt(camera.position);

      const hs = 0.35 + 0.65 * introEase;
      heroMesh.scale.setScalar(hs);
      glowMesh.scale.setScalar(hs);
      heroMat.opacity  = introEase;
      glowMat.opacity  = 0.08 * introEase;

      renderer.render(scene, camera);
    };

    const gate = createRenderGate(container, (active) => {
      if (active && !animFrameId && !isDisposed) animFrameId = requestAnimationFrame(animate);
    });
    animFrameId = requestAnimationFrame(animate);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      isDisposed = true;
      gate.dispose();
      if (animFrameId) cancelAnimationFrame(animFrameId);
      container.removeEventListener('mousedown',  onMouseDown);
      window.removeEventListener('mousemove',     onMouseMove);
      window.removeEventListener('mouseup',       onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove',     onTouchMove);
      window.removeEventListener('touchend',      onTouchEnd);
      window.removeEventListener('resize',        onResize);
      textures.forEach(t => t.dispose());
      if (renderer) {
        renderer.dispose();
        renderer.domElement?.parentNode?.removeChild(renderer.domElement);
      }
    };
  }, [images]);

  return (
    <div className="salgal-wrapper">
      <div className="salgal-header">
        <div className="salgal-title-mask">
          <motion.span
            className="salgal-brand"
            initial={{ y: 80, opacity: 0 }}
            animate={isReady ? { y: 0, opacity: 1 } : {}}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            IK®
          </motion.span>
        </div>
        <div className="salgal-title-mask">
          <motion.h1
            className="salgal-title"
            initial={{ y: 90, opacity: 0 }}
            animate={isReady ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {title.toUpperCase()}
          </motion.h1>
        </div>
      </div>

      <motion.div
        className="salgal-badge-row"
        initial={{ opacity: 0, y: 20 }}
        animate={isReady ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.18, duration: 0.6 }}
      >
        <span className="salgal-badge">[ORBITAL RINGS 3D]</span>
        <span className="salgal-hint">DRAG TO ROTATE · AUTO-ORBIT</span>
      </motion.div>

      <div
        ref={containerRef}
        className={`salgal-stage ${isInteracting ? 'is-interacting' : ''}`}
      />

      <div className="salgal-bottom-fade" />
    </div>
  );
}
