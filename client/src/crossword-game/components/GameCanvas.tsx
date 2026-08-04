// GameCanvas.tsx — Babylon-in-React integration for the crossword reader app
// React = picture frame, Babylon = canvas, game code = the painting

import { useEffect, useRef } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { createGameScene, type GameHandle } from "@/game/scene";

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // StrictMode in React 19 mounts effects twice in dev; this ref prevents a
  // second Babylon engine from being created on the same canvas.
  const startedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || startedRef.current) return;
    startedRef.current = true;

    const engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
      adaptToDeviceRatio: true,
    });

    // createGameScene wires up the crossword reader game with camera control,
    // word navigation, and header context display.
    let handle: GameHandle | null = null;
    createGameScene(engine, canvas).then((h) => {
      handle = h;
      engine.runRenderLoop(() => h.scene.render());
    });

    const onResize = () => engine.resize();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      handle?.dispose();
      engine.dispose();
      startedRef.current = false;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full outline-none"
      style={{ touchAction: "none" }}
    />
  );
}
