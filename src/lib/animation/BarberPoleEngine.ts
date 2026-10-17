import * as THREE from 'three';
import { clamp01, ease, easeIn, easeOut, lerp, seg } from './math';
import { capShader, poleShader, surfaceShader } from './shaders';

// elementos que o engine anima direto via style
export interface EngineDom {
  brand: HTMLElement | null;
  letters: HTMLElement[];
  heroSub: HTMLElement | null;
  heroHint: HTMLElement | null;
  introCard: HTMLElement | null;
  logo: HTMLElement | null;
  photo: HTMLElement | null;
}

export interface NavState {
  target: number;
  // -1 enquanto está em movimento
  arrived: number;
}

export interface EngineOptions {
  canvas: HTMLCanvasElement;
  sectionIds: string[];
  dom: EngineDom;
  onNavigate?: (state: NavState) => void;
}

/*
  Linha do tempo da abertura (p vai de 0 no hero até 1 no main):

    0.00 - 0.16   letras do nome saem
    0.05 - 0.55   listras giram e param com uma preta no centro
    0.25 - 0.55   o poste se aproxima
    0.55 - 0.66   zoom final até a tela ficar toda preta
    0.70 - 0.95   foto do main aparece
    0.72 - 0.95   texto do main aparece

  Depois disso (1 até N-1) cada seção gira meio ciclo das listras,
  então o fundo alterna entre preto e branco.
*/
export const TIMING = {
  // duração da abertura, em segundos
  introDuration: 2.6,
  // quanto maior, mais rápida a troca de seção
  sectionDamping: 6.5,
  // em seções por segundo
  sectionMaxSpeed: 2.2,
  // acelera quando o salto é de mais de uma seção
  jumpSpeedup: 1.7,
};

const R = 0.55; // raio
const H = 3.6; // altura
const REP = 2;
const TWIST = 3;
const D_END = 0.012; // distância da câmera no fim do zoom
const D_NEAR = 1.1; // distância antes do zoom final
const K_CENTER = 0.5 * REP + 0.5 * TWIST; // fase no ponto do poste que fica no centro da tela
const STRIPE_DIR = new THREE.Vector2(0.58, 0.83).normalize(); // inclinação das listras vistas de perto
const ARRIVE_EPS = 0.001;
// libera o conteúdo um pouco antes do movimento terminar, senão parece lento
const SHOW_EPS = 0.03;

// true se o evento veio de um [data-scroll] que ainda tem pra onde rolar
function canScroll(target: EventTarget | null, dy: number) {
  let el = (target as Element | null)?.closest?.<HTMLElement>('[data-scroll]') ?? null;
  while (el) {
    const max = el.scrollHeight - el.clientHeight;
    if (max > 1 && ((dy > 0 && el.scrollTop < max - 1) || (dy < 0 && el.scrollTop > 0))) return true;
    el = el.parentElement?.closest<HTMLElement>('[data-scroll]') ?? null;
  }
  return false;
}

