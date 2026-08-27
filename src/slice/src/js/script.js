const NOISE_FRAMES_PER_SECOND = 15;
const NOISE_FRAME_INTERVAL = 1000 / NOISE_FRAMES_PER_SECOND;

const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_canvas_position;

  void main() {
    gl_Position = vec4(a_canvas_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;

  uniform float u_noise_frame;

  float staticHash(vec3 noise_position) {
    noise_position = fract(noise_position * vec3(0.1031, 0.1030, 0.0973));
    noise_position += dot(noise_position, noise_position.yxz + 33.33);
    return fract((noise_position.x + noise_position.y) * noise_position.z);
  }

  void main() {
    vec2 logical_pixel = floor(gl_FragCoord.xy);
    float noise_value = staticHash(vec3(logical_pixel, u_noise_frame));
    float displayed_tone = mix(0.04, 0.34, noise_value);

    gl_FragColor = vec4(vec3(displayed_tone), 1.0);
  }
`;

function create_shader(gl_context, shader_type, shader_source) {
  const compiled_shader = gl_context.createShader(shader_type);
  gl_context.shaderSource(compiled_shader, shader_source);
  gl_context.compileShader(compiled_shader);

  if (!gl_context.getShaderParameter(compiled_shader, gl_context.COMPILE_STATUS)) {
    throw new Error(
      gl_context.getShaderInfoLog(compiled_shader) || 'Media loader shader failed to compile.',
    );
  }

  return compiled_shader;
}

function create_program(gl_context) {
  const shader_program = gl_context.createProgram();
  gl_context.attachShader(
    shader_program,
    create_shader(gl_context, gl_context.VERTEX_SHADER, VERTEX_SHADER_SOURCE),
  );
  gl_context.attachShader(
    shader_program,
    create_shader(gl_context, gl_context.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE),
  );
  gl_context.linkProgram(shader_program);

  if (!gl_context.getProgramParameter(shader_program, gl_context.LINK_STATUS)) {
    throw new Error(
      gl_context.getProgramInfoLog(shader_program) || 'Media loader program failed to link.',
    );
  }

  return shader_program;
}

export function create_media_loader_noise(noise_surface) {
  const noise_canvas = document.createElement('canvas');
  const gl_context = noise_canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    failIfMajorPerformanceCaveat: true,
  });

  if (!gl_context) {
    return;
  }

  const shader_program = create_program(gl_context);
  const position_buffer = gl_context.createBuffer();
  const canvas_position_location = gl_context.getAttribLocation(
    shader_program,
    'a_canvas_position',
  );
  const noise_frame_location = gl_context.getUniformLocation(shader_program, 'u_noise_frame');
  const reduced_motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let noise_frame = 0;
  let animation_frame = 0;
  let animation_timer = 0;

  noise_canvas.setAttribute('aria-hidden', 'true');
  noise_surface.appendChild(noise_canvas);

  gl_context.useProgram(shader_program);
  gl_context.bindBuffer(gl_context.ARRAY_BUFFER, position_buffer);
  gl_context.bufferData(
    gl_context.ARRAY_BUFFER,
    new Float32Array([-1, -1, -1, 3, 3, -1]),
    gl_context.STATIC_DRAW,
  );
  gl_context.enableVertexAttribArray(canvas_position_location);
  gl_context.vertexAttribPointer(
    canvas_position_location,
    2,
    gl_context.FLOAT,
    false,
    0,
    0,
  );

  function scheduleNoiseRender() {
    if (reduced_motion || animation_frame || animation_timer) {
      return;
    }

    animation_timer = window.setTimeout(() => {
      animation_timer = 0;
      animation_frame = window.requestAnimationFrame(renderNoiseFrame);
    }, NOISE_FRAME_INTERVAL);
  }

  function renderNoiseFrame() {
    gl_context.uniform1f(noise_frame_location, noise_frame);
    gl_context.drawArrays(gl_context.TRIANGLES, 0, 3);
    noise_frame = (noise_frame + 1) % 4096;
    animation_frame = 0;
    scheduleNoiseRender();
  }

  function resizeNoiseSurface() {
    const surface_bounds = noise_surface.getBoundingClientRect();
    const render_width = Math.max(1, Math.round(surface_bounds.width));
    const render_height = Math.max(1, Math.round(surface_bounds.height));

    if (noise_canvas.width !== render_width || noise_canvas.height !== render_height) {
      noise_canvas.width = render_width;
      noise_canvas.height = render_height;
      gl_context.viewport(0, 0, render_width, render_height);
    }

    renderNoiseFrame();
  }

  const noise_resize_observer = new ResizeObserver(resizeNoiseSurface);
  noise_resize_observer.observe(noise_surface);
  resizeNoiseSurface();

  noise_surface.jurenites_media_loader_destroy = function () {
    window.cancelAnimationFrame(animation_frame);
    window.clearTimeout(animation_timer);
    noise_resize_observer.disconnect();
    noise_canvas.remove();
    delete noise_surface.jurenites_media_loader_initialized;
    delete noise_surface.jurenites_media_loader_destroy;
  };
}

if (typeof Drupal !== 'undefined') {
  Drupal.behaviors.jurenites_media_loader_noise = {
    attach(context) {
      context.querySelectorAll('[data-jurenites-media-loader-noise]').forEach((noise_surface) => {
        if (noise_surface.jurenites_media_loader_initialized) {
          return;
        }

        noise_surface.jurenites_media_loader_initialized = true;
        create_media_loader_noise(noise_surface);
      });
    },
  };
}
