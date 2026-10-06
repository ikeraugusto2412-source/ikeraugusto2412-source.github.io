import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Navbar from '../components/Navbar';
import './LensExperiment.css';


export default function LensExperiment() {
  const containerRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Layer 0: Camera Body Frame. Scales up just enough to pass the screen borders naturally (e.g. 5x).
  // Doesn't warp to 25x. Fades out smoothly as the lens fills the screen.
  const scaleBody = useTransform(scrollYProgress, [0, 0.25], [1, 5]);
  const opacityBody = useTransform(scrollYProgress, [0.15, 0.25], [1, 0]);

  // Layer 1: Outer Lens Barrel. Also scales reasonably and fades early to reveal inner glass.
  const scaleBarrel = useTransform(scrollYProgress, [0, 0.4], [1, 6]);
  const opacityBarrel = useTransform(scrollYProgress, [0.3, 0.4], [1, 0]);

  // Layer 2: Glass Elements (Aperture/Optics). Starts small inside the barrel.
  // Scales up massively to simulate diving THROUGH the lens.
  const scaleGlass = useTransform(scrollYProgress, [0, 0.4, 0.75], [1, 1, 20]);
  const opacityGlass = useTransform(scrollYProgress, [0.65, 0.75], [1, 0]);

  // Layer 3: The deep Sensor block. Hidden entirely at start, fades in only after entering the lens.
  const scaleSensor = useTransform(scrollYProgress, [0.4, 0.8, 1], [0.8, 0.8, 5]);
  const opacitySensor = useTransform(scrollYProgress, [0.3, 0.5], [0, 1]);

  // Text Reveal: Perfectly placed over the sensor at the end.
  const opacityText = useTransform(scrollYProgress, [0.85, 1], [0, 1]);
  const scaleText = useTransform(scrollYProgress, [0.85, 1], [0.8, 1]);

  return (
    <>
      <Navbar />
      <div className="lens-container" ref={containerRef}>
        <div className="lens-sticky-wrapper">
          
          {/* Deepest: Sensor */}
          <motion.div 
            className="fuji-layer fuji-sensor-layer"
            style={{ scale: scaleSensor, opacity: opacitySensor }}
          >
            <div className="fuji-sensor-chamber">
              <div className="fuji-sensor-grid"></div>
            </div>
          </motion.div>

          {/* Deep: Glass & Aperture */}
          <motion.div 
            className="fuji-layer fuji-glass-layer"
            style={{ scale: scaleGlass, opacity: opacityGlass }}
          >
            <div className="fuji-glass-element">
               <div className="fuji-aperture-blades">
                <div className="f-blade f-b1"></div>
                <div className="f-blade f-b2"></div>
                <div className="f-blade f-b3"></div>
                <div className="f-blade f-b4"></div>
                <div className="f-blade f-b5"></div>
                <div className="f-blade f-b6"></div>
              </div>
            </div>
            <div className="fuji-front-glass-reflection"></div>
          </motion.div>

          {/* Mid: Lens Barrel */}
          <motion.div 
            className="fuji-layer fuji-barrel-layer"
            style={{ scale: scaleBarrel, opacity: opacityBarrel }}
          >
            <div className="fuji-outer-barrel">
               <div className="fuji-barrel-text">SUPER EBC FUJINON LENS 23mm 1:2</div>
            </div>
          </motion.div>

          {/* Front: Camera Body */}
          <motion.div 
            className="fuji-layer fuji-body-layer"
            style={{ scale: scaleBody, opacity: opacityBody }}
          >
            <div className="fuji-camera-body">
              <div className="fuji-top-plate">
                <div className="fuji-hotshoe"></div>
                {/* Dials Left to Right */}
                <div className="fuji-dial iso-dial">
                  <div className="dial-top"></div>
                </div>
                <div className="fuji-dial shutter-dial">
                  <div className="dial-top"></div>
                </div>
                <div className="fuji-dial exp-dial">
                  <div className="dial-top"></div>
                </div>
                {/* Shutter Button */}
                <div className="fuji-shutter-button">
                  <div className="shutter-thread"></div>
                </div>
              </div>
              <div className="fuji-leather-bottom">
                 <div className="fuji-viewfinder-front"></div>
                 <div className="fuji-focus-assist"></div>
              </div>
            </div>
          </motion.div>

          {/* Destination: Text */}
          <motion.div 
            className="fuji-destination-text"
            style={{ opacity: opacityText, scale: scaleText }}
          >
            <h1>CAPTURING <br/> THE UNSEEN.</h1>
            <p className="fuji-subtitle">Diseño Fujifilm X-Series</p>
          </motion.div>

        </div>
      </div>
    </>
  );
}
