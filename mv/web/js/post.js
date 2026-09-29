// WebGL2 finishing pass: CRT curvature, chromatic aberration, blue halation,
// scanlines / aperture mask, glitch slicing, pixelation, invert holds, grain.
const VS = `#version 300 es
in vec2 p; out vec2 vUv;
void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D uScene, uBloom;
uniform vec2 uRes;
uniform float uSeed, uAberr, uCurve, uScan, uGrain, uVig, uGlitch, uInvert, uFlash, uBloomAmt, uPixel, uMask, uLift;
uniform vec3 uTint;
in vec2 vUv; out vec4 o;
float h(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }   // Hoskins hash12, precision-safe
void main(){
  vec2 uv = vUv;
  vec2 cc = uv * 2.0 - 1.0;
  cc *= 1.0 + uCurve * (cc.yx * cc.yx) * vec2(0.06, 0.09);
  uv = cc * 0.5 + 0.5;
  float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  float sd = mod(floor(uSeed * 0.5), 89.0) + 1.0;   // noise held for two frames, like the drawings
  if (uGlitch > 0.002) {
    float band = floor(uv.y * 30.0 + h(vec2(sd, 3.1)) * 6.0);
    if (h(vec2(band, sd)) < uGlitch * 0.5) uv.x += (h(vec2(band, sd + 7.0)) - 0.5) * 0.14 * uGlitch;
    vec2 blk = floor(uv * vec2(22.0, 12.0));
    float b = h(blk + sd * 1.37);
    if (b < uGlitch * 0.07) uv += (vec2(h(blk + 1.0), h(blk + 2.0)) - 0.5) * 0.06;
  }
  if (uPixel > 1.0) { vec2 cell = uPixel / uRes; uv = (floor(uv / cell) + 0.5) * cell; }
  vec2 d = uv - 0.5;
  vec2 off = d * (uAberr / uRes.x) * (0.6 + 5.0 * dot(d, d)) * 2.0 + vec2(uGlitch * 9.0 / uRes.x, 0.0);
  vec3 col = vec3(texture(uScene, uv + off).r, texture(uScene, uv).g, texture(uScene, uv - off).b);
  col += texture(uBloom, uv).rgb * uBloomAmt * vec3(0.72, 0.84, 1.18);
  col = mix(col, vec3(1.0) - col, uInvert);
  col = col * uTint + uLift;
  col += uFlash;
  float sl = 0.5 + 0.5 * cos(uv.y * uRes.y * 6.2831853 / 3.0);
  col *= 1.0 - uScan * (1.0 - sl);
  if (uMask > 0.0) {
    float m = mod(gl_FragCoord.x, 3.0);
    vec3 msk = vec3(m < 1.0 ? 1.0 : 0.72, (m >= 1.0 && m < 2.0) ? 1.0 : 0.72, m >= 2.0 ? 1.0 : 0.72);
    col *= mix(vec3(1.0), msk, uMask);
  }
  float v = smoothstep(1.35, 0.3, length(d * vec2(1.0, 1.2)) * 1.55);
  col *= mix(1.0, v, uVig);
  col += (h(floor(gl_FragCoord.xy * 0.5) + sd * 17.0) - 0.5) * uGrain;   // 2px film-grain clumps
  o = vec4(clamp(col, 0.0, 1.0) * inside, 1.0);
}`;

export class Post {
  constructor(canvas) {
    const gl = this.gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false });
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const pr = this.pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(pr));
    gl.useProgram(pr);
    const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    this.tex = [0, 1].map(i => {
      const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return t;
    });
    gl.uniform1i(gl.getUniformLocation(pr, 'uScene'), 0); gl.uniform1i(gl.getUniformLocation(pr, 'uBloom'), 1);
    this.u = {}; for (const n of ['uRes', 'uSeed', 'uAberr', 'uCurve', 'uScan', 'uGrain', 'uVig', 'uGlitch', 'uInvert', 'uFlash', 'uBloomAmt', 'uPixel', 'uMask', 'uLift', 'uTint']) this.u[n] = gl.getUniformLocation(pr, n);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  }
  render(scene, bloom, fx, seed) {
    const gl = this.gl, u = this.u;
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex[0]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scene);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tex[1]); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bloom);
    gl.uniform2f(u.uRes, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.uniform1f(u.uSeed, seed);
    gl.uniform1f(u.uAberr, fx.aberr); gl.uniform1f(u.uCurve, fx.curve); gl.uniform1f(u.uScan, fx.scan);
    gl.uniform1f(u.uGrain, fx.grain); gl.uniform1f(u.uVig, fx.vig); gl.uniform1f(u.uGlitch, fx.glitch);
    gl.uniform1f(u.uInvert, fx.invert); gl.uniform1f(u.uFlash, fx.flash); gl.uniform1f(u.uBloomAmt, fx.bloom);
    gl.uniform1f(u.uPixel, fx.pixel); gl.uniform1f(u.uMask, fx.mask); gl.uniform1f(u.uLift, fx.lift);
    gl.uniform3fv(u.uTint, fx.tint);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
}
