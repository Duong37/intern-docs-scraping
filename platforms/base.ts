import { Page } from "puppeteer";
import { Marktplaats } from "./marktplaats";
import { Mediamarkt } from "./mediamarkt";
import { Asos } from "./asos";
import { Bol } from "./bol";

export interface Listing {
  title: string;
  price: number;
  url: string;
}

export interface ScrapingResult {
  totalListings: number;
  listings: Listing[];
  errors: string[];
}

export interface Platform {
  name: string;

  scrapeSearchPage(
    page: Page,
    keyword: string,
    limit: number
  ): Promise<string[]>;

  scrapeItemPage(page: Page, url: string): Promise<Listing>;
}

export class PlatformFactory {
  private static platforms: Map<string, () => Platform> = new Map([
    ["marktplaats", () => new Marktplaats()],
    ["mediamarkt", () => new Mediamarkt()],
    ["asos", () => new Asos()],
    ["bol", () => new Bol()],
  ]);

  static getPlatform(platformName: string): Platform {
    const platformFactory = this.platforms.get(platformName.toLowerCase());
    if (!platformFactory) {
      throw new Error(`Platform "${platformName}" not supported. Available platforms: ${Array.from(this.platforms.keys()).join(", ")}`);
    }
    return platformFactory();
  }

  static getSupportedPlatforms(): string[] {
    return Array.from(this.platforms.keys());
  }
}


