const validation = {
  import: {
    dialogTitle: 'Ошибка импорта',
    dialogDescription: 'JSON-файл не удалось импортировать. Данные персонажа не изменены.',
    notAnObject: 'Файл должен содержать JSON-объект персонажа.',
    missingStringField: 'Поле "{{key}}" отсутствует или имеет неверный тип (ожидается строка).',
    missingDieField: 'Поле "{{key}}" должно быть строкой (например: d6, d6(A) или пустым).',
    skillsNotArray: 'Поле "skills" должно быть массивом.',
    edgesNotArray: 'Поле "edges" должно быть массивом.',
    hindrancesNotArray: 'Поле "hindrances" должно быть массивом.',
    weaponsNotArray: 'Поле "weapons" должно быть массивом.',
    gearNotArray: 'Поле "gear" должно быть массивом.',
    specialRulesNotArray: 'Поле "specialRules" должно быть массивом.',
    fileReadFailed: 'Не удалось прочитать файл.',
    invalidJson: 'Файл не является допустимым JSON.',
    fileReadError: 'Ошибка чтения файла.',
  },
} as const

export default validation
