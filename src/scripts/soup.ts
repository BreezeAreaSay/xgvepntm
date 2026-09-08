/**
 * 3D-сцена: миска малатана.
 *
 * Геометрия собрана процедурно из примитивов — внешней модели нет вообще.
 * Это осознанное решение: GLB из генератора весил бы несколько мегабайт,
 * а здесь весь «ассет» — несколько сотен строк кода, которые уже приехали
 * в основном бандле. Хотите фотореализм — замените createBowl()
 * на GLTFLoader и сжатую модель (Draco + KTX2), интерфейс модуля не изменится.
 *
 * Что сделано для скорости:
 *  - модуль загружается лениво (см. SoupScene.astro), не в первую секунду;
 *  - рендер останавливается, когда канвас вне экрана;
 *  - плотность пикселей ограничена, чтобы не рисовать 4K на телефоне;
 *  - при prefers-reduced-motion рисуется один кадр без анимации.
 */

import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  BufferGeometry,
  CanvasTexture,
  CapsuleGeometry,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  LatheGeometry,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  WebGLRenderer,
  type Object3D,
} from 'three';

/** Палитра сцены — держим синхронной с global.css. */
const PALETTE = {
  bowlOuter: 0xff4a0f,
  bowlInner: 0x1a1a1a,
  broth: 0xd8340a,
  brothGlow: 0xff6a2b,
  lotus: 0xf2e4cf,
  mushroom: 0xc79a63,
  corn: 0xf5c331,
  greens: 0x4f8f3a,
  noodle: 0xf0dfba,
  shrimp: 0xff7a52,
} as const;

/** Управляет жизненным циклом сцены. Возвращается из initSoupScene. */
export type SoupScene = {
  /** Останавливает рендер и освобождает GPU-память. */
  dispose: () => void;
};

type Bobbing = {
  object: Object3D;
  baseY: number;
  /** Сдвиг фазы, чтобы ингредиенты качались не в такт. */
  phase: number;
  amplitude: number;
};

/* ============================================================
   Построение геометрии
   ============================================================ */

/**
 * Миска: тело вращения с 8 сегментами — даёт гранёную,
 * почти восьмиугольную форму, как на фото в печатном меню.
 */
function createBowl(): Group {
  const group = new Group();

  const profile = [
    new Vector2(0.30, 0.00),
    new Vector2(0.38, 0.04),
    new Vector2(0.62, 0.22),
    new Vector2(0.88, 0.46),
    new Vector2(1.00, 0.58),
    new Vector2(0.99, 0.62),
  ];

  const wall = new Mesh(
    new LatheGeometry(profile, 8),
    new MeshStandardMaterial({
      color: PALETTE.bowlOuter,
      roughness: 0.42,
      metalness: 0.05,
      flatShading: true,
      side: 2, // DoubleSide — видно и внешнюю, и внутреннюю поверхность
    }),
  );
  group.add(wall);

  // Внутренняя поверхность темнее — так миска читается объёмной.
  const inner = new Mesh(
    new LatheGeometry(profile.map((p) => new Vector2(p.x * 0.94, p.y)), 8),
    new MeshStandardMaterial({
      color: PALETTE.bowlInner,
      roughness: 0.75,
      flatShading: true,
      side: 1, // BackSide
    }),
  );
  group.add(inner);

  const foot = new Mesh(
    new CylinderGeometry(0.34, 0.30, 0.06, 8),
    new MeshStandardMaterial({ color: 0x111111, roughness: 0.8, flatShading: true }),
  );
  foot.position.y = -0.03;
  group.add(foot);

  return group;
}

/** Поверхность бульона — плоский диск со свечением. */
function createBroth(): Mesh {
  const broth = new Mesh(
    new CircleGeometry(0.9, 48),
    new MeshStandardMaterial({
      color: PALETTE.broth,
      roughness: 0.18,
      metalness: 0.1,
      emissive: new Color(PALETTE.brothGlow),
      emissiveIntensity: 0.35,
    }),
  );
  broth.rotation.x = -Math.PI / 2;
  broth.position.y = 0.5;
  return broth;
}

/** Ломтик лотоса. */
function createLotus(): Mesh {
  return new Mesh(
    new CylinderGeometry(0.14, 0.14, 0.028, 12),
    new MeshStandardMaterial({ color: PALETTE.lotus, roughness: 0.6, flatShading: true }),
  );
}

/** Гриб: шляпка плюс ножка. */
function createMushroom(): Group {
  const g = new Group();
  const cap = new Mesh(
    new SphereGeometry(0.1, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2),
    new MeshStandardMaterial({ color: PALETTE.mushroom, roughness: 0.65, flatShading: true }),
  );
  const stem = new Mesh(
    new CylinderGeometry(0.035, 0.04, 0.09, 8),
    new MeshStandardMaterial({ color: 0xe8d9bd, roughness: 0.7, flatShading: true }),
  );
  stem.position.y = -0.045;
  g.add(cap, stem);
  return g;
}

