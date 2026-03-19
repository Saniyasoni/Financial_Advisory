import { motion, AnimatePresence } from "framer-motion";

import soil from "../assets/tree/soil.png";
import seed from "../assets/tree/seed.png";
import sprout from "../assets/tree/sprout.png";
import plant from "../assets/tree/small_plant.png";
import tree from "../assets/tree/tall_plant.png";
import moneyTree from "../assets/tree/money-tree.png";

const stageImages = [null, seed, sprout, plant, tree, moneyTree];

export default function TreeGrowth({ stage = 0, quote = "" }) {
  const currentImg = stageImages[Math.min(stage, stageImages.length - 1)] || null;
  const showSoil = stage === 0;

  return (
    <div className="tree-root">
      {/* Motivational quote – changes with every phase */}
      <AnimatePresence mode="wait">
        {quote && (
          <motion.div
            key={stage}
            className="quote"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            {quote}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sunlight – full panel glow */}
      {stage >= 3 && (
        <motion.div
          className="sunlight"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          transition={{ duration: 1.8 }}
        />
      )}

      <div className="tree-container">
        {/* Soil – same size as every other stage */}
        <AnimatePresence>
          {showSoil && (
            <motion.img
              src={soil}
              className="soil-img"
              alt="soil"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7 }}
            />
          )}
        </AnimatePresence>

        {/* Tree image – FIXED size across ALL phases */}
        {currentImg && (
          <motion.img
            key={stage}
            src={currentImg}
            className="tree-img"
            alt={`stage ${stage}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        )}

        {/* Realistic rain droplets (only stage 2) */}
        <AnimatePresence>
          {stage === 2 &&
            [...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="droplet"
                initial={{ y: -80, opacity: 0.85 }}
                animate={{ y: 420, opacity: [0.85, 0.4, 0] }}
                transition={{
                  duration: 0.55 + Math.random() * 0.45,
                  delay: i * 0.07,
                  repeat: Infinity,
                  repeatDelay: 0.3 + Math.random() * 1.2,
                }}
                style={{
                  left: `${8 + i * 6.8}%`,
                  height: `${22 + Math.random() * 18}px`,
                  width: `${1.8 + Math.random() * 1}px`,
                }}
              />
            ))}
        </AnimatePresence>

        {/* Coin particles (stage 5) */}
        <AnimatePresence>
            {stage === 5 &&
            [...Array(15)].map((_, i) => {
                const startX = Math.random() * 100;     // starting position across width
                const startY = Math.random() * 100;     // starting position across height

                const moveX = Math.random() * 200 - 100; // random drift
                const moveY = Math.random() * 200 - 100;

                return (
                <motion.div
                    key={i}
                    className="coin"
                    style={{
                    left: `${startX}%`,
                    top: `${startY}%`
                    }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{
                    x: moveX,
                    y: moveY,
                    opacity: [0, 1, 1, 0],
                    rotate: Math.random() * 720
                    }}
                    transition={{
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 2,
                    repeat: Infinity,
                    repeatType: "mirror"
                    }}
                >
                    ₹
                </motion.div>
                );
            })}
        </AnimatePresence>

        {/* Sparkles (stage 5) */}
        <AnimatePresence>
          {stage === 5 &&
            [...Array(9)].map((_, i) => (
              <motion.div
                key={i}
                className="sparkle"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.6, 0], opacity: [0, 1, 0] }}
                transition={{
                  duration: 1.3,
                  delay: i * 0.18 + Math.random() * 0.5,
                  repeat: Infinity,
                }}
                style={{
                  top: `${12 + Math.random() * 88}%`,
                  left: `${12 + Math.random() * 300}px`,
                }}
              />
            ))}
        </AnimatePresence>
      </div>

      <style>{`
        .tree-root {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          overflow: hidden;
        }

        .quote{
            width:80%;
            max-width:600px;
            margin-top:24px;
            text-align:center;

            font-size:20px;
            line-height:1.5;

            color:#ffffff;
            font-style:italic;
            font-weight:600;

            padding:14px 20px;
            border-radius:14px;

            background:rgba(20,25,60,0.4);
            text-shadow:0 4px 15px rgba(0,0,0,0.85);
            }

        .sunlight {
          position: absolute;
          top: -20%;
          left: -10%;
          width: 120%;
          height: 120%;
          background: radial-gradient(circle at 50% 30%, rgba(255, 252, 170, 0.65) 15%, transparent 55%);
          filter: blur(38px);
          z-index: 1;
          pointer-events: none;
        }

        .tree-container {
          position: relative;
          width: 100%;
          height: 500px;
        }

        .soil-img,
        .tree-img {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          height: 130%;
          width: auto;
          max-width: 100%;
          object-fit: contain;
          z-index: 3;
        }

        .soil-img {
          z-index: 2;
        }

        .tree-img {
          animation: treeSway 7.5s ease-in-out infinite;
          transform-origin: bottom center;
          will-change: transform;
        }

        .droplet {
          position: absolute;
          top: -30px;
          background: linear-gradient(transparent, #81d4ff, #e0f7ff);
          border-radius: 40% 40% 0 0;
          box-shadow: 0 0 8px #81d4ff;
          z-index: 4;
          opacity: 0.75;
        }

        .coin{
        position:absolute;
        width:30px;
        height:30px;
        background:#ffdb4d;
        border-radius:50%;

        display:flex;
        align-items:center;
        justify-content:center;

        font-size:15px;
        font-weight:bold;
        color:#111;

        box-shadow:0 0 15px #ffea80;
        z-index:5;
        pointer-events:none;
        }
        .sparkle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 14px #fff, 0 0 26px #ffff99;
          z-index: 6;
          pointer-events: none;
        }

        @keyframes treeSway {
          0%, 100% { transform: translateX(-50%) rotate(-1.1deg); }
          50%      { transform: translateX(-50%) rotate(1.3deg); }
        }
      `}</style>
    </div>
  );
}