import type { Mount } from '@/types/handbook'

export const SWADE_MOUNTS: readonly Mount[] = [
  // Animals
  {
    id: 'horse',
    name: 'Horse',
    category: 'animal',
    toughness: 8,
    pace: 12,
    cost: 600,
    description: 'A standard riding horse. Reliable for travel and light combat.',
  },
  {
    id: 'war-horse',
    name: 'War Horse',
    category: 'animal',
    toughness: 10,
    pace: 10,
    cost: 1200,
    description:
      'A large, trained combat steed. Brave in battle and capable of trampling enemies.',
  },
  {
    id: 'mule',
    name: 'Mule',
    category: 'animal',
    toughness: 6,
    pace: 8,
    cost: 150,
    description:
      'A stubborn but reliable pack animal able to carry heavy loads over difficult terrain.',
  },
  {
    id: 'draft-horse',
    name: 'Draft Horse',
    category: 'animal',
    toughness: 10,
    pace: 8,
    cost: 400,
    description: 'A heavy horse bred for pulling wagons and heavy loads rather than riding.',
  },
  // Vehicles
  {
    id: 'cart',
    name: 'Cart',
    category: 'vehicle',
    toughness: 10,
    handling: -1,
    cost: 200,
    description: 'A simple two-wheeled vehicle pulled by one animal, carrying up to 1,000 lb.',
  },
  {
    id: 'wagon',
    name: 'Wagon',
    category: 'vehicle',
    toughness: 12,
    handling: -2,
    cost: 600,
    description:
      'A covered four-wheeled transport pulled by two animals. Carries passengers and cargo up to 3,000 lb.',
  },
]
