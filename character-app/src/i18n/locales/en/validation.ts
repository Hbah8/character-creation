const validation = {
  import: {
    dialogTitle: 'Import Failed',
    dialogDescription: 'The JSON file could not be imported. Your current character data has not been changed.',
    notAnObject: 'File must contain a character JSON object.',
    missingStringField: 'Field "{{key}}" is missing or has an invalid type (expected string).',
    missingDieField: 'Field "{{key}}" must be a string (e.g. d6, d6(A) or empty).',
    skillsNotArray: 'Field "skills" must be an array.',
    edgesNotArray: 'Field "edges" must be an array.',
    hindrancesNotArray: 'Field "hindrances" must be an array.',
    weaponsNotArray: 'Field "weapons" must be an array.',
    gearNotArray: 'Field "gear" must be an array.',
    specialRulesNotArray: 'Field "specialRules" must be an array.',
    fileReadFailed: 'Failed to read file.',
    invalidJson: 'File is not valid JSON.',
    fileReadError: 'File read error.',
  },
} as const

export default validation
