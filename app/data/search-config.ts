import { restaurant } from "./restaurant";

// Enable only when the reviewed website is launched publicly on this domain.
// Changing this flag does not change the private Sites audience or connect Wix.
export const searchConfig = {
  canonicalOrigin: new URL(restaurant.source).origin,
  publicLaunch: false,
};

// The forms remain previews until a real restaurant receiving system is connected.
export const publicSearchPaths = ["/", "/menu"] as const;
