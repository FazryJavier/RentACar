/** Static credits for /kredit; 3D model credits come from /public/credits. */
export type StaticCredit = { name: string; use: string; license: string; url: string };

export const STATIC_CREDITS: StaticCredit[] = [
  {
    name: "Lucide",
    use: "Ikon",
    license: "ISC",
    url: "https://lucide.dev/license",
  },
  {
    name: "Plus Jakarta Sans",
    use: "Huruf",
    license: "SIL Open Font License 1.1",
    url: "https://fonts.google.com/specimen/Plus+Jakarta+Sans/license",
  },
  {
    name: "OpenStreetMap",
    use: "Peta dan ubin peta",
    license: "ODbL (data), CC BY-SA 2.0 (ubin)",
    url: "https://www.openstreetmap.org/copyright",
  },
];

/** Car photo sources. Empty until demo photos with their own licences are added. */
export const PHOTO_CREDITS: StaticCredit[] = [];
