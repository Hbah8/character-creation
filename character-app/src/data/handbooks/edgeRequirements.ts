import type {
  ArcaneBackgroundRequirement,
  AttributeKey,
  Die,
  EdgeRequirement,
  EdgeRequirementCondition,
  EdgeRequirements,
  Rank,
} from '@/types/handbook'

const requirements = (minimum: Rank, ...conditions: EdgeRequirement[]): EdgeRequirements => ({
  allOf: [{ type: 'rank', minimum }, ...conditions],
})

const attribute = (attributeKey: AttributeKey, minimum: Die): EdgeRequirementCondition => ({
  type: 'attribute', attribute: attributeKey, minimum,
})

const skill = (skillKey: string, minimum: Die): EdgeRequirementCondition => ({
  type: 'skill', skill: skillKey, minimum,
})

const edge = (edgeId: string, arcaneBackground?: ArcaneBackgroundRequirement): EdgeRequirementCondition => ({
  type: 'edge', edgeId, ...(arcaneBackground ? { arcaneBackground } : {}),
})

const hindrance = (hindranceId: string): EdgeRequirementCondition => ({ type: 'hindrance', hindranceId })
const wildCard = (): EdgeRequirementCondition => ({ type: 'wildCard' })
const text = (value: string): EdgeRequirementCondition => ({ type: 'text', text: value })
const anyOf = (...conditions: EdgeRequirementCondition[]): EdgeRequirement => ({ anyOf: conditions })

/**
 * The application's static catalog of baseline SWADE Edge requirements.
 *
 * Entries use stable IDs and structured conditions. `example/SWADE_EDGES.json`
 * is reference material only and is not read by the application.
 */
