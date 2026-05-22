import type { Gear } from '@/types/handbook'

export const SWADE_GEAR: readonly Gear[] = [
  // Adventuring
  {
    id: 'backpack',
    name: 'Backpack',
    category: 'Adventuring',
    weight: 3,
    cost: 50,
    description: 'A sturdy canvas or leather pack that holds up to 40 lb. of gear.',
  },
  {
    id: 'rope-50ft',
    name: "Rope (50')",
    category: 'Adventuring',
    weight: 15,
    cost: 10,
    description: "50 feet of hemp rope. Supports up to 1,000 lb.",
  },
  {
    id: 'torch',
    name: 'Torch',
    category: 'Adventuring',
    weight: 1,
    cost: 1,
    description:
      'A primitive light source that illuminates a Medium Burst Template and burns for one hour.',
  },
  {
    id: 'lantern',
    name: 'Lantern',
    category: 'Adventuring',
    weight: 3,
    cost: 100,
    description:
      'An oil lantern that illuminates a Large Burst Template. Burns for eight hours on a full flask of oil.',
  },
  {
    id: 'bedroll',
    name: 'Bedroll',
    category: 'Adventuring',
    weight: 7,
    cost: 20,
    description: 'Blankets and padding for sleeping outdoors. Prevents Fatigue from cold nights.',
  },
  {
    id: 'first-aid-kit',
    name: 'First Aid Kit',
    category: 'Adventuring',
    weight: 1,
    cost: 100,
    description:
      'Bandages, antiseptic, and basic medical supplies. Grants +1 to Healing rolls and holds enough material for 10 uses.',
  },
  // Food
  {
    id: 'rations-1-day',
    name: 'Rations (1 Day)',
    category: 'Food',
    weight: 1,
    cost: 5,
    description: 'One day of trail food — dried meat, hardtack, and preserved staples.',
  },
  {
    id: 'waterskin',
    name: 'Waterskin',
    category: 'Food',
    weight: 1,
    cost: 5,
    description: 'Holds one gallon of liquid. A full waterskin weighs 9 lb.',
  },
  // Tools
  {
    id: 'grappling-hook',
    name: 'Grappling Hook',
    category: 'Tools',
    weight: 4,
    cost: 100,
    description:
      'A metal hook that can be thrown to catch on ledges, branches, or railings, enabling climbing.',
  },
  {
    id: 'lockpicks',
    name: 'Lockpicks',
    category: 'Tools',
    weight: 1,
    cost: 200,
    description: 'A set of thieves\' picks and tension wrenches. Grants +1 to Thievery rolls to open locks.',
  },
]
