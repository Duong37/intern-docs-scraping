import { Platform, Listing } from "./base";
import { Page } from "puppeteer";
import { navigateAndWait } from "./functions";

export class Asos implements Platform {
  name = "asos.com";

  async scrapeSearchPage(page: Page, keyword: string, limit: number): Promise<string[]> {
    console.log(`Scraping asos.com search page for: ${keyword}`);

    let allProductUrls: string[] = [];
    let currentPage = 1;

    // Loop through pages until we have enough products
    while (allProductUrls.length < limit) {
      const searchUrl = `https://www.asos.com/search/?q=${encodeURIComponent(keyword)}&page=${currentPage}`;
      await navigateAndWait(page, searchUrl, 'a.productLink_KM4PI');

      // Get all product URLs from the current page
      const productUrls = await page.$$eval('a.productLink_KM4PI', (elements) =>
        (elements as HTMLAnchorElement[]).map((element) => {
          const href = element.getAttribute('href');
          return href ? (href.startsWith('http') ? href : `https://www.asos.com${href}`) : null;
        }).filter((url): url is string => url !== null)
      );

      // If no products found, we've reached the end
      if (productUrls.length === 0) {
        console.log(`No more products found on page ${currentPage}`);
        break;
      }

      allProductUrls.push(...productUrls);
      console.log(`Page ${currentPage}: Found ${productUrls.length} products (Total: ${allProductUrls.length})`);

      // If we have enough products, stop
      if (allProductUrls.length >= limit) {
        break;
      }

      currentPage++;
    }

    console.log(`Found ${allProductUrls.length} total products, returning first ${limit}`);
    return allProductUrls.slice(0, limit);
  }

  async scrapeItemPage(page: Page, url: string): Promise<Listing> {
    console.log(`Scraping asos.com listing: ${url}`);
    await navigateAndWait(page, url, { selector: 'h1' });

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