/** The four orderings the inventory dropdown offers, by their visible label. */
export const SORT_OPTIONS = {
  nameAscending: 'Name (A to Z)',
  nameDescending: 'Name (Z to A)',
  priceAscending: 'Price (low to high)',
  priceDescending: 'Price (high to low)',
} as const;

export type SortOption = (typeof SORT_OPTIONS)[keyof typeof SORT_OPTIONS];

/** Every ordering, for scenarios that must hold true whichever one is applied. */
export const ALL_SORT_OPTIONS: readonly SortOption[] = Object.values(SORT_OPTIONS);
