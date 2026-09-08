/**
 * Данные меню — единственный источник правды.
 * Правите здесь, вёрстка подхватывает автоматически.
 *
 * Цены перенесены с печатного меню ДЖАН ЛЯН МАЛАТАН.
 * Сверьте перед публикацией: цены меняются, а сайт живёт долго.
 */

/** Острота: 0 — не острое, 3 — максимум (перчики в печатном меню). */
export type SpiceLevel = 0 | 1 | 2 | 3;

export type MenuItem = {
  /** Уникальный id — используется как ключ и как якорь. */
  id: string;
  /** Название на русском. */
  title: string;
  /** Название на китайском, как в печатном меню. */
  titleZh: string;
  /** Цена в рублях. */
  price: number;
  /** true — цена указана как доплата («+60 руб») к весу наполнителей. */
  isSurcharge: boolean;
  spice: SpiceLevel;
  /** Путь к фото в /public/menu/. null — фото ещё не добавлено. */
  image: string | null;
  /** Короткое пояснение для гостя. Необязательно. */
  note?: string;
};

export type MenuSection = {
  id: string;
  title: string;
  /** Подзаголовок-пояснение под названием раздела. */
  subtitle?: string;
  items: MenuItem[];
};

/** Основа блюда: выбирается первой, цена — доплата к наполнителям. */
const broths: MenuItem[] = [
  {
    id: 'classic-spicy',
    title: 'Классический пряно-острый суп',
    titleZh: '经典麻辣骨汤',
    price: 60,
    isSurcharge: true,
    spice: 1,
    image: null,
  },
  {
    id: 'tomato',
    title: 'Солнечный томатный суп',
    titleZh: '阳光番茄浓汤',
    price: 80,
    isSurcharge: true,
    spice: 0,
    image: null,
  },
  {
    id: 'mushroom',
    title: 'Нежный грибной суп',
    titleZh: '姬松茸菌汤',
    price: 80,
    isSurcharge: true,
    spice: 0,
    image: null,
  },
  {
    id: 'tom-yam',
    title: 'Суп Том Ям',
    titleZh: '冬阴功汤',
    price: 80,
    isSurcharge: true,
    spice: 2,
    image: null,
  },
  {
    id: 'hot-sour',
    title: 'Горячий кисло-острый суп',
    titleZh: '酸辣金汤',
    price: 80,
    isSurcharge: true,
    spice: 2,
    image: null,
  },
];

/** Блюда без бульона — жареные и в соусе. */
const dishes: MenuItem[] = [
  {
    id: 'mao-kai',
    title: 'Мао Кай на говяжьем жире',
    titleZh: '蜀香牛油冒菜',
    price: 200,
    isSurcharge: true,
    spice: 1,
    image: null,
  },
  {
    id: 'mala-ban',
    title: 'Мала Бан — ароматный микс в соусе',
    titleZh: '醇香干汁麻辣拌',
    price: 200,
    isSurcharge: true,
    spice: 2,
    image: null,
  },
  {
    id: 'mala-syangu',
    title: 'Мала Сянгу — обжаренный на воке',
    titleZh: '麻辣香锅 +含一份米饭',
    price: 300,
    isSurcharge: true,
    spice: 3,
    image: null,
    note: 'В стоимость включена порция риса',
  },
];

/** Гарниры и добавки с фиксированной ценой. */
const sides: MenuItem[] = [
  {
    id: 'rice',
    title: 'Китайский белый рис на пару',
    titleZh: '香喷喷白米饭',
    price: 100,
    isSurcharge: false,
    spice: 0,
    image: null,
  },
];

export const menu: MenuSection[] = [
  {
    id: 'broths',
    title: 'Основа',
    subtitle: 'Выберите бульон — цена добавляется к весу наполнителей',
    items: broths,
  },
  {
    id: 'dishes',
    title: 'Блюда',
    subtitle: 'Без бульона: на воке или в соусе',
    items: dishes,
  },
  {
    id: 'sides',
    title: 'Гарниры',
    items: sides,
  },
];

/** Цена наполнителей — ключевая цифра всего меню, поэтому отдельно. */
export const fillings = {
  pricePer100g: 168,
  titleZh: '168卢布/100克',
} as const;

/** Упаковка для заказа с собой. */
export const takeawayPackaging = {
  price: 100,
  titleZh: '打包/外卖 需100卢布包装盒费用',
} as const;