export const SWADE_EDGE_REQUIREMENTS: Readonly<Record<string, EdgeRequirements>> = {
  // Background
  ambidekstr: requirements('Novice', attribute('agility', 'd8')),
  aristokrat: requirements('Novice'),
  bditelnost: requirements('Novice'),
  berserk: requirements('Novice'),
  bogatstvo: requirements('Novice'),
  'bogatstvo-plus': requirements('Novice', edge('bogatstvo')),
  bugay: requirements('Novice', attribute('strength', 'd6'), attribute('vigor', 'd6')),
  bystronogost: requirements('Novice', attribute('agility', 'd6')),
  vezenie: requirements('Novice'),
  'vezenie-plus': requirements('Novice', edge('vezenie')),
  'kak-na-sobake': requirements('Novice', attribute('vigor', 'd8')),
  'misticheskiy-dar': requirements('Novice'),
  obayanie: requirements('Novice', attribute('spirit', 'd8')),
  poliglot: requirements('Novice', attribute('smarts', 'd6')),
  privlekatelnost: requirements('Novice', attribute('vigor', 'd6')),
  'privlekatelnost-plus': requirements('Novice', edge('privlekatelnost')),
  silach: requirements('Novice', attribute('strength', 'd6'), attribute('vigor', 'd6')),
  slava: requirements('Novice'),
  'slava-plus': requirements('Seasoned', edge('slava')),
  smelost: requirements('Novice', attribute('spirit', 'd6')),
  stremitelnost: requirements('Novice', attribute('agility', 'd8')),
  uporstvo: requirements('Novice', attribute('spirit', 'd8')),
  'ustoychivost-k-misticheskim-silam': requirements('Novice', attribute('spirit', 'd8')),
  'ustoychivost-k-misticheskim-silam-plus': requirements('Novice', edge('ustoychivost-k-misticheskim-silam')),

  // Combat
  'beglyy-ogon': requirements('Seasoned', skill('shooting', 'd6')),
  'beglyy-ogon-plus': requirements('Veteran', edge('beglyy-ogon')),
  besposchadnost: requirements('Seasoned'),
  blok: requirements('Seasoned', skill('fighting', 'd8')),
  'blok-plus': requirements('Veteran', edge('blok')),
  'boevaya-zakalka': requirements('Seasoned'),
  'boevaya-yarost': requirements('Seasoned', skill('fighting', 'd8')),
  'boevaya-yarost-plus': requirements('Veteran', edge('boevaya-yarost')),
  'boets-improvizator': requirements('Seasoned', attribute('smarts', 'd6')),
  'volya-k-pobede': requirements('Seasoned'),
  'dva-klinka': requirements('Novice', attribute('agility', 'd8')),
  'dva-stvola': requirements('Novice', attribute('agility', 'd8')),
  'dvoynoy-vystrel': requirements('Seasoned', skill('shooting', 'd6')),
  'imennoe-oruzhie': requirements('Novice', text('Навык в данном оружии d8+')),
  'imennoe-oruzhie-plus': requirements('Seasoned', edge('imennoe-oruzhie')),
  kontrataka: requirements('Seasoned', skill('fighting', 'd8')),
  'kontrataka-plus': requirements('Veteran', edge('kontrataka')),
  'krepkiy-oreshek': requirements('Novice', attribute('spirit', 'd8')),
  'krepkiy-oreshek-plus': requirements('Veteran', edge('krepkiy-oreshek')),
  'krugovoy-udar': requirements('Novice', attribute('strength', 'd8'), skill('fighting', 'd8')),
  'krugovoy-udar-plus': requirements('Veteran', edge('krugovoy-udar')),
  'master-boevyh-iskusstv': requirements('Novice', skill('fighting', 'd6')),
  'master-boevyh-iskusstv-plus': requirements('Seasoned', edge('master-boevyh-iskusstv')),
  'metkiy-strelok': requirements('Seasoned', anyOf(skill('athletics', 'd8'), skill('shooting', 'd8'))),
  'moguchiy-udar': requirements('Novice', skill('fighting', 'd8'), wildCard()),
  parkur: requirements('Novice', attribute('agility', 'd8'), skill('athletics', 'd6')),
  'razryv-distantsii': requirements('Novice', attribute('agility', 'd8')),
  'razryv-distantsii-plus': requirements('Seasoned', edge('razryv-distantsii')),
  raschetlivost: requirements('Novice', attribute('smarts', 'd8')),
  'rok-n-roll': requirements('Seasoned', skill('shooting', 'd8')),
  'smertelnyy-vystrel': requirements('Novice', anyOf(skill('athletics', 'd8'), skill('shooting', 'd8')), wildCard()),
  'stalnaya-chelyust': requirements('Novice', attribute('vigor', 'd8')),
  'stalnye-nervy': requirements('Novice', attribute('vigor', 'd8')),
  'stalnye-nervy-plus': requirements('Novice', edge('stalnye-nervy')),
  'tverdaya-ruka': requirements('Novice', attribute('agility', 'd8')),
  tyazheloves: requirements('Novice', attribute('strength', 'd8'), attribute('vigor', 'd8')),
  'tyazheloves-plus': requirements('Seasoned', edge('tyazheloves')),
  'ubiytsa-velikanov': requirements('Veteran'),
  uvertlivost: requirements('Seasoned', attribute('agility', 'd8')),
  'uvertlivost-plus': requirements('Seasoned', edge('uvertlivost')),
  'uprezhdayuschiy-udar': requirements('Novice', attribute('agility', 'd8')),
  'uprezhdayuschiy-udar-plus': requirements('Heroic', edge('uprezhdayuschiy-udar')),
  fint: requirements('Novice', skill('fighting', 'd8')),
  hladnokrovie: requirements('Seasoned', attribute('smarts', 'd8')),
  'hladnokrovie-plus': requirements('Seasoned', edge('hladnokrovie')),

  // Leadership
  'boevoy-pyl': requirements('Veteran', attribute('spirit', 'd8'), edge('komandnyy-golos')),
  voodushevlenie: requirements('Seasoned', edge('komandnyy-golos')),
  'derzhat-stroy': requirements('Seasoned', attribute('smarts', 'd8'), edge('komandnyy-golos')),
  'komandnyy-golos': requirements('Novice', attribute('smarts', 'd6')),
  'komandnyy-golos-plus': requirements('Seasoned', edge('komandnyy-golos')),
  'prirozhdennyy-lider': requirements('Seasoned', attribute('spirit', 'd8'), edge('komandnyy-golos')),
  taktik: requirements('Seasoned', attribute('smarts', 'd8'), skill('warfare', 'd6'), edge('komandnyy-golos')),
  'taktik-plus': requirements('Veteran', edge('taktik')),

  // Weird
  'glotok-muzhestva': requirements('Novice', attribute('vigor', 'd8')),
  zapaslivost: requirements('Novice', edge('vezenie')),
  izbrannyy: requirements('Novice', attribute('spirit', 'd8'), skill('fighting', 'd6')),
  'svyaz-s-zhivotnymi': requirements('Novice'),
  ukrotitel: requirements('Novice', attribute('spirit', 'd8')),
  tselitel: requirements('Novice', attribute('spirit', 'd8')),
  tsi: requirements('Veteran', edge('master-boevyh-iskusstv-plus')),
  'shestoe-chuvstvo': requirements('Novice'),

  // Professional
  as: requirements('Novice', attribute('agility', 'd8')),
  akrobat: requirements('Novice', attribute('agility', 'd8'), skill('athletics', 'd8')),
  'akrobat-plus': requirements('Seasoned', edge('akrobat')),
  vor: requirements('Novice', attribute('agility', 'd8'), skill('stealth', 'd6'), skill('thievery', 'd6')),
  eger: requirements('Novice', attribute('spirit', 'd6'), skill('survival', 'd8')),
  'zolotye-ruki': requirements('Novice', skill('repair', 'd8')),
  'master-na-vse-ruki': requirements('Novice', attribute('smarts', 'd10')),
  soldat: requirements('Novice', attribute('strength', 'd6'), attribute('vigor', 'd6')),
  syschik: requirements('Novice', attribute('smarts', 'd8'), skill('research', 'd8')),
  ubiytsa: requirements('Novice', attribute('agility', 'd8'), skill('fighting', 'd6'), skill('stealth', 'd8')),
  umelets: requirements('Novice', attribute('smarts', 'd6'), skill('notice', 'd8'), skill('repair', 'd6')),
  uchenyy: requirements('Novice', skill('research', 'd8')),

  // Power
  artefaktor: requirements('Seasoned', edge('misticheskiy-dar', 'any')),
  'voin-sveta-tmy': requirements('Seasoned', skill('faith', 'd6'), edge('misticheskiy-dar', 'miracles')),
  'vosstanovlenie-sily': requirements('Seasoned', attribute('spirit', 'd6'), edge('misticheskiy-dar', 'any')),
  'vosstanovlenie-sily-plus': requirements('Veteran', edge('vosstanovlenie-sily')),
  'dopolnitelnoe-usilie': requirements('Seasoned', skill('talent', 'd6'), edge('misticheskiy-dar', 'gifted')),
  izobretatel: requirements('Seasoned', skill('weird-science', 'd6'), edge('misticheskiy-dar', 'weirdScience')),
  'issushenie-duha': requirements('Seasoned', text('Мистический навык d10+'), edge('misticheskiy-dar', 'any')),
  kontsentratsiya: requirements('Seasoned', edge('misticheskiy-dar', 'any')),
  mentalist: requirements('Seasoned', skill('psionics', 'd6'), edge('misticheskiy-dar', 'psionics')),
  'novye-sily': requirements('Novice', edge('misticheskiy-dar', 'any')),
  'priliv-sily': requirements('Novice', text('Мистический навык d8+'), edge('misticheskiy-dar', 'any'), wildCard()),
  'punkty-sily': requirements('Novice', edge('misticheskiy-dar', 'any')),
  'upravlenie-potokom': requirements('Seasoned', edge('misticheskiy-dar', 'any')),
  charodey: requirements('Seasoned', skill('spellcasting', 'd6'), edge('misticheskiy-dar', 'magic')),

  // Social
  vdohnovitel: requirements('Novice', attribute('spirit', 'd8')),
  'groznyy-vid': requirements(
    'Novice',
    anyOf(
      hindrance('zhazhda-krovi'),
      hindrance('durnoy-harakter'),
      hindrance('zhestokost-minor'),
      hindrance('zhestokost-major'),
      hindrance('urodstvo-minor'),
      hindrance('urodstvo-major'),
    ),
  ),
  'zheleznaya-volya': requirements('Novice', attribute('spirit', 'd8')),
  'zheleznaya-volya-plus': requirements('Seasoned', edge('zheleznaya-volya'), edge('smelost')),
  zavodila: requirements('Novice', attribute('spirit', 'd8')),
  'zavodila-plus': requirements('Seasoned', edge('zavodila')),
  'my-komanda': requirements('Novice', attribute('spirit', 'd8'), wildCard()),
  nadezhnyy: requirements('Novice', attribute('spirit', 'd8')),
  ostroslov: requirements('Novice', skill('taunt', 'd8')),
  'otvetnaya-kolkost': requirements('Novice', skill('taunt', 'd6')),
  'poleznye-svyazi': requirements('Novice'),
  provokatsiya: requirements('Novice', skill('taunt', 'd6')),
  smutyan: requirements('Seasoned', attribute('spirit', 'd8')),
  'ulichnoe-chute': requirements('Novice', attribute('smarts', 'd6')),

  // Wild Card
  'vernye-sputniki': requirements('Legendary', wildCard()),
  'iskusnyy-voin': requirements('Legendary', skill('fighting', 'd12')),
  'iskusnyy-voin-plus': requirements('Legendary', edge('iskusnyy-voin')),
  nesgibaemyy: requirements('Legendary', attribute('vigor', 'd8')),
  'nesgibaemyy-plus': requirements('Legendary', attribute('vigor', 'd12'), edge('nesgibaemyy')),
  pomoschnik: requirements('Legendary', wildCard()),
  professional: requirements('Legendary', text('Максимальная возможная кость в выбранном параметре')),
  'professional-plus': requirements('Legendary', text('Профессионал в выбранном параметре')),
  'professional-plus-plus': requirements('Legendary', text('Профессионал+ в выбранном параметре'), wildCard()),
}