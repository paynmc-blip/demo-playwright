export interface Product {
  readonly name: string;
  readonly price: string;
}

export const BACKPACK: Product = {
  name: 'Sauce Labs Backpack',
  price: '$29.99',
};

export const BIKE_LIGHT: Product = {
  name: 'Sauce Labs Bike Light',
  price: '$9.99',
};

export const BOLT_T_SHIRT: Product = {
  name: 'Sauce Labs Bolt T-Shirt',
  price: '$15.99',
};

export const FLEECE_JACKET: Product = {
  name: 'Sauce Labs Fleece Jacket',
  price: '$49.99',
};

export const ONESIE: Product = {
  name: 'Sauce Labs Onesie',
  price: '$7.99',
};

export const RED_T_SHIRT: Product = {
  name: 'Test.allTheThings() T-Shirt (Red)',
  price: '$15.99',
};

/** The whole catalogue, in the order the inventory lists it by default (Name A-Z). */
export const ALL_PRODUCTS: readonly Product[] = [
  BACKPACK,
  BIKE_LIGHT,
  BOLT_T_SHIRT,
  FLEECE_JACKET,
  ONESIE,
  RED_T_SHIRT,
];