/** Кусочек кукурузы. */
function createCorn(): Mesh {
  const corn = new Mesh(
    new CylinderGeometry(0.075, 0.075, 0.15, 10),
    new MeshStandardMaterial({ color: PALETTE.corn, roughness: 0.5, flatShading: true }),
  );
  corn.rotation.z = Math.PI / 2;
  return corn;
}

/** Зелень — две скрещённые плоскости, читается как лист. */
function createGreens(): Group {
  const g = new Group();
  const material = new MeshStandardMaterial({
    color: PALETTE.greens,
    roughness: 0.7,
    side: 2,
    flatShading: true,
  });
  for (let i = 0; i < 2; i += 1) {
    const leaf = new Mesh(new PlaneGeometry(0.22, 0.13), material);
    leaf.rotation.set(-Math.PI / 2.4, 0, (i * Math.PI) / 2.5);
    g.add(leaf);
  }
  return g;
}

/** Завиток лапши. */
function createNoodle(): Mesh {
  const noodle = new Mesh(
    new TorusGeometry(0.13, 0.022, 6, 14),
    new MeshStandardMaterial({ color: PALETTE.noodle, roughness: 0.55, flatShading: true }),
  );
  noodle.rotation.x = -Math.PI / 2.2;
  return noodle;
}

/** Креветка. */
function createShrimp(): Mesh {
  const shrimp = new Mesh(
    new CapsuleGeometry(0.045, 0.1, 3, 8),
    new MeshStandardMaterial({ color: PALETTE.shrimp, roughness: 0.4, flatShading: true }),
  );
  shrimp.rotation.set(Math.PI / 2, 0, Math.PI / 5);
  return shrimp;
}

/** Мягкое пятно для частиц пара. Рисуется на canvas, файлов не требует. */
function createSteamTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  // getContext возвращает null — strictNullChecks заставляет это обработать.
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2D-контекст недоступен: не могу построить текстуру пара');
  }

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,0.5)');
  gradient.addColorStop(0.45, 'rgba(255,255,255,0.14)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  return new CanvasTexture(canvas);
}

const STEAM_COUNT = 70;
const STEAM_TOP = 1.9;

function createSteam(texture: CanvasTexture): { points: Points; speeds: Float32Array } {
  const positions = new Float32Array(STEAM_COUNT * 3);
  const speeds = new Float32Array(STEAM_COUNT);

  for (let i = 0; i < STEAM_COUNT; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 0.6;
    positions[i * 3] = Math.cos(angle) * radius;
    positions[i * 3 + 1] = 0.55 + Math.random() * (STEAM_TOP - 0.55);
    positions[i * 3 + 2] = Math.sin(angle) * radius;
    speeds[i] = 0.09 + Math.random() * 0.14;
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

  const points = new Points(
    geometry,
    new PointsMaterial({
      size: 0.3,
      map: texture,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      opacity: 0.75,
    }),
  );

  return { points, speeds };
}

/* ============================================================
   Сборка и запуск
   ============================================================ */

export function initSoupScene(canvas: HTMLCanvasElement): SoupScene {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: window.devicePixelRatio < 1.5,
    powerPreference: 'low-power',
  });
  // Ограничиваем плотность пикселей: выше 1.75 разница не видна,
  // а нагрузка на GPU растёт квадратично.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();

  const camera = new PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 1.75, 3.15);
  camera.lookAt(0, 0.45, 0);

  scene.add(new AmbientLight(0xffffff, 0.55));

  const key = new DirectionalLight(0xffffff, 2.1);
  key.position.set(2.4, 4, 2.6);
  scene.add(key);

  const rim = new DirectionalLight(PALETTE.brothGlow, 0.8);
  rim.position.set(-3, 1.2, -2);
  scene.add(rim);

  // Свет изнутри миски — бульон как будто светится.
  const glow = new PointLight(PALETTE.brothGlow, 2.4, 3.2, 2);
  glow.position.set(0, 0.62, 0);
  scene.add(glow);

  // Группа, которую вращает пользователь.
  const stage = new Group();
  scene.add(stage);

  stage.add(createBowl());
  stage.add(createBroth());

  // Раскладываем ингредиенты по кругу на поверхности бульона.
  const factories = [
    createLotus,
    createMushroom,
    createCorn,
    createGreens,
    createNoodle,
    createShrimp,
    createLotus,
    createMushroom,
    createGreens,
    createCorn,
  ];

  const bobbing: Bobbing[] = [];

  factories.forEach((factory, index) => {
    const item = factory();
    const angle = (index / factories.length) * Math.PI * 2 + 0.35;
    const radius = 0.28 + (index % 3) * 0.19;
    const y = 0.53 + (index % 2) * 0.02;

    item.position.set(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    item.rotation.y = angle;
    stage.add(item);

    bobbing.push({
      object: item,
      baseY: y,
      phase: index * 0.7,
      amplitude: 0.014 + (index % 3) * 0.006,
    });
  });

  const steamTexture = createSteamTexture();
  const { points: steam, speeds: steamSpeeds } = createSteam(steamTexture);
  stage.add(steam);

  /* ---------- Размер под контейнер ---------- */

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);
  resize();

  /* ---------- Управление мышью и пальцем ---------- */

  let targetRotationY = -0.35;
  let currentRotationY = -0.35;
  let targetTiltX = 0;
  let currentTiltX = 0;
  let dragging = false;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let idleSince = performance.now();

  function onPointerDown(event: PointerEvent): void {
    dragging = true;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  }

  function onPointerMove(event: PointerEvent): void {
    if (!dragging) return;
    targetRotationY += (event.clientX - lastPointerX) * 0.008;
    targetTiltX = MathUtils.clamp(
      targetTiltX + (event.clientY - lastPointerY) * 0.004,
      -0.25,
      0.42,
    );
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    idleSince = performance.now();
  }

  function onPointerUp(event: PointerEvent): void {
    dragging = false;
    if (canvas.hasPointerCapture(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    canvas.style.cursor = 'grab';
    idleSince = performance.now();
  }

  canvas.style.cursor = 'grab';
  canvas.style.touchAction = 'pan-y';
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);

  /* ---------- Цикл отрисовки ---------- */

  const clock = { last: performance.now(), elapsed: 0 };
  let frameId: number | null = null;
  let visible = false;

  const steamPositions = steam.geometry.getAttribute('position');

  function renderFrame(now: number): void {
    const delta = Math.min((now - clock.last) / 1000, 0.05);
    clock.last = now;
    clock.elapsed += delta;

    // Автовращение включается, когда пользователь не трогает сцену.
    const idleFor = now - idleSince;
    if (!dragging && idleFor > 1200) {
      targetRotationY += delta * 0.22;
    }

    currentRotationY += (targetRotationY - currentRotationY) * Math.min(1, delta * 6);
    currentTiltX += (targetTiltX - currentTiltX) * Math.min(1, delta * 6);
    stage.rotation.y = currentRotationY;
    stage.rotation.x = currentTiltX;

    for (const item of bobbing) {
      item.object.position.y =
        item.baseY + Math.sin(clock.elapsed * 1.5 + item.phase) * item.amplitude;
    }

    for (let i = 0; i < STEAM_COUNT; i += 1) {
      const y = steamPositions.getY(i) + steamSpeeds[i]! * delta;
      steamPositions.setY(i, y > STEAM_TOP ? 0.55 : y);
    }
    steamPositions.needsUpdate = true;

    glow.intensity = 2.2 + Math.sin(clock.elapsed * 2.1) * 0.35;

    renderer.render(scene, camera);
  }

  function loop(now: number): void {
    renderFrame(now);
    frameId = requestAnimationFrame(loop);
  }

  function start(): void {
    if (frameId !== null) return;
    clock.last = performance.now();
    frameId = requestAnimationFrame(loop);
  }

  function stop(): void {
    if (frameId === null) return;
    cancelAnimationFrame(frameId);
    frameId = null;
  }

  // Ключевая оптимизация: не рисуем ничего, пока миска вне экрана.
  const visibilityObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;
      visible = entry.isIntersecting;
      if (visible && !reducedMotion) start();
      else stop();
    },
    { threshold: 0.05 },
  );
  visibilityObserver.observe(canvas);

  function onDocumentVisibility(): void {
    if (document.hidden) stop();
    else if (visible && !reducedMotion) start();
  }
  document.addEventListener('visibilitychange', onDocumentVisibility);

  if (reducedMotion) {
    // Пользователь просил меньше движения: один статичный кадр.
    stage.rotation.y = -0.35;
    renderer.render(scene, camera);
  } else {
    start();
  }

  /* ---------- Уборка ---------- */

  function dispose(): void {
    stop();
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    document.removeEventListener('visibilitychange', onDocumentVisibility);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);

    scene.traverse((object) => {
      if (object instanceof Mesh || object instanceof Points) {
        object.geometry.dispose();
        const material = object.material;
        if (Array.isArray(material)) material.forEach((m) => m.dispose());
        else material.dispose();
      }
    });
    steamTexture.dispose();
    renderer.dispose();
  }

  return { dispose };
}
