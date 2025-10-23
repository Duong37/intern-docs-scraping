import { PlatformFactory, Listing, ScrapingResult } from "./platforms/base";
import { launchBrowser } from "./platforms/functions";
import { writeFileSync } from "fs";

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  // Step 1: Check if the correct number of arguments are provided
  if (args.length < 3) {
    console.log("Usage: yarn start <platform> <search-term> <limit>");
    console.log("Example: yarn start marktplaats tshirt 20");
    console.log(`Available platforms: ${PlatformFactory.getSupportedPlatforms().join(", ")}`); // print available platforms
    process.exit(1);
  }

  const platformName = args[0];
  const searchTerm = args[1];
  const limit = parseInt(args[2]);

  if (isNaN(limit) || limit <= 0) {
    console.log("Limit must be a positive number");
    process.exit(1);
  }

  console.log(`Searching for "${searchTerm}" with limit ${limit} on ${platformName}`);

  try {
    // Step 2: Get platform instance without switch/if-else
    const platform = PlatformFactory.getPlatform(platformName);
    console.log(`Successfully created platform instance: ${platform.name}`);

    const browser = await launchBrowser();
    const page = await browser.newPage();

    // Step 3: Collect URLs supporting up to 100 URLs
    console.log(`Collecting URLs from ${platform.name}...`);
    const urls = await platform.scrapeSearchPage(page, searchTerm, limit);
    console.log(`Found ${urls.length} URLs (requested: ${limit})`);

    if (urls.length === 0) {
      console.log("No URLs found to scrape");
      await browser.close();
      process.exit(0);
    }

    // Step 4: Scrape individual listing pages
    console.log("Scraping individual listing pages...");
    const listings: Listing[] = [];
    const errors: string[] = [];

    for (let i = 0; i < urls.length; i++) {
      try {
        console.log(`Scraping listing ${i + 1}/${urls.length}: ${urls[i]}`);
        const listing = await platform.scrapeItemPage(page, urls[i]);
        listings.push(listing);
        console.log(`${listing.title} - €${listing.price}`);
      } catch (error) {
        const errorMsg = `Failed to scrape ${urls[i]}: ${error instanceof Error ? error.message : error}`;
        console.error(`${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    await browser.close();

    // Step 5: Create and save results
    const result: ScrapingResult = {
      totalListings: listings.length,
      listings,
      errors
    };

    // Write results to result.json
    writeFileSync("result.json", JSON.stringify(result, null, 2));
    console.log(`Results saved to result.json`);
    console.log(`Successfully scraped ${listings.length} listings with ${errors.length} errors`);

  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main().catch(console.error);
