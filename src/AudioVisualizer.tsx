import { useEffect, useRef } from 'react';

type AudioVisualizerProps = {
  analyser: AnalyserNode | null;
};

function AudioVisualizer({ analyser }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (analyser === null) {
      return;
    }

    const canvas = canvasRef.current;

    if (canvas === null) {
      return;
    }

    const drawingContext = canvas.getContext('2d');

    if (drawingContext === null) {
      return;
    }

    // These aliases preserve the successful null checks inside drawBars.
    const activeAnalyser = analyser;
    const activeCanvas = canvas;
    const activeDrawingContext = drawingContext;
    const frequencyData = new Uint8Array(activeAnalyser.frequencyBinCount);
    let animationFrame = 0;

    function drawBars() {
      activeAnalyser.getByteFrequencyData(frequencyData);
      activeDrawingContext.clearRect(
        0,
        0,
        activeCanvas.width,
        activeCanvas.height,
      );

      const barCount = 32;
      const gap = 2;
      const barWidth = (activeCanvas.width - gap * (barCount - 1)) / barCount;

      for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
        const frequencyValue = frequencyData[barIndex];
        const barHeight = (frequencyValue / 255) * activeCanvas.height;
        const xPosition = barIndex * (barWidth + gap);
        const yPosition = activeCanvas.height - barHeight;

        // Higher bars become pale blue, while lower bars stay deep cyan.
        const lightness = 42 + (frequencyValue / 255) * 38;
        activeDrawingContext.fillStyle =
          'hsl(197 100% ' + String(lightness) + '%)';
        activeDrawingContext.fillRect(
          xPosition,
          yPosition,
          barWidth,
          barHeight,
        );
      }

      animationFrame = requestAnimationFrame(drawBars);
    }

    drawBars();

    // Cancel the animation if React removes or replaces the analyser.
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      className="audio-visualizer"
      width="280"
      height="58"
      aria-label="Live audio frequency visualizer"
    />
  );
}

export default AudioVisualizer;
