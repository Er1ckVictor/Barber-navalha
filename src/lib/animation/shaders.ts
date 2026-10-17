// "#rrggbb" -> vec3 do GLSL (sem conversão de color space)
export const glslColor = (hex: string) => {
  const c = parseInt(hex.slice(1), 16);
  return `vec3(${((c >> 16) & 255) / 255},${((c >> 8) & 255) / 255},${(c & 255) / 255})`;
};

export const COLORS = {
  white: glslColor('#f1eee8'),
  black: glslColor('#0c0b0b'),
  blue: glslColor('#1f4ea8'),
  red: glslColor('#c8102e'),
};

// Listras: preto, vermelho, branco e azul, cada uma ocupando 1/4 do ciclo.
// t = u*rep + v*twist - uOffset. A preta fica centrada em fract(t) = 0 e a branca
// em 0.5, então meio ciclo troca uma pela outra.
const STRIPE_FN = /* glsl */ `
  vec3 bandColor(float i){
    i = mod(i, 4.);
    if (i < .5) return ${COLORS.black};
    if (i < 1.5) return ${COLORS.red};
    if (i < 2.5) return ${COLORS.white};
    return ${COLORS.blue};
  }
  // fwidth suaviza a borda entre as cores
  vec3 stripeAt(float t, float soft){
    float g = fract(t + .125) * 4.;
    float i = floor(g), e = fract(g);
    float w = min(fwidth(g) * soft, .5);
    return mix(bandColor(i), bandColor(i + 1.), smoothstep(1. - w, 1., e));
  }
  uniform float uOffset;
  vec3 stripe(vec2 uv, float rep, float twist){
    return stripeAt(uv.x * rep + uv.y * twist - uOffset, 1.);
  }`;

const VIEW_VARYINGS_VERT = /* glsl */ `
  varying vec2 vUv; varying vec3 vN; varying vec3 vV;
  void main(){
    vUv = uv;
    vN = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;

export const poleShader = (rep: number, twist: number) => ({
  vertexShader: VIEW_VARYINGS_VERT,
  fragmentShader: /* glsl */ `
    ${STRIPE_FN}
    uniform float uGloss;
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){
      vec3 col = stripe(vUv, ${rep.toFixed(1)}, ${twist.toFixed(1)});
      vec3 n = normalize(vN), v = normalize(vV);
      float facing = max(dot(n, v), 0.);
      float diff = .62 + .38 * pow(facing, .7);                                         // escurece só nas bordas
      float strip = smoothstep(.94, 1., dot(n, normalize(vec3(-.45, 0., 1.)))) * .08;   // reflexo fino
      gl_FragColor = vec4(col * mix(1., diff, uGloss) + strip * uGloss, 1.);           // uGloss vai a 0 no zoom final
    }`,
});

// Tampas prateadas. Não tem envmap: o reflexo é fake, claro em cima e escuro embaixo.
export const capShader = {
  vertexShader: VIEW_VARYINGS_VERT,
  fragmentShader: /* glsl */ `
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){
      vec3 n = normalize(vN), v = normalize(vV);
      float f = max(dot(n, v), 0.);
      vec3 r = reflect(-v, n);
      float env = smoothstep(-.35, .6, r.y);
      vec3 silver = mix(${glslColor('#5b6068')}, ${glslColor('#e9ecf0')}, env);
      silver *= .72 + .28 * f;
      float band = smoothstep(.9, 1., dot(n, normalize(vec3(-.5, .15, 1.))));
      float band2 = smoothstep(.97, 1., dot(n, normalize(vec3(.55, .1, 1.)))) * .5;
      gl_FragColor = vec4(silver + (band + band2) * .45, 1.);
    }`,
};

// Quad de tela cheia simulando a superfície do poste bem de perto.
// Offset inteiro = preto na tela toda, offset .5 = branco.
export const surfaceShader = {
  vertexShader: /* glsl */ `void main(){ gl_Position = vec4(position.xy, 0., 1.); }`,
  fragmentShader: /* glsl */ `
    ${STRIPE_FN}
    uniform float uK, uTime, uCurve; uniform vec2 uRes, uDir;
    void main(){
      vec2 p = (gl_FragCoord.xy - .5 * uRes) / uRes.y;   // origem no centro, em alturas de tela
      vec3 col = stripeAt(dot(p, uDir) * uK - uOffset, 1.5);
      float b = 1. - dot(col, vec3(.299, .587, .114));    // quanto mais escura, menos brilho
      // laterais mais escuras + um brilho vertical pra parecer curvo
      float x = p.x / (uRes.x / uRes.y);
      float shade = .78 + .22 * cos(x * 2.4);
      float sheen = exp(-pow((x + .2 + sin(uTime * .3) * .02) * 6., 2.)) * .2
                  + exp(-pow((x - .3) * 14., 2.)) * .07;
      col = mix(col, col * shade + sheen * mix(.35, .25, b), uCurve);
      gl_FragColor = vec4(col, 1.);
    }`,
};