export class BarberPoleEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly dom: EngineDom;
  private readonly ids: string[];
  private readonly last_: number;
  private readonly reduce: boolean;
  private readonly lowEnd: boolean;
  private readonly onNavigate?: (s: NavState) => void;

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(35, 1, 0.005, 60);
  private surfScene = new THREE.Scene();
  private surfCam = new THREE.Camera();
  private pole = new THREE.Group();
  private poleMat: THREE.ShaderMaterial;
  private surfMat: THREE.ShaderMaterial;
  private disposables: { dispose(): void }[] = [];

  private layoutPose = { y: 0, s: 0.92, cs: 1 };

  private target = 0;
  private current = 0;
  private arrived = 0;
  private origin = 0;
  private speed = 1;
  private lastWheel = 0;
  private wheelAcc = 0;
  private wheelSpent = false;
  private touchY: number | null = null;
  private touchScroll: { el: HTMLElement; top: number; left: number } | null = null;
  private locked = false;

  // parallax do hero
  private mouse = { x: 0, y: 0 };
  private mouseSmooth = { x: 0, y: 0 };

  private lastFrame = 0;
  private time = 0;
  private load = 0;
  private idle = 0;
  private onLight = false;
  private lastDomKey = '';
  private lastPhoto = -1;

  constructor({ canvas, sectionIds, dom, onNavigate }: EngineOptions) {
    this.canvas = canvas;
    this.dom = dom;
    this.ids = sectionIds;
    this.last_ = sectionIds.length - 1;
    this.onNavigate = onNavigate;
    this.reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.lowEnd = matchMedia('(max-width: 700px)').matches || (navigator.hardwareConcurrency || 8) <= 4;
    this.load = this.reduce ? 1 : 0;

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !this.lowEnd, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.lowEnd ? 1.5 : 2));
    this.renderer.setClearColor(0x000000, 0);
    this.camera.position.z = 8;

    // poste
    this.poleMat = new THREE.ShaderMaterial({ uniforms: { uOffset: { value: 0 }, uGloss: { value: 1 } }, ...poleShader(REP, TWIST) });
    const poleGeo = new THREE.CylinderGeometry(R, R, H, 96, 1, true);
    poleGeo.rotateY(Math.PI); // joga a emenda do uv pra trás
    this.pole.add(new THREE.Mesh(poleGeo, this.poleMat));

    const capMat = new THREE.ShaderMaterial(capShader);
    const capParts: [number, number][] = [[R + 0.07, 0.14], [R * 0.72, 0.1], [R * 0.22, 0.16]]; // raio, altura
    for (const dir of [1, -1]) {
      const cap = new THREE.Group();
      let y = 0;
      for (const [r, h] of capParts) {
        const g = new THREE.CylinderGeometry(r, r, h, 64);
        const m = new THREE.Mesh(g, capMat);
        m.position.y = (y + h / 2) * dir;
        y += h;
        cap.add(m);
        this.disposables.push(g);
      }
      cap.position.y = (H / 2) * dir;
      this.pole.add(cap);
    }
    this.scene.add(this.pole);

    // superfície vista de perto (depois do mergulho)
    this.surfMat = new THREE.ShaderMaterial({
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uOffset: { value: 0 },
        uRes: { value: new THREE.Vector2(1, 1) },
        uK: { value: 0.25 },
        uDir: { value: STRIPE_DIR },
        uTime: { value: 0 },
        uCurve: { value: 1 },
      },
      ...surfaceShader,
    });
    const quad = new THREE.PlaneGeometry(2, 2);
    const surf = new THREE.Mesh(quad, this.surfMat);
    surf.frustumCulled = false;
    this.surfScene.add(surf);

    this.disposables.push(poleGeo, quad, this.poleMat, capMat, this.surfMat);

    // se abrir com #secao na url, já começa nela
    const start = this.indexOf(location.hash.slice(1));
    if (start > 0) this.target = this.current = this.arrived = this.origin = start;

    this.layout();

    addEventListener('resize', this.layout);
    addEventListener('wheel', this.onWheel, { passive: false });
    addEventListener('keydown', this.onKey);
    addEventListener('touchstart', this.onTouchStart, { passive: true });
    addEventListener('touchmove', this.onTouchMove, { passive: false });
    addEventListener('touchend', this.onTouchEnd);
    addEventListener('pointermove', this.onPointer);
    document.addEventListener('click', this.onClick);
    document.addEventListener('visibilitychange', this.onVisibility);
    addEventListener('hashchange', this.onHash);
  }

  start() {
    this.lastFrame = performance.now();
    this.renderer.setAnimationLoop(this.tick);
    requestAnimationFrame(() => this.canvas.classList.add('on'));
    this.emit();
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    removeEventListener('resize', this.layout);
    removeEventListener('wheel', this.onWheel);
    removeEventListener('keydown', this.onKey);
    removeEventListener('touchstart', this.onTouchStart);
    removeEventListener('touchmove', this.onTouchMove);
    removeEventListener('touchend', this.onTouchEnd);
    removeEventListener('pointermove', this.onPointer);
    document.removeEventListener('click', this.onClick);
    document.removeEventListener('visibilitychange', this.onVisibility);
    removeEventListener('hashchange', this.onHash);
    document.body.classList.remove('on-light');
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
  }

  // --- navegação ---

  go(index: number) {
    const i = Math.max(0, Math.min(this.last_, index));
    if (i === this.target) return;
    this.origin = this.arrived >= 0 ? this.arrived : Math.round(this.current);
    this.target = i;
    this.speed = Math.abs(i - this.current) > 1.5 ? TIMING.jumpSpeedup : 1;
    this.arrived = -1; // esconde o conteúdo até chegar
    this.emit();
  }

  // usado quando tem modal aberto
  setInputLocked(locked: boolean) {
    this.locked = locked;
    this.wheelAcc = 0;
  }

  private step(dir: number) {
    if (this.isMoving()) return;
    this.go(this.target + dir);
  }

  private isMoving() {
    return this.arrived < 0;
  }

  private indexOf(id: string) {
    return id ? this.ids.indexOf(id) : -1;
  }

  private emit() {
    this.onNavigate?.({ target: this.target, arrived: this.arrived });
  }

  private onWheel = (e: WheelEvent) => {
    if (e.ctrlKey || this.locked) return; // ctrl+scroll é zoom
    if (canScroll(e.target, e.deltaY)) return;
    e.preventDefault();
    const now = performance.now();
    const newGesture = now - this.lastWheel > 200;
    this.lastWheel = now;
    if (newGesture) {
      this.wheelAcc = 0;
      this.wheelSpent = false;
    }
    // um gesto só avança uma seção, mesmo com a inércia do trackpad
    if (this.wheelSpent || this.isMoving()) return;
    this.wheelAcc += e.deltaY;
    if (Math.abs(this.wheelAcc) > 25) {
      this.step(Math.sign(this.wheelAcc));
      this.wheelAcc = 0;
      this.wheelSpent = true;
    }
  };

  private onKey = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey || this.locked) return;
    const el = document.activeElement;
    const typing = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement;
    if (typing) return;
    const onControl = el instanceof HTMLButtonElement || el instanceof HTMLAnchorElement;
    switch (e.key) {
      case 'ArrowDown':
      case 'PageDown':
        e.preventDefault(); this.step(1); break;
      case ' ':
        if (onControl) return;
        e.preventDefault(); this.step(e.shiftKey ? -1 : 1); break;
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault(); this.step(-1); break;
      case 'Home':
        e.preventDefault(); this.go(0); break;
      case 'End':
        e.preventDefault(); this.go(this.last_); break;
    }
  };

  private onTouchStart = (e: TouchEvent) => {
    this.touchY = e.touches[0]?.clientY ?? null;
    const el = (e.target as Element | null)?.closest?.<HTMLElement>('[data-scroll]') ?? null;
    this.touchScroll = el ? { el, top: el.scrollTop, left: el.scrollLeft } : null;
  };

  private onTouchMove = (e: TouchEvent) => {
    if (this.locked || this.touchScroll) return;
    if (e.cancelable) e.preventDefault(); // evita o pull-to-refresh
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (this.touchY === null) return;
    const dy = this.touchY - (e.changedTouches[0]?.clientY ?? this.touchY);
    const sc = this.touchScroll;
    this.touchY = null;
    this.touchScroll = null;
    if (this.locked) return;
    // se rolou uma lista interna, o gesto foi dela
    if (sc && (sc.el.scrollTop !== sc.top || sc.el.scrollLeft !== sc.left)) return;
    if (Math.abs(dy) > 40) this.step(Math.sign(dy));
  };

  private onClick = (e: MouseEvent) => {
    if (this.locked) return;
    const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
    if (!a) return;
    const i = this.indexOf(a.getAttribute('href')!.slice(1));
    if (i < 0) return;
    e.preventDefault();
    this.go(i);
  };

  // url editada na mão ou voltar/avançar do navegador
  private onHash = () => {
    const i = this.indexOf(location.hash.slice(1));
    this.go(i < 0 ? 0 : i);
  };

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    this.mouse.x = (e.clientX / innerWidth) * 2 - 1;
    this.mouse.y = (e.clientY / innerHeight) * 2 - 1;
  };

  private advance(dt: number) {
    if (this.reduce) this.current = this.target;

    // O padrão das listras se repete a cada 2 seções, então dá pra pular de 2 em 2
    // sem ninguém perceber. Assim um salto longo só anima o final.
    if (this.current >= 1 && this.target >= 1) {
      const d = this.target - this.current;
      if (Math.abs(d) > 2) this.current += Math.sign(d) * 2 * Math.floor((Math.abs(d) - 1) / 2);
    }

    const d = this.target - this.current;
    if (Math.abs(d) > ARRIVE_EPS) {
      if (this.current < 1 || (this.target < 1 && this.current <= 1)) {
        // na abertura a velocidade é constante, pra animação tocar inteira
        const stepMax = (dt / TIMING.introDuration) * this.speed;
        this.current += Math.sign(d) * Math.min(Math.abs(d), stepMax);
      } else {
        // entre seções usa easing. Voltando pro hero vai em velocidade constante,
        // senão ele freia na seção 1 antes de continuar.
        const goal = Math.max(this.target, 1);
        const max = dt * TIMING.sectionMaxSpeed * this.speed;
        let step = this.target < 1
          ? Math.sign(goal - this.current) * max
          : (goal - this.current) * (1 - Math.exp(-dt * TIMING.sectionDamping * this.speed));
        step = Math.max(-max, Math.min(max, step));
        if (Math.abs(step) >= Math.abs(goal - this.current) || Math.abs(goal - this.current) < ARRIVE_EPS) this.current = goal;
        else this.current += step;
      }
    }

    // considera que chegou um pouco antes de parar de vez
    const remaining = Math.abs(this.target - this.current);
    const close = this.target <= 1 ? remaining <= ARRIVE_EPS : remaining <= SHOW_EPS;
    if (this.arrived < 0 && close) {
      if (remaining <= ARRIVE_EPS) this.current = this.target;
      this.arrived = this.target;
      const id = this.ids[this.target];
      history.replaceState(null, '', this.target === 0 ? location.pathname + location.search : `#${id}`);
      this.emit();
    }
  }

  // --- render ---

  private layout = () => {
    const { renderer, camera } = this;
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();

    const pr = renderer.getPixelRatio();
    this.surfMat.uniforms.uRes.value.set(innerWidth * pr, innerHeight * pr);
    // listra larga o suficiente pra cobrir a tela inteira quando parada
    const extent = Math.abs(STRIPE_DIR.x) * camera.aspect + Math.abs(STRIPE_DIR.y);
    this.surfMat.uniforms.uK.value = 0.22 / extent;

    this.layoutPose = camera.aspect < 0.9 ? { y: 0.1, s: 0.78, cs: 0.9 } : { y: 0, s: 0.92, cs: 1 };
  };

  private onVisibility = () => {
    if (document.hidden) this.renderer.setAnimationLoop(null);
    else {
      this.lastFrame = performance.now();
      this.renderer.setAnimationLoop(this.tick);
    }
  };

  private tick = (now: number) => {
    const dt = Math.min((now - this.lastFrame) / 1000, 0.05);
    this.lastFrame = now;
    this.time += dt;
    if (this.load < 1) this.load = Math.min(1, this.load + dt / 1.4);

    const k = 1 - Math.exp(-dt * 4);
    this.mouseSmooth.x += (this.mouse.x - this.mouseSmooth.x) * k;
    this.mouseSmooth.y += (this.mouse.y - this.mouseSmooth.y) * k;

    this.advance(dt);

    const p = clamp01(this.current);
    if (p < 0.7) this.renderPole(p, dt);
    else this.renderSurface();

    this.updateDom(p);
    this.updatePhoto();
  };

  private renderPole(p: number, dt: number) {
    const { camera, pole, load } = this;
    // `idle` é o giro lento do hero e congela quando começa o scroll. `corr` ajusta
    // o giro pra terminar com o meio de uma listra preta no centro da tela.
    if (p < 0.02 && !this.reduce) this.idle += dt * 0.18;
    const corr = (((K_CENTER - this.idle) % 1) + 1) % 1;
    const spin = ease(seg(p, 0.05, 0.55)) * 3 + corr * ease(seg(p, 0.2, 0.55));
    this.poleMat.uniforms.uOffset.value = this.idle + spin;

    const P = this.layoutPose;
    const eC = ease(seg(p, 0.1, 0.45));
    const eZ = ease(seg(p, 0.25, 0.55));
    const eF = ease(seg(p, 0.55, 0.66));
    const sc = lerp(P.s, lerp(P.cs, 1, eZ), eC) * (0.85 + 0.15 * easeOut(load));
    const d0 = camera.position.z - R * sc;
    const dist = eF > 0 ? D_NEAR * Math.pow(D_END / D_NEAR, eF) : lerp(d0, D_NEAR, eZ);

    // o poste segue o mouse e o nome vai pro lado contrário
    const par = this.reduce ? 0 : 1 - ease(seg(p, 0, 0.25));
    const mx = this.mouseSmooth.x * par, my = this.mouseSmooth.y * par;

    pole.position.set(
      mx * 0.12,
      lerp(P.y, 0, eC) + (1 - eC) * Math.sin(this.time * 0.9) * 0.05 - (1 - easeOut(load)) * 0.6 - my * 0.08,
      camera.position.z - R * sc - dist,
    );
    pole.rotation.z = -mx * 0.02;
    pole.scale.setScalar(sc);
    this.poleMat.uniforms.uGloss.value = 1 - easeIn(seg(p, 0.45, 0.66));
    this.setLight(false);
    this.renderer.render(this.scene, camera);

    if (this.dom.brand) {
      this.dom.brand.style.transform = `translate3d(${(-mx * 12).toFixed(2)}px,${(-my * 8).toFixed(2)}px,0)`;
    }
  }

  private renderSurface() {
    const after = Math.max(0, this.current - 1);
    const u = this.surfMat.uniforms;
    u.uOffset.value = after * 0.5;
    u.uCurve.value = ease(seg(this.current, 0.7, 1));
    u.uTime.value = this.reduce ? 0 : this.time;
    this.setLight(Math.round(after) % 2 === 1);
    this.renderer.render(this.surfScene, this.surfCam);
  }

  private setLight(light: boolean) {
    if (light === this.onLight) return;
    this.onLight = light;
    document.body.classList.toggle('on-light', light);
  }

  // O main só aparece se a navegação começa ou termina nele. Num salto que só
  // passa por ele (ex: da última seção pro hero), ele fica escondido.
  private introGate() {
    return this.target === 1 || this.origin === 1 ? 1 : 0;
  }

  private updateDom(p: number) {
    const { letters, heroSub, heroHint, logo, introCard } = this.dom;
    const load = this.load;
    const gate = this.introGate();
    const leave = 1 - ease(seg(this.current, 1, 1.12));
    const key = `${p.toFixed(3)}${load.toFixed(3)}${gate}${leave.toFixed(3)}`;
    if (key === this.lastDomKey) return;
    this.lastDomKey = key;

    const mid = (letters.length - 1) / 2;
    letters.forEach((sp, k) => {
      const tin = easeOut(clamp01(load * 1.5 - k * 0.07));
      const tout = ease(clamp01((p / 0.16) * 1.6 - k * 0.09));
      sp.style.opacity = (tin * (1 - tout)).toFixed(3);
      sp.style.transform = `translate3d(${(tout * (k - mid) * 34).toFixed(1)}px,${((1 - tin) * 60 - tout * 30).toFixed(1)}px,0) scale(${(1 + tout * 0.25).toFixed(3)})`;
      sp.style.filter = this.reduce ? '' : `blur(${(tout * 8).toFixed(1)}px)`;
    });

    const o = (clamp01(load * 1.2 - 0.4) * (1 - ease(seg(p, 0, 0.12)))).toFixed(3);
    if (heroSub) heroSub.style.opacity = o;
    if (heroHint) heroHint.style.opacity = o;
    if (logo) logo.style.opacity = ease(seg(p, 0.75, 0.92)).toFixed(3);

    if (introCard) {
      const c = ease(seg(p, 0.72, 0.95)) * gate * leave;
      introCard.style.opacity = c.toFixed(3);
      introCard.style.transform = `translate3d(0,${((1 - c) * 24).toFixed(1)}px,0) scale(${(0.96 + 0.04 * c).toFixed(3)})`;
      introCard.style.pointerEvents = c > 0.5 ? 'auto' : 'none';
      introCard.style.visibility = c > 0.001 ? 'visible' : 'hidden';
    }
  }

  private updatePhoto() {
    const { photo } = this.dom;
    if (!photo) return;
    const cur = this.current;
    const o = ease(seg(cur, 0.7, 0.95)) * (1 - ease(seg(cur, 1, 1.3))) * this.introGate();
    const v = Math.round(o * 1000) / 1000;
    if (v === this.lastPhoto) return;
    this.lastPhoto = v;
    photo.style.opacity = String(v);
    photo.style.transform = `scale(${(1.06 - 0.06 * ease(seg(cur, 0.7, 1))).toFixed(4)})`;
  }
}
