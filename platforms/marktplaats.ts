import { Platform, Listing } from "./base";
import { Page } from "puppeteer";
import { navigateAndWait } from "./functions";

export class Marktplaats implements Platform {
  name = "marktplaats.nl";

  async scrapeSearchPage(
    page: Page,
    keyword: string,
    limit: number
  ): Promise<string[]> {
    console.log(`Scraping marktplaats search page for: ${keyword}`);

    // Navigate to the correct search page
    const searchUrl = `https://www.marktplaats.nl/q/${encodeURIComponent(keyword)}/`;
    await navigateAndWait(page, searchUrl);

    // Get all listing URLs from the search page
    const listingUrls = await page.$$eval('a.hz-Listing-coverLink', (elements) =>
      (elements as HTMLAnchorElement[]).map((element) => {
        const href = element.getAttribute('href');
        return href ? (href.startsWith('http') ? href : `https://www.marktplaats.nl${href}`) : null;
      }).filter((url): url is string => url !== null)
    );

    console.log(`Found ${listingUrls.length} listings, taking first ${Math.min(limit, listingUrls.length)}`);

    // Return the specified number of URLs
    return listingUrls.slice(0, Math.min(limit, listingUrls.length));
  }

  async scrapeItemPage(page: Page, url: string): Promise<Listing> {
    console.log(`Scraping marktplaats listing: ${url}`);
    await navigateAndWait(page, url);

    // Extract listing information using correct selectors for individual pages
    const listing = await page.evaluate(() => {
      const title = document.querySelector('.ListingHeader-title')?.textContent?.trim() || 'No title found';
      
      const priceText = document.querySelector('.ListingHeader-price')?.textContent?.trim() || 'No price found';

      // Extract numeric price (remove currency symbols and non-numeric characters)
      const price = parseFloat(priceText.replace(/[^\d.,]/g, '')) || 0;

      return {
        title,
        price
      };
    });

    return {
      title: listing.title,
      price: listing.price,
      url: url
    };
  }
}