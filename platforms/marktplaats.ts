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
    console.log(`Scraping marktplaats search page for: ${keyword} (need ${limit} URLs)`);

    const allUrls: string[] = [];
    let currentPage = 0;
    const maxPagesToTry = 20; // Safety limit to prevent infinite loops

    while (allUrls.length < limit && currentPage < maxPagesToTry) {
      // Navigate to the search page (page 1 is the first page, page 2 is /p/2/, etc.)
      const searchUrl = currentPage === 0
        ? `https://www.marktplaats.nl/q/${encodeURIComponent(keyword)}/`
        : `https://www.marktplaats.nl/q/${encodeURIComponent(keyword)}/p/${currentPage + 1}/`;

      console.log(`Loading page ${currentPage + 1} (${allUrls.length}/${limit} URLs collected so far)...`);
      await navigateAndWait(page, searchUrl, { selector: 'a.hz-Listing-coverLink' });

      // Get all listing URLs from the current search page
      const listingUrls = await page.$$eval('a.hz-Listing-coverLink', (elements) =>
        (elements as HTMLAnchorElement[]).map((element) => {
          const href = element.getAttribute('href');
          return href ? (href.startsWith('http') ? href : `https://www.marktplaats.nl${href}`) : null;
        }).filter((url): url is string => url !== null)
      );

      // If no listings found on this page, we've reached the end
      if (listingUrls.length === 0) {
        console.log(`No more listings found on page ${currentPage + 1}`);
        break;
      }

      console.log(`Found ${listingUrls.length} listing links on page ${currentPage + 1}`);

      // Deduplicate by listing ID (extract from URL path, ignore query parameters)
      const seenIds = new Set(allUrls.map(url => url.split('?')[0]));
      const newUrls = listingUrls.filter(url => {
        const urlWithoutQuery = url.split('?')[0];
        if (seenIds.has(urlWithoutQuery)) {
          return false;
        }
        seenIds.add(urlWithoutQuery);
        return true;
      });

      console.log(`Adding ${newUrls.length} new unique listings (${listingUrls.length - newUrls.length} were duplicates)`);
      allUrls.push(...newUrls);

      currentPage++;
    }

    console.log(`Total URLs collected: ${allUrls.length}, returning first ${Math.min(limit, allUrls.length)}`);

    // Return the specified number of URLs
    return allUrls.slice(0, limit);
  }

  async scrapeItemPage(page: Page, url: string): Promise<Listing> {
    console.log(`Scraping marktplaats listing: ${url}`);
    await navigateAndWait(page, url, { selector: '.ListingHeader-title' });

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