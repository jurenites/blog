(function (Drupal) {
  const settings = {
    colorStart: [180, 110, 60],
    colorEnd: [80, 70, 120],
    canvasScale: 0.25,
    ditherSize: 2,
    noiseStrength: 18,
    cursorTrackingDelay: 0.035,
    gradientScale: 0.34,
    colorTransitionSpeed: 0.07,
    fluidNoiseScale: 0.01,
    fluidNoiseSpeed: 0.0012,
    fluidResolution: 4,
  };

  const ditherMatrix = [
    [0, 128],
    [192, 64],
  ];

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function lerpColor(c1, c2, t) {
    return [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t)),
    ];
  }

  function toGrayscale(rgb) {
    const avg = Math.round((0.299 * rgb[0]) + (0.587 * rgb[1]) + (0.114 * rgb[2]));
    return [avg, avg, avg];
  }

  function fluidNoise(x, y, t) {
    return Math.sin((x * settings.fluidNoiseScale) + t) * Math.cos((y * settings.fluidNoiseScale) + t);
  }

  function createDitherBackground(canvas) {
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      return;
    }

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    let colorMode = 1;
    let targetColorMode = 1;
    let time = 0;
    let animationFrame = 0;

    function resize() {
      const width = Math.max(1, Math.floor(window.innerWidth * settings.canvasScale));
      const height = Math.max(1, Math.floor(window.innerHeight * settings.canvasScale));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      if (!mouseX && !mouseY) {
        mouseX = width / 2;
        mouseY = height / 2;
        currentX = mouseX;
        currentY = mouseY;
      }
    }

    function handleMouseMove(event) {
      mouseX = event.clientX * settings.canvasScale;
      mouseY = event.clientY * settings.canvasScale;
      targetColorMode = 1;
    }

    function handleMouseLeave() {
      targetColorMode = 0;
    }

    function handleMouseEnter() {
      targetColorMode = 1;
    }

    function draw() {
      colorMode = lerp(colorMode, targetColorMode, settings.colorTransitionSpeed);
      currentX = lerp(currentX, mouseX, settings.cursorTrackingDelay);
      currentY = lerp(currentY, mouseY, settings.cursorTrackingDelay);

      const maxX = Math.max(currentX, canvas.width - currentX);
      const maxY = Math.max(currentY, canvas.height - currentY);
      const maxDist = Math.max(1, Math.sqrt((maxX ** 2) + (maxY ** 2)) * settings.gradientScale);
      const imageData = context.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const dx = x - currentX;
          const dy = y - currentY;
          const dist = Math.sqrt((dx * dx) + (dy * dy));
          const fluid = fluidNoise(x / settings.fluidResolution, y / settings.fluidResolution, time);
          const dither = ditherMatrix[y % settings.ditherSize][x % settings.ditherSize];
          let mix = (dist / maxDist) + (fluid * 0.1) + ((dither - 128) / 512);

          mix = Math.min(1, Math.max(0, mix));

          let color = lerpColor(settings.colorStart, settings.colorEnd, mix);
          const gray = toGrayscale(color);

          if (mix < 0.98) {
            color = [
              Math.round(lerp(gray[0], color[0], colorMode)),
              Math.round(lerp(gray[1], color[1], colorMode)),
              Math.round(lerp(gray[2], color[2], colorMode)),
            ];
          }
          else {
            color = settings.colorEnd;
          }

          const noise = (Math.random() * 2 - 1) * settings.noiseStrength;
          const index = ((y * canvas.width) + x) * 4;

          data[index] = color[0] + noise;
          data[index + 1] = color[1] + noise;
          data[index + 2] = color[2] + noise;
          data[index + 3] = 255;
        }
      }

      context.putImageData(imageData, 0, 0);
      time += settings.fluidNoiseSpeed;
      animationFrame = window.requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('mouseenter', handleMouseEnter, { passive: true });
    draw();

    canvas.jurenitesDitherDestroy = function () {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
      delete canvas.jurenitesDitherInitialized;
      delete canvas.jurenitesDitherDestroy;
    };
  }

  Drupal.behaviors.jurenitesDitherBackground = {
    attach(context) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      context.querySelectorAll('canvas.section-background-canvas').forEach((canvas) => {
        if (canvas.jurenitesDitherInitialized) {
          return;
        }

        canvas.jurenitesDitherInitialized = true;
        createDitherBackground(canvas);
      });
    },
  };
})(Drupal);
