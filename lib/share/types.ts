export type ShareListing = {
  url: string;
  title: string;
  description: string;
  image: string;
  price?: string;
};

export type SharePlatform =
  | "whatsapp"
  | "facebook"
  | "twitter"
  | "telegram"
  | "linkedin"
  | "email"
  | "native"
  | "copy";
