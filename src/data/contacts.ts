/**
 * Контакты и внешние ссылки.
 *
 * ⚠️ ВСЕ ЗНАЧЕНИЯ НИЖЕ — ЗАГЛУШКИ. Я не придумываю адрес, телефон и часы
 * работы реального заведения: если ошибиться, гости поедут не туда.
 * Заполните перед публикацией, список нужных данных — в DATA-NEEDED.md.
 *
 * Компоненты сами скрывают блоки с незаполненными значениями,
 * так что сайт не сломается, пока данных нет.
 */

/** Помечает значение как незаполненное. */
export const TODO = null;

export type WorkingHours = {
  /** Например: 'Пн–Чт' */
  days: string;
  /** Например: '11:00 – 22:00' */
  hours: string;
};

export type Contacts = {
  /** Название заведения для заголовков и Open Graph. */
  brandName: string;
  city: string | null;
  /**
   * Город в предложном падеже — для подстановки после «в»:
   * «малатан в Москве», а не «малатан в Москва».
   *
   * Отдельным полем, а не вычислением: склонение в русском языке
   * правилами не берётся (Москва → Москве, но Тверь → Твери,
   * Сочи → Сочи). Одно слово в данных надёжнее любой функции.
   */
  cityIn: string | null;
  address: string | null;
  /** В формате для набора: +7 999 000-00-00 */
  phone: string | null;
  /** Ссылка на страницу заведения в Яндекс Картах. */
  yandexMapsUrl: string | null;
  /**
   * Код виджета «Конструктор карт Яндекса» — только src из <iframe>.
   * Получить: yandex.ru/map-constructor → отметить точку → «Получить код».
   */
  yandexMapEmbedUrl: string | null;
  /** Ссылка на страницу ресторана в Яндекс Еде. */
  yandexEdaUrl: string | null;
  /** Соцсети — пустой массив, если их нет. */
  socials: { label: string; url: string }[];
  workingHours: WorkingHours[];
};

export const contacts: Contacts = {
  brandName: 'Джан Лян Малатан',

  city: 'Москва',
  cityIn: 'Москве',   // «малатан в Москве»
  // Подтверждено владельцем.
  address: 'проспект Вернадского, 105к4',
  phone: TODO,              // например: '+7 999 000-00-00'

  // Подтверждено владельцем: точка на просп. Вернадского, 105к4 (м. Юго-Западная).
  yandexMapsUrl: 'https://yandex.ru/maps/org/dzhan_lyan_malatan/13436227398/',
  yandexMapEmbedUrl: TODO,  // https://yandex.ru/map-widget/v1/?...
  yandexEdaUrl: TODO,       // https://eda.yandex.ru/restaurant/...

  socials: [
    // { label: 'Telegram', url: 'https://t.me/...' },
  ],

  workingHours: [
    // { days: 'Пн–Вс', hours: '11:00 – 22:00' },
  ],
};

/** Телефон без разделителей — для href="tel:". */
export function phoneHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}
