(function (Drupal) {
  const vertexShader = `
    attribute vec2 a_position;
    varying vec2 v_uv;

    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentShader = `
    precision mediump float;

    uniform vec3 u_color_start;
    uniform vec3 u_color_end;
    uniform vec2 u_resolution;
    uniform vec2 u_position;
    uniform float u_radius;
    uniform float u_noise_time;
    uniform float u_distortion_time;
    uniform float u_morph_time;
    varying vec2 v_uv;

    float random(vec2 point) {
      vec3 point3 = fract(vec3(point.xyx) * 0.1031);
      point3 += dot(point3, point3.yzx + 33.33);
      return fract((point3.x + point3.y) * point3.z);
    }

    float valueNoise(vec2 point) {
      vec2 cell = floor(point);
      vec2 local = fract(point);
      vec2 curve = local * local * (3.0 - 2.0 * local);

      float bottomLeft = random(cell);
      float bottomRight = random(cell + vec2(1.0, 0.0));
      float topLeft = random(cell + vec2(0.0, 1.0));
      float topRight = random(cell + vec2(1.0, 1.0));

      return mix(
        mix(bottomLeft, bottomRight, curve.x),
        mix(topLeft, topRight, curve.x),
        curve.y
      );
    }

    float layeredNoise(vec2 point) {
      float value = 0.0;
      float amplitude = 0.5;
      float scale = 1.0;

      for (int i = 0; i < 4; i++) {
        value += valueNoise(point * scale) * amplitude;
        scale *= 2.03;
        amplitude *= 0.52;
      }

      return value;
    }

    vec2 rotate(vec2 point, float amount) {
      float c = cos(amount);
      float s = sin(amount);
      return vec2(point.x * c + point.y * s, -point.x * s + point.y * c);
    }

    void main() {
      float aspect = u_resolution.x / u_resolution.y;
      vec2 uv = v_uv;
      vec2 travel = rotate(vec2(u_distortion_time), 5.497787);
      float distortion = layeredNoise((uv * 1.9) + travel + 50.0 + u_morph_time);
      float eased = 1.0 - pow(1.0 - smoothstep(0.0, 1.0, distortion), 3.0);
      float strength = 1.0 - (eased * 0.31);

      uv = ((uv - 0.5) * strength) + 0.5;

      vec2 center = u_position;
      uv.x *= aspect;
      center.x *= aspect;

      float gradient = clamp(length(center - uv) / u_radius, 0.0, 1.0);
      float grain = random(floor(gl_FragCoord.xy) + vec2(u_noise_time * 4096.0, u_noise_time * 173.0));
      gradient += 0.055 * (grain - 0.5);
      gradient = smoothstep(0.0, 1.0, gradient);

      vec3 color = mix(u_color_start, u_color_end, gradient);
      gl_FragColor = vec4(color, 1.0);
    }
  `;

  const settings = {
    colorStart: [0.706, 0.431, 0.235],
    colorEnd: [0.09, 0.07, 0.058],
    radius: 0.95,
    restX: 0.07,
    restY: 0.5,
    followSpeed: 0.018,
    maxPixelRatio: 1.5,
  };

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'Gradient shader failed to compile.');
    }

    return shader;
  }

  function createProgram(gl) {
    const program = gl.createProgram();
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vertexShader));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fragmentShader));
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'Gradient program failed to link.');
    }

    return program;
  }

  function smoothstep(edge0, edge1, value) {
    const amount = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));
    return amount * amount * (3 - (2 * amount));
  }

  function createGradientBackground(wrapper) {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      failIfMajorPerformanceCaveat: true,
    });

    if (!gl) {
      return;
    }

    const program = createProgram(gl);
    const positionBuffer = gl.createBuffer();
    const locations = {
      position: gl.getAttribLocation(program, 'a_position'),
      colorStart: gl.getUniformLocation(program, 'u_color_start'),
      colorEnd: gl.getUniformLocation(program, 'u_color_end'),
      resolution: gl.getUniformLocation(program, 'u_resolution'),
      positionTarget: gl.getUniformLocation(program, 'u_position'),
      radius: gl.getUniformLocation(program, 'u_radius'),
      noiseTime: gl.getUniformLocation(program, 'u_noise_time'),
      distortionTime: gl.getUniformLocation(program, 'u_distortion_time'),
      morphTime: gl.getUniformLocation(program, 'u_morph_time'),
    };

    let animationFrame = 0;
    let width = 1;
    let height = 1;
    let targetX = settings.restX;
    let targetY = settings.restY;
    let currentX = targetX;
    let currentY = targetY;
    let startTime = performance.now();

    canvas.setAttribute('aria-hidden', 'true');
    wrapper.appendChild(canvas);

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 3, 3, -1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(locations.position);
    gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform3fv(locations.colorStart, settings.colorStart);
    gl.uniform3fv(locations.colorEnd, settings.colorEnd);
    gl.uniform1f(locations.radius, settings.radius);

    function resize() {
      const ratio = Math.min(settings.maxPixelRatio, window.devicePixelRatio || 1);
      const bounds = wrapper.getBoundingClientRect();
      width = Math.max(1, Math.floor(bounds.width * ratio));
      height = Math.max(1, Math.floor(bounds.height * ratio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
    }

    function handlePointerMove(event) {
      const bounds = wrapper.getBoundingClientRect();
      targetX = (event.clientX - bounds.left) / Math.max(1, bounds.width);
      targetY = 1 - ((event.clientY - bounds.top) / Math.max(1, bounds.height));
    }

    function handlePointerLeave() {
      targetX = settings.restX;
      targetY = settings.restY;
    }

    function render(now) {
      const elapsed = (now - startTime) / 1000;
      const deltaX = targetX - currentX;
      const deltaY = targetY - currentY;
      const distance = Math.sqrt((deltaX * deltaX) + (deltaY * deltaY));
      const easeOutFollow = settings.followSpeed * (0.15 + (0.85 * smoothstep(0, 0.85, distance)));

      currentX += deltaX * easeOutFollow;
      currentY += deltaY * easeOutFollow;

      gl.uniform2f(locations.resolution, width, height);
      gl.uniform2f(locations.positionTarget, currentX, currentY);
      gl.uniform1f(locations.noiseTime, (elapsed * 0.016) % 1);
      gl.uniform1f(locations.distortionTime, elapsed * 0.00025);
      gl.uniform1f(locations.morphTime, elapsed * 0.002);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      animationFrame = window.requestAnimationFrame(render);
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerleave', handlePointerLeave, { passive: true });
    animationFrame = window.requestAnimationFrame(render);

    wrapper.jurenitesGradientDestroy = function () {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      canvas.remove();
      delete wrapper.jurenitesGradientInitialized;
      delete wrapper.jurenitesGradientDestroy;
    };
  }

  Drupal.behaviors.jurenitesGradientBackground = {
    attach(context) {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
      }

      context.querySelectorAll('[data-jurenites-gradient-background]').forEach((wrapper) => {
        if (wrapper.jurenitesGradientInitialized) {
          return;
        }

        wrapper.jurenitesGradientInitialized = true;
        createGradientBackground(wrapper);
      });
    },
  };
})(Drupal);
