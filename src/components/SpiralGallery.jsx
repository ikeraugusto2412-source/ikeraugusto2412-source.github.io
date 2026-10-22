import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import { createRenderGate, isLowPowerViewport } from '../lib/renderGate';
import { sizedSrc } from '../lib/images';
import './SpiralGallery.css';

const vertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uMap;
  uniform vec3 uCameraPosition;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);
    float facing = max(abs(dot(normalize(vWorldNormal), viewDir)), 0.3);
    float falloff = smoothstep(-0.2, 0.6, facing) * 0.35 + 0.65;
    vec3 color = tex.rgb * falloff;
    gl_FragColor = vec4(color, tex.a);
  }
`;

export default function SpiralGallery({ images = [], title = 'New York', onSelectImage, isReady = true }) {
  const containerRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const isReadyRef = useRef(isReady);

  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !images.length) return;

    let isDisposed = false;
    let animFrameId = null;

    // Dimensions
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 750;

    // Scene & Camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(0, 0, 11);

    // Phones: capped pixel ratio, no MSAA and fewer tiles keep older iPhones at 60 fps
    const lowPower = isLowPowerViewport();

    // Renderer with transparent background
    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !lowPower, alpha: true, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
      renderer.setSize(width, height);
      renderer.setClearAlpha(0);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
      container.appendChild(renderer.domElement);
    } catch (e) {
      console.warn('WebGL could not be initialized:', e);
      return;
    }

    // Camera position uniform
    const cameraPosUniform = { value: camera.position.clone() };

    // Texture Loader - Exactly 1 tile per unique photo, ZERO duplicates
    const textureLoader = new THREE.TextureLoader();
    const totalTiles = Math.min(images.length, lowPower ? 28 : 50);
    const uniqueImages = images.slice(0, totalTiles);
    const textures = uniqueImages.map((src) => {
      // Tiles are small: a 640 px copy is plenty and keeps GPU memory low on phones
      const tex = textureLoader.load(sizedSrc(src, 640));
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      return tex;
    });

    // Spiral / Cone geometry configuration
    const isMobile = window.innerWidth <= 768;
    const mobileScale = isMobile ? 0.72 : 1.0;

    const revolutions = 4;
    const tilesPerRevolution = Math.ceil(totalTiles / revolutions);
    const stepAngle = (Math.PI * 2) / tilesPerRevolution;
    const aspectFactor = 1.1;
    const spiralGap = 0.35;

    // Conical shape: starts small at top (0.5), expands downwards (5.5)
    const startRadius = 0.5 * mobileScale;
    const endRadius = 5.5 * mobileScale;

    // Precalculate vertical heights accumulator
    const heights = [0];
    for (let i = 0; i < totalTiles; i++) {
      const t = i / totalTiles;
      const r = startRadius + (endRadius - startRadius) * t;
      const tileWidth = ((2 * Math.PI * r) / tilesPerRevolution) * aspectFactor;
      heights.push(heights[i] - (tileWidth + spiralGap) / tilesPerRevolution);
    }

    const totalHeight = Math.abs(heights[totalTiles]);
    const yCenterOffset = totalHeight * 0.48;

    const spiralGroup = new THREE.Group();
    scene.add(spiralGroup);

    const materials = [];
    const geometries = [];

    // Construct each curved tile along the helical ribbon (24 segments per tile)
    const segments = 24;
    for (let i = 0; i < totalTiles; i++) {
      const t = i / totalTiles;
      const radius = startRadius + (endRadius - startRadius) * t;
      const arcWidth = (2 * Math.PI * radius) / tilesPerRevolution;
      const tileHeight = arcWidth * aspectFactor;
      const arcAngle = arcWidth / radius;
      const yPos = (heights[i] + heights[i + 1]) / 2 + yCenterOffset;
      const verticalPitch = heights[i + 1] - heights[i];

      const positions = [];
      const uvs = [];
      const indices = [];

      for (let row = 0; row <= 1; row++) {
        for (let col = 0; col <= segments; col++) {
          const colFrac = col / segments;
          const rAngle = (colFrac - 0.5) * arcAngle;
          const px = Math.sin(rAngle) * radius;
          const py = (row - 0.5) * tileHeight + (colFrac - 0.5) * verticalPitch;
          const pz = Math.cos(rAngle) * radius;

          positions.push(px, py, pz);
          uvs.push(colFrac, row);
        }
      }

      for (let col = 0; col < segments; col++) {
        const topIdx = col;
        const btmIdx = topIdx + segments + 1;
        indices.push(topIdx, btmIdx, topIdx + 1, btmIdx, btmIdx + 1, topIdx + 1);
      }

      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      geom.setIndex(indices);
      geom.computeVertexNormals();
      geometries.push(geom);

      const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uMap: { value: textures[i] },
          uCameraPosition: cameraPosUniform,
        },
        side: THREE.DoubleSide,
        transparent: true,
      });
      materials.push(mat);

      const mesh = new THREE.Mesh(geom, mat);
      mesh.position.y = yPos;

      const tileGroup = new THREE.Group();
      tileGroup.rotation.y = i * stepAngle;
      tileGroup.add(mesh);
      spiralGroup.add(tileGroup);
    }

    // Interaction states - 0 baseSpeed so spiral stays static until interacted with
    let baseSpeed = 0;
    let angularVelocity = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let targetYOffset = 0;

    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let lastScrollY = window.scrollY || 0;
    let lastTime = performance.now();

    // Mouse move / hover parallax
    const onPointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const clientX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
      const clientY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);

      if (isDragging) {
        const deltaX = clientX - prevPointerX;
        const deltaY = clientY - prevPointerY;
        angularVelocity += deltaX * 0.006;
        targetYOffset += deltaY * 0.008;
        prevPointerX = clientX;
        prevPointerY = clientY;
      } else {
        const normX = (clientX - rect.left) / rect.width - 0.5;
        const normY = (clientY - rect.top) / rect.height - 0.5;
        targetTiltX = normX * 0.35;
        targetTiltY = normY * 0.25;
      }
    };

    const onPointerDown = (e) => {
      isDragging = true;
      setIsInteracting(true);
      prevPointerX = e.clientX ?? (e.touches ? e.touches[0].clientX : 0);
      prevPointerY = e.clientY ?? (e.touches ? e.touches[0].clientY : 0);
    };

    const onPointerUp = () => {
      isDragging = false;
      setIsInteracting(false);
    };

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > 2) {
        angularVelocity += -e.deltaY * 0.00035;
      }
    };

    const onScroll = () => {
      const currentScrollY = window.scrollY || 0;
      const scrollDiff = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      angularVelocity += -scrollDiff * 0.0007;

      const rect = container.getBoundingClientRect();
      const viewportCenter = window.innerHeight / 2;
      const containerCenter = rect.top + rect.height / 2;
      const scrollProgress = (viewportCenter - containerCenter) / window.innerHeight;
      targetYOffset = -scrollProgress * 1.8;
    };

    const onResize = () => {
      const newWidth = container.clientWidth || window.innerWidth;
      const newHeight = container.clientHeight || 750;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    container.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('mouseup', onPointerUp);

    container.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    container.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    // Intro blossoming animation
    let introStartTime = null;
    const introDuration = 1100; // ms

    // Animation Loop
    const animate = (now) => {
      if (isDisposed) return;
      // Off screen or tab hidden: stop until the gate reopens
      if (!gate.active) {
        animFrameId = null;
        return;
      }
      animFrameId = requestAnimationFrame(animate);

      const delta = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      // 3D Intro Expansion - starts once isReady becomes true
      if (isReadyRef.current && !introStartTime) {
        introStartTime = now;
      }

      const introElapsed = introStartTime ? now - introStartTime : 0;
      const introProgress = introStartTime ? Math.min(1, introElapsed / introDuration) : (isReadyRef.current ? 1 : 0);
      const introEase = introProgress === 1 ? 1 : 1 - Math.pow(2, -10 * introProgress);

      const scale = (isReadyRef.current || introStartTime) ? (0.55 + 0.45 * introEase) : 0.55;
      spiralGroup.scale.set(scale, scale, scale);

      // Inertia & friction
      angularVelocity *= 0.925;
      const introSpinVelocity = introStartTime ? (1 - introEase) * 0.016 : 0;
      spiralGroup.rotation.y += baseSpeed + angularVelocity + introSpinVelocity;

      // Smooth camera / group parallax
      spiralGroup.position.x += (targetTiltX * 1.5 - spiralGroup.position.x) * 0.06;
      spiralGroup.position.y += (targetYOffset - targetTiltY * 1.2 - spiralGroup.position.y) * 0.06;
      spiralGroup.rotation.x += (targetTiltY * 0.4 - spiralGroup.rotation.x) * 0.06;
      spiralGroup.rotation.z += (-targetTiltX * 0.3 - spiralGroup.rotation.z) * 0.06;

      cameraPosUniform.value.copy(camera.position);

      renderer.render(scene, camera);
    };

    const gate = createRenderGate(container, (active) => {
      if (active && !animFrameId && !isDisposed) {
        lastTime = performance.now();
        animFrameId = requestAnimationFrame(animate);
      }
    });
    animFrameId = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      isDisposed = true;
      gate.dispose();
      if (animFrameId) cancelAnimationFrame(animFrameId);

      container.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);

      container.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);

      container.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);

      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && renderer.domElement.parentNode) {
          renderer.domElement.parentNode.removeChild(renderer.domElement);
        }
      }
    };
  }, [images]);

  return (
    <div className="spiral-gallery-wrapper">
      {/* Monumental Header with masked slide-up entrance */}
      <div className="spiral-gallery-header">
        <div className="spiral-title-mask">
          <motion.span
            className="spiral-brand-name"
            initial={{ y: 80, opacity: 0 }}
            animate={isReady ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            IK®
          </motion.span>
        </div>

        <div className="spiral-title-mask">
          <motion.h1
            className="spiral-project-title"
            initial={{ y: 90, opacity: 0 }}
            animate={isReady ? { y: 0, opacity: 1 } : { y: 90, opacity: 0 }}
            transition={{ delay: 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {title}
          </motion.h1>
        </div>
      </div>

      {/* Badge Row with staggered fade-up */}
      <motion.div
        className="spiral-badge-row"
        initial={{ opacity: 0, y: 20 }}
        animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 0.16, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="spiral-badge">[3D HELIX GALLERY]</span>
        <span className="spiral-hint">DRAG TO ROTATE · SCROLL TO EXPLORE</span>
      </motion.div>

      <div
        ref={containerRef}
        className={`spiral-3d-stage ${isInteracting ? 'is-interacting' : ''}`}
      />

      <div className="spiral-bottom-fade" />
    </div>
  );
}
