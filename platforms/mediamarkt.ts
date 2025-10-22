import { Platform, Listing } from "./base";
import { Page } from "puppeteer";
import { navigateAndWait } from "./functions";

export class Mediamarkt implements Platform {
  name = "mediamarkt.nl";

  async scrapeSearchPage(page: Page, keyword: string, limit: number): Promise<string[]> {
    console.log(`Scraping mediamarkt search page for: ${keyword}`);

    // Navigate to Mediamarkt search page
    const searchUrl = `https://www.mediamarkt.nl/nl/search.html?query=${encodeURIComponent(keyword)}`;
    await navigateAndWait(page, searchUrl);

    // Wait for search results to load
    await page.waitForSelector('a[data-test="mms-router-link-product-image-wrapper"]', { timeout: 10000 });

    // Get all product URLs from the search page
    const productUrls = await page.$$eval('a[data-test="mms-router-link-product-image-wrapper"]', (elements) =>
      (elements as HTMLAnchorElement[]).map((element) => {
        const href = element.getAttribute('href');
        return href ? (href.startsWith('http') ? href : `https://www.mediamarkt.nl${href}`) : null;
      }).filter((url): url is string => url !== null)
    );

    console.log(`Found ${productUrls.length} products, taking first ${Math.min(limit, productUrls.length)}`);
    return productUrls.slice(0, Math.min(limit, productUrls.length));
  }

  async scrapeItemPage(page: Page, url: string): Promise<Listing> {
    console.log(`Scraping mediamarkt listing: ${url}`);
    await navigateAndWait(page, url);

    // Extract listing information using correct selectors
    const listingInfo = await page.evaluate(() => {
      const title = document.querySelector('h1')?.textContent?.trim() || 'No title found';

      const priceElement = document.querySelector('span.sc-94eb08bc-0');

      const priceText = priceElement?.textContent?.trim() || 'No price found';

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