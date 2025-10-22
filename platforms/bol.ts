import { Platform, Listing } from "./base";
import { Page } from "puppeteer";
import { navigateAndWait } from "./functions";

export class Bol implements Platform {
  name = "bol.com";

  async scrapeSearchPage(page: Page, keyword: string, limit: number): Promise<string[]> {
    console.log(`Scraping bol.com search page for: ${keyword}`);

    // Navigate to bol.com search page
    const searchUrl = `https://www.bol.com/nl/nl/s/?searchtext=${encodeURIComponent(keyword)}`;
    await navigateAndWait(page, searchUrl);

    // Wait for search results to load
    await page.waitForSelector('a.w-full[data-bltgh]', { timeout: 10000 });

    // Get all product URLs from the search page
    const productUrls = await page.$$eval('a.w-full[data-bltgh]', (elements) =>
      (elements as HTMLAnchorElement[]).map((element) => {
        const href = element.getAttribute('href');
        return href ? (href.startsWith('http') ? href : `https://www.bol.com${href}`) : null;
      }).filter((url): url is string => url !== null)
    );

    console.log(`Found ${productUrls.length} products, taking first ${Math.min(limit, productUrls.length)}`);
    return productUrls.slice(0, Math.min(limit, productUrls.length));
  }

  async scrapeItemPage(page: Page, url: string): Promise<Listing> {
    console.log(`Scraping bol.com listing: ${url}`);
    await navigateAndWait(page, url);

    // Extract listing information using correct selectors
    const listingInfo = await page.evaluate(() => {
      const titleElement = document.querySelector('span[data-test="title"]');
      const title = titleElement?.textContent?.trim() || 'No title found';

      const priceElement = document.querySelector('span[data-test="price"]');
      const priceText = priceElement?.textContent?.trim() || '0';

      // Extract numeric price (remove currency symbols and non-numeric characters)
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