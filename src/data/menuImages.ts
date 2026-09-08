/**
 * Сопоставление блюд с фотографиями — по имени файла.
 *
 * Соглашение: файл называется как `id` блюда из menu.ts.
 * Положили `src/assets/menu/classic-spicy.jpg` — фото появилось у
 * «Классического пряно-острого супа». Править код при этом не нужно.
 *
 * Почему файлы лежат в `src/assets/`, а не в `public/`:
 * всё, что попадает в src/assets, Astro прогоняет через оптимизатор —
 * пережимает в AVIF и WebP, нарезает под размеры экрана и добавляет
 * хеш в имя файла для кеширования. Из public/ файлы отдаются как есть.
 */

import type { ImageMetadata } from 'astro';

// import.meta.glob собирает файлы на этапе сборки.
// Пустая папка — не ошибка: получится пустой список.
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '../assets/menu/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

const byId = new Map<string, ImageMetadata>();

for (const [path, module] of Object.entries(modules)) {
  const fileName = path.split('/').pop();
  if (!fileName) continue;
  byId.set(fileName.replace(/\.[^.]+$/, ''), module.default);
}

/**
 * Фото блюда или undefined, если его ещё не положили.
 *
 * Map, а не объект, специально: `map.get()` честно возвращает
 * `ImageMetadata | undefined`, и компилятор заставит обработать
 * отсутствие файла. У обычного объекта тип был бы просто
 * `ImageMetadata`, и мы бы узнали о пропущенном фото уже в браузере.
 */
export function menuImage(id: string): ImageMetadata | undefined {
  return byId.get(id);
}

/** Сколько фотографий загружено — используется в подсказках при разработке. */
export const menuImageCount: number = byId.size;
