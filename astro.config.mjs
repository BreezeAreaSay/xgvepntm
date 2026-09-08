import { defineConfig } from 'astro/config';

export default defineConfig({
  // Статическая сборка: в dist/ получаются готовые файлы,
  // которые заливаются на обычный хостинг reg.ru по SFTP.
  output: 'static',

  // ВАЖНО: замените на реальный домен перед продакшн-сборкой.
  // От него зависят sitemap и абсолютные ссылки в Open Graph.
  site: 'https://example.ru',

  build: {
    // CSS инлайнится в <head>, если он меньше этого порога —
    // экономит один сетевой запрос на первой отрисовке.
    inlineStylesheets: 'auto',
  },

  compressHTML: true,
});
