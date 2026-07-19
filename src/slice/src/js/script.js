(function (Drupal) {
  const VERTEX_SHADER_SOURCE = `
    attribute vec2 a_canvas_position;

    void main() {
      gl_Position = vec4(a_canvas_position, 0.0, 1.0);
    }
  `;

  const FRAGMENT_SHADER_SOURCE = `
    precision highp float;

    uniform vec2 u_viewport_size;

    float staticHash(vec2 pixel_position) {
      vec3 hash_position = fract(vec3(pixel_position.xyx) * 0.1031);
      hash_position += dot(hash_position, hash_position.yzx + 33.33);
      return fract((hash_position.x + hash_position.y) * hash_position.z);
    }

    void main() {
      vec2 logical_position = floor(gl_FragCoord.xy) + 0.5;
      vec2 gradient_center = vec2(u_viewport_size.x * 0.52, u_viewport_size.y * 0.94);
      float gradient_radius = length(u_viewport_size) * 0.82;
      float radial_distance = length(logical_position - gradient_center) / gradient_radius;
      float radial_light = 1.0 - smoothstep(0.02, 1.0, radial_distance);
      float gradient_tone = mix(0.025, 0.76, pow(radial_light, 1.18));

      vec2 grain_pixel = floor(logical_position);
      float grain_value = staticHash(grain_pixel + 113.0) - 0.5;
      float resting_tone = clamp(gradient_tone + (grain_value * 0.17), 0.0, 1.0);

      gl_FragColor = vec4(vec3(resting_tone), 1.0);
    }
  `;

  function createShader(gl_context, shader_type, shader_source) {
    const compiled_shader = gl_context.createShader(shader_type);
    gl_context.shaderSource(compiled_shader, shader_source);
    gl_context.compileShader(compiled_shader);

    if (!gl_context.getShaderParameter(compiled_shader, gl_context.COMPILE_STATUS)) {
      throw new Error(
        gl_context.getShaderInfoLog(compiled_shader) || 'Background shader failed to compile.',
      );
    }

    return compiled_shader;
  }

  function createProgram(gl_context) {
    const shader_program = gl_context.createProgram();
    gl_context.attachShader(
      shader_program,
      createShader(gl_context, gl_context.VERTEX_SHADER, VERTEX_SHADER_SOURCE),
    );
    gl_context.attachShader(
      shader_program,
      createShader(gl_context, gl_context.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE),
    );
    gl_context.linkProgram(shader_program);

    if (!gl_context.getProgramParameter(shader_program, gl_context.LINK_STATUS)) {
      throw new Error(
        gl_context.getProgramInfoLog(shader_program) || 'Background program failed to link.',
      );
    }

    return shader_program;
  }

  function createNoiseBackground(background_wrapper) {
    const background_canvas = document.createElement('canvas');
    const gl_context = background_canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      failIfMajorPerformanceCaveat: true,
    });

    if (!gl_context) {
      return;
    }

    const shader_program = createProgram(gl_context);
    const position_buffer = gl_context.createBuffer();
    const shader_locations = {
      canvas_position: gl_context.getAttribLocation(shader_program, 'a_canvas_position'),
      viewport_size: gl_context.getUniformLocation(shader_program, 'u_viewport_size'),
    };

    let animation_frame = 0;
    let viewport_width = 1;
    let viewport_height = 1;

    background_canvas.setAttribute('aria-hidden', 'true');
    background_wrapper.appendChild(background_canvas);

    gl_context.useProgram(shader_program);
    gl_context.bindBuffer(gl_context.ARRAY_BUFFER, position_buffer);
    gl_context.bufferData(
      gl_context.ARRAY_BUFFER,
      new Float32Array([-1, -1, -1, 3, 3, -1]),
      gl_context.STATIC_DRAW,
    );
    gl_context.enableVertexAttribArray(shader_locations.canvas_position);
    gl_context.vertexAttribPointer(
      shader_locations.canvas_position,
      2,
      gl_context.FLOAT,
      false,
      0,
      0,
    );

    function resizeBackground() {
      const wrapper_bounds = background_wrapper.getBoundingClientRect();
      viewport_width = Math.max(1, Math.round(wrapper_bounds.width));
      viewport_height = Math.max(1, Math.round(wrapper_bounds.height));
      const render_width = viewport_width;
      const render_height = viewport_height;

      if (background_canvas.width !== render_width || background_canvas.height !== render_height) {
        background_canvas.width = render_width;
        background_canvas.height = render_height;
        gl_context.viewport(0, 0, render_width, render_height);
      }

      requestBackgroundRender();
    }

    function renderBackground() {
      gl_context.uniform2f(
        shader_locations.viewport_size,
        viewport_width,
        viewport_height,
      );
      gl_context.drawArrays(gl_context.TRIANGLES, 0, 3);
      animation_frame = 0;
    }

    function requestBackgroundRender() {
      if (!animation_frame) {
        animation_frame = window.requestAnimationFrame(renderBackground);
      }
    }

    resizeBackground();
    window.addEventListener('resize', resizeBackground, { passive: true });

    background_wrapper.jurenitesGradientDestroy = function () {
      window.cancelAnimationFrame(animation_frame);
      window.removeEventListener('resize', resizeBackground);
      background_canvas.remove();
      delete background_wrapper.jurenitesGradientInitialized;
      delete background_wrapper.jurenitesGradientDestroy;
    };
  }

  Drupal.behaviors.jurenitesGradientBackground = {
    attach(context) {
      context.querySelectorAll('[data-jurenites-gradient-background]').forEach((background_wrapper) => {
        if (background_wrapper.jurenitesGradientInitialized) {
          return;
        }

        background_wrapper.jurenitesGradientInitialized = true;
        createNoiseBackground(background_wrapper);
      });
    },
  };
})(Drupal);
