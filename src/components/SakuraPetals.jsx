
import { useEffect, useRef } from "react";

const PETAL_COUNT = 12;

const BLOSSOMS = [
  { x: 245, y: 34 },
  { x: 190, y: 94 },
  { x: 125, y: 136 },
  { x: 82, y: 169 },
  { x: 330, y: 14 },
];

const randomBetween = (min, max) =>
  min + Math.random() * (max - min);

function getBlossomPosition(branch, blossom) {
  if (!branch) return null;

  const matrix = branch.getScreenCTM();
  if (!matrix) return null;

  const point = branch.createSVGPoint();
  point.x = blossom.x;
  point.y = blossom.y;

  const screenPoint = point.matrixTransform(matrix);

  return { x: screenPoint.x, y: screenPoint.y };
}

function createPetal(index, branchRef, initial = false) {
  const branch = branchRef.current;
  const blossom = BLOSSOMS[
    Math.floor(Math.random() * BLOSSOMS.length)
  ];

  const origin = getBlossomPosition(branch, blossom);

  // Fallback until the branch is available.
  const x = origin ? origin.x : window.innerWidth * 0.85;
  const y = origin ? origin.y : 40;

  return {
    id: index,
    x: x - (initial ? randomBetween(0, 35) : 0),
    y: y + (initial ? randomBetween(0, 55) : 0),
    size: randomBetween(5, 9),
    speed: randomBetween(22, 36),
    drift: randomBetween(12, 24),
    phase: randomBetween(0, Math.PI * 2),
    frequency: randomBetween(0.3, 0.7),
    rotation: randomBetween(0, 360),
    spin: randomBetween(-30, 30),
    opacity: randomBetween(0.4, 0.7),
  };
}

export default function SakuraPetals({ branchRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    let width = window.innerWidth;
    let height = window.innerHeight;
    let animationFrame;
    let previousTime = 0;
    let elapsed = 0;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;

      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    }

    resize();

    const petals = Array.from({ length: PETAL_COUNT }, (_, index) =>
      createPetal(index, branchRef, true)
    );

    function drawPetal(petal, time) {
      const sway =
        Math.sin(time * petal.frequency + petal.phase) *
        petal.drift;

      const flutter =
        Math.sin(time * 1.3 + petal.phase) * 3;

      context.save();
      context.translate(petal.x + sway, petal.y);
      context.rotate((petal.rotation * Math.PI) / 180);
      context.globalAlpha = petal.opacity;
      context.fillStyle = "#f3a4c2";

      context.beginPath();
      context.moveTo(0, -petal.size);
      context.bezierCurveTo(
        petal.size + flutter,
        -petal.size * 0.7,
        petal.size * 1.1,
        petal.size * 0.7,
        0,
        petal.size
      );
      context.bezierCurveTo(
        -petal.size * 0.8,
        petal.size * 0.5,
        -petal.size * 0.8,
        -petal.size * 0.5,
        0,
        -petal.size
      );
      context.fill();
      context.restore();
    }

    function animate(timestamp) {
      if (previousTime === 0) previousTime = timestamp;

      const delta = Math.min((timestamp - previousTime) / 1000, 0.05);
      previousTime = timestamp;

      if (!reducedMotion.matches) elapsed += delta;

      context.clearRect(0, 0, width, height);

      if (!reducedMotion.matches) {
        const time = elapsed;

        const wind =
          Math.sin(time * 0.35) * 18 +
          Math.sin(time * 0.72) * 7;

        for (const petal of petals) {
          // Gradually change each petal's horizontal drift.
          const localWind =
            Math.sin(time * petal.frequency + petal.phase) *
            petal.drift;

          petal.y += petal.speed * delta;
          petal.x += (-24 + wind * 0.35 + localWind * 0.15) * delta;
          petal.rotation += petal.spin * delta;

          drawPetal(petal, time + petal.phase);

          if (
            petal.y > height + 20 ||
            petal.x < -30 ||
            petal.x > width + 30
          ) {
            Object.assign(
              petal,
              createPetal(petal.id, branchRef)
            );
          }
        }
      } else {
        for (const petal of petals) {
          drawPetal(petal, 0);
        }
      }

      animationFrame = window.requestAnimationFrame(animate);
    }

    animationFrame = window.requestAnimationFrame(animate);
    window.addEventListener("resize", resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, [branchRef]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
