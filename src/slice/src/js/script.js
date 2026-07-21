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
    uniform vec2 u_cursor_position;
    uniform float u_cursor_active;
    uniform sampler2D u_noise_map;
    uniform vec3 u_trail_brushes[24];
    uniform float u_trail_count;

    float orderedPatternRank(vec2 pattern_pixel) {
      vec2 half_pixel = mod(pattern_pixel, 2.0);
      vec2 quarter_pixel = floor(pattern_pixel * 0.5);
      float half_rank = half_pixel.x + (half_pixel.y * 2.0);
      float quarter_rank = quarter_pixel.x + (quarter_pixel.y * 2.0);
      return (half_rank * 4.0) + quarter_rank;
    }

    vec2 selectPatternPixel(vec2 logical_pixel, float local_tone) {
      vec2 pattern_pixel = mod(logical_pixel, 4.0);
      float pattern_family = mod(floor(local_tone * 24.0), 4.0);

      if (pattern_family < 1.0) {
        return pattern_pixel;
      }

      if (pattern_family < 2.0) {
        return vec2(pattern_pixel.y, 3.0 - pattern_pixel.x);
      }

      if (pattern_family < 3.0) {
        return mod(pattern_pixel + vec2(pattern_pixel.y, 1.0), 4.0);
      }

      return mod(vec2(pattern_pixel.x + pattern_pixel.y, pattern_pixel.y * 3.0), 4.0);
    }

    void main() {
      vec2 logical_position = floor(gl_FragCoord.xy) + 0.5;
      vec2 gradient_center = vec2(u_viewport_size.x * 0.52, u_viewport_size.y * 0.94);
      float gradient_radius = length(u_viewport_size) * 0.82;
      float radial_distance = length(logical_position - gradient_center) / gradient_radius;
      float radial_light = 1.0 - smoothstep(0.02, 1.0, radial_distance);
      float gradient_tone = mix(0.025, 0.76, pow(radial_light, 1.18));

      vec2 grain_pixel = floor(logical_position);
      vec2 grain_uv = (grain_pixel + 0.5) / u_viewport_size;
      float grain_value = texture2D(u_noise_map, grain_uv).r - 0.5;
      float resting_tone = clamp(gradient_tone + (grain_value * 0.17), 0.0, 1.0);

      vec2 pattern_pixel = selectPatternPixel(grain_pixel, gradient_tone);
      float pattern_rank = orderedPatternRank(pattern_pixel) / 15.0;
      float dither_tone = clamp(
        gradient_tone + ((pattern_rank - 0.5) * 0.17),
        0.0,
        1.0
      );

      float brush_radius = 92.0;
      float brush_distance = length(logical_position - u_cursor_position);
      float brush_mask = u_cursor_active * step(brush_distance, brush_radius);
      float trail_mask = 0.0;

      for (int trail_index = 0; trail_index < 24; trail_index++) {
        if (float(trail_index) >= u_trail_count) {
          break;
        }

        vec3 trail_brush = u_trail_brushes[trail_index];
        float trail_distance = length(logical_position - trail_brush.xy);
        trail_mask = max(trail_mask, step(trail_distance, trail_brush.z));
      }

      brush_mask = max(brush_mask, trail_mask);
      float displayed_tone = mix(resting_tone, dither_tone, brush_mask);

      gl_FragColor = vec4(vec3(displayed_tone), 1.0);
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
      cursor_position: gl_context.getUniformLocation(shader_program, 'u_cursor_position'),
      cursor_active: gl_context.getUniformLocation(shader_program, 'u_cursor_active'),
      noise_map: gl_context.getUniformLocation(shader_program, 'u_noise_map'),
      trail_brushes: gl_context.getUniformLocation(shader_program, 'u_trail_brushes[0]'),
      trail_count: gl_context.getUniformLocation(shader_program, 'u_trail_count'),
    };
    const noise_texture = gl_context.createTexture();

    let animation_frame = 0;
    let viewport_width = 1;
    let viewport_height = 1;
    let cursor_position_x = 0;
    let cursor_position_y = 0;
    let cursor_active = 0;
    let noise_pixel_data = new Uint8Array(4);
    let trail_brushes = [];
    let last_trail_sample_time = 0;

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
    gl_context.activeTexture(gl_context.TEXTURE0);
    gl_context.bindTexture(gl_context.TEXTURE_2D, noise_texture);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MIN_FILTER, gl_context.NEAREST);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_MAG_FILTER, gl_context.NEAREST);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_S, gl_context.CLAMP_TO_EDGE);
    gl_context.texParameteri(gl_context.TEXTURE_2D, gl_context.TEXTURE_WRAP_T, gl_context.CLAMP_TO_EDGE);
    gl_context.uniform1i(shader_locations.noise_map, 0);

    function randomizeNoisePixel(pixel_offset) {
      const random_channel = Math.floor(Math.random() * 256);
      noise_pixel_data[pixel_offset] = random_channel;
      noise_pixel_data[pixel_offset + 1] = random_channel;
      noise_pixel_data[pixel_offset + 2] = random_channel;
      noise_pixel_data[pixel_offset + 3] = 255;
    }

    function createNoisePixels() {
      noise_pixel_data = new Uint8Array(viewport_width * viewport_height * 4);

      for (let pixel_offset = 0; pixel_offset < noise_pixel_data.length; pixel_offset += 4) {
        randomizeNoisePixel(pixel_offset);
      }

      gl_context.texImage2D(
        gl_context.TEXTURE_2D,
        0,
        gl_context.RGBA,
        viewport_width,
        viewport_height,
        0,
        gl_context.RGBA,
        gl_context.UNSIGNED_BYTE,
        noise_pixel_data,
      );
    }

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
        createNoisePixels();
      }

      requestBackgroundRender();
    }

    function renderBackground(current_time) {
      const trail_hold_duration = 180;
      const trail_shrink_duration = 820;
      const trail_total_duration = trail_hold_duration + trail_shrink_duration;
      const active_trail_brushes = [];
      const trail_uniform_data = new Float32Array(24 * 3);

      trail_brushes.forEach((trail_brush) => {
        const trail_age = current_time - trail_brush.created_time;

        if (trail_age >= trail_total_duration) {
          return;
        }

        const shrink_progress = Math.max(
          0,
          (trail_age - trail_hold_duration) / trail_shrink_duration,
        );
        const trail_radius = Math.max(1, Math.round(92 * (1 - shrink_progress)));
        const trail_offset = active_trail_brushes.length * 3;
        trail_uniform_data[trail_offset] = trail_brush.position_x;
        trail_uniform_data[trail_offset + 1] = trail_brush.position_y;
        trail_uniform_data[trail_offset + 2] = trail_radius;
        active_trail_brushes.push(trail_brush);
      });

      trail_brushes = active_trail_brushes;
      gl_context.uniform2f(
        shader_locations.viewport_size,
        viewport_width,
        viewport_height,
      );
      gl_context.uniform2f(
        shader_locations.cursor_position,
        cursor_position_x,
        cursor_position_y,
      );
      gl_context.uniform1f(shader_locations.cursor_active, cursor_active);
      gl_context.uniform3fv(shader_locations.trail_brushes, trail_uniform_data);
      gl_context.uniform1f(shader_locations.trail_count, trail_brushes.length);
      gl_context.drawArrays(gl_context.TRIANGLES, 0, 3);
      animation_frame = 0;

      if (trail_brushes.length > 0) {
        requestBackgroundRender();
      }
    }

    function requestBackgroundRender() {
      if (!animation_frame) {
        animation_frame = window.requestAnimationFrame(renderBackground);
      }
    }

    function refreshPassedNoise(previous_position_x, previous_position_y, next_position_x, next_position_y) {
      const brush_radius = 92;
      const region_left = Math.max(0, Math.floor(previous_position_x - brush_radius));
      const region_bottom = Math.max(0, Math.floor(previous_position_y - brush_radius));
      const region_right = Math.min(viewport_width, Math.ceil(previous_position_x + brush_radius));
      const region_top = Math.min(viewport_height, Math.ceil(previous_position_y + brush_radius));
      const region_width = region_right - region_left;
      const region_height = region_top - region_bottom;

      if (region_width < 1 || region_height < 1) {
        return;
      }

      const region_pixel_data = new Uint8Array(region_width * region_height * 4);
      const brush_radius_squared = brush_radius * brush_radius;

      for (let region_y = 0; region_y < region_height; region_y += 1) {
        for (let region_x = 0; region_x < region_width; region_x += 1) {
          const screen_x = region_left + region_x + 0.5;
          const screen_y = region_bottom + region_y + 0.5;
          const previous_delta_x = screen_x - previous_position_x;
          const previous_delta_y = screen_y - previous_position_y;
          const next_delta_x = screen_x - next_position_x;
          const next_delta_y = screen_y - next_position_y;
          const was_inside_brush = (
            (previous_delta_x * previous_delta_x) + (previous_delta_y * previous_delta_y)
          ) <= brush_radius_squared;
          const remains_inside_brush = cursor_active && (
            ((next_delta_x * next_delta_x) + (next_delta_y * next_delta_y))
            <= brush_radius_squared
          );
          const source_offset = (
            ((region_bottom + region_y) * viewport_width) + region_left + region_x
          ) * 4;

          if (was_inside_brush && !remains_inside_brush) {
            randomizeNoisePixel(source_offset);
          }

          const region_offset = ((region_y * region_width) + region_x) * 4;
          region_pixel_data.set(noise_pixel_data.subarray(source_offset, source_offset + 4), region_offset);
        }
      }

      gl_context.texSubImage2D(
        gl_context.TEXTURE_2D,
        0,
        region_left,
        region_bottom,
        region_width,
        region_height,
        gl_context.RGBA,
        gl_context.UNSIGNED_BYTE,
        region_pixel_data,
      );
    }

    function handlePointerMove(pointer_event) {
      const wrapper_bounds = background_wrapper.getBoundingClientRect();
      const next_position_x = Math.round(pointer_event.clientX - wrapper_bounds.left) + 0.5;
      const next_position_y = viewport_height
        - Math.round(pointer_event.clientY - wrapper_bounds.top)
        - 0.5;

      if (cursor_active) {
        const sample_time = performance.now();

        if (sample_time - last_trail_sample_time >= 50) {
          trail_brushes.push({
            position_x: cursor_position_x,
            position_y: cursor_position_y,
            created_time: sample_time,
          });
          trail_brushes = trail_brushes.slice(-24);
          last_trail_sample_time = sample_time;
        }

        refreshPassedNoise(
          cursor_position_x,
          cursor_position_y,
          next_position_x,
          next_position_y,
        );
      }

      cursor_position_x = next_position_x;
      cursor_position_y = next_position_y;
      cursor_active = 1;

      if (!last_trail_sample_time) {
        last_trail_sample_time = performance.now();
      }

      requestBackgroundRender();
    }

    function handlePointerLeave() {
      refreshPassedNoise(cursor_position_x, cursor_position_y, -1000, -1000);
      cursor_active = 0;
      last_trail_sample_time = 0;
      requestBackgroundRender();
    }

    resizeBackground();
    window.addEventListener('resize', resizeBackground, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    background_wrapper.jurenitesGradientDestroy = function () {
      window.cancelAnimationFrame(animation_frame);
      window.removeEventListener('resize', resizeBackground);
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener('pointerleave', handlePointerLeave);
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
