const handbooks = {
  title: 'Справочники',
  tabs: {
    edges: 'Черты',
    hindrances: 'Изъяны',
    weapons: 'Оружие',
    gear: 'Снаряжение',
    powers: 'Силы',
    transport: 'Транспорт',
    racialAbilities: 'Расовые способности',
  },
  search: {
    placeholder: 'Поиск...',
    noResults: 'Нет результатов для «{{query}}»',
  },
  badge: {
    swade: 'SWADE',
  },
  entry: {
    details: 'Подробнее',
    requirements: 'Требования',
    rank: 'Ранг',
    attributes: 'Характеристики',
    skills: 'Навыки',
    edges: 'Черты',
    name: 'Название',
    close: 'Закрыть',
  },
  fields: {
    type: 'Тип',
    damage: 'Урон',
    range: 'Дальность',
    ap: 'ББ',
    rof: 'ОС',
    weight: 'Вес',
    cost: 'Стоимость',
    ppCost: 'Стоимость ПС',
    duration: 'Длительность',
    arcaneBackground: 'Мистический дар',
    toughness: 'Стойкость',
    pace: 'Темп',
    handling: 'Управляемость',
    points: 'Очки',
    category: 'Категория',
  },
} as const

export default handbooks
