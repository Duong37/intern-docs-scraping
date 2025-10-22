import { Platform, Listing } from "./base";
import { Page } from "puppeteer";
import { navigateAndWait } from "./functions";

export class Asos implements Platform {
  name = "asos.com";

  async scrapeSearchPage(page: Page, keyword: string, limit: number): Promise<string[]> {
    console.log(`Scraping asos.com search page for: ${keyword}`);

    // Navigate to ASOS search page
    const searchUrl = `https://www.asos.com/search/?q=${encodeURIComponent(keyword)}`;
    await navigateAndWait(page, searchUrl);

    // Get all product URLs from the search page
    const productUrls = await page.$$eval('a.productLink_KM4PI', (elements) =>
      (elements as HTMLAnchorElement[]).map((element) => {
        const href = element.getAttribute('href');
        return href ? (href.startsWith('http') ? href : `https://www.asos.com${href}`) : null;
      }).filter((url): url is string => url !== null)
    );

    console.log(`Found ${productUrls.length} products`);
    return productUrls.slice(0, Math.min(limit, productUrls.length));
  }

  async scrapeItemPage(page: Page, url: string): Promise<Listing> {
    console.log(`Scraping asos.com listing: ${url}`);
    await navigateAndWait(page, url);

    // Extract listing information using correct selectors
    const listingInfo = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim() || 'No title found';

      const priceElement = document.querySelector('[data-testid="current-price"]');
      const priceText = priceElement?.textContent?.trim() || '0';

      // Extract numeric price - remove only the characters that break parseFloat
      const price = parseFloat(priceText.replace(/[^\d.,]/g, '')) || 0;

      return {
        title,
        price
      };
    });

    return {
      title: listingInfo.title,
      price: listingInfo.price,
      url: url
    };
  }
}