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
    const barCount = 32;
    const trailingHeights = new Float32Array(barCount);
    let animationFrame = 0;

    function drawBars() {
      activeAnalyser.getByteFrequencyData(frequencyData);
      activeDrawingContext.clearRect(
        0,
        0,
        activeCanvas.width,
        activeCanvas.height,
      );

      const gap = 2;
      const barWidth = (activeCanvas.width - gap * (barCount - 1)) / barCount;

      for (let barIndex = 0; barIndex < barCount; barIndex += 1) {
        const frequencyValue = frequencyData[barIndex];
        const barHeight = (frequencyValue / 255) * activeCanvas.height;
        const xPosition = barIndex * (barWidth + gap);
        const yPosition = activeCanvas.height - barHeight;

        /*
         * A trail rises immediately with the live bar but falls slowly. This
         * creates the pale-blue afterimage visible above descending bars.
         */
        if (barHeight > trailingHeights[barIndex]) {
          trailingHeights[barIndex] = barHeight;
        } else {
          trailingHeights[barIndex] *= 0.94;
        }

        const trailingHeight = trailingHeights[barIndex];
        const trailingYPosition = activeCanvas.height - trailingHeight;

        activeDrawingContext.fillStyle = 'rgb(135 226 255 / 22%)';
        activeDrawingContext.fillRect(
          xPosition,
          trailingYPosition,
          barWidth,
          trailingHeight,
        );

        activeDrawingContext.fillStyle = 'rgb(225 249 255 / 55%)';
        activeDrawingContext.fillRect(
          xPosition,
          trailingYPosition,
          barWidth,
          1.5,
        );

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
