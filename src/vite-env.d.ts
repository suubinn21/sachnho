/// <reference types="vite/client" />

declare module 'virtual:books-catalog' {
  import type { BookMeta } from './data/types';
  export const booksCatalog: BookMeta[];
}
