import puppeteer, { Page, Browser } from "puppeteer";

const launchBrowser = async (): Promise<Browser> => {
    return await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  };

const navigateAndWait = async (
  page: Page,
  url: string,
  selector: string,
): Promise<void> => {
    const timeout = 15000;
    const minElements = 30;

    await page.goto(url, {
      waitUntil: 'networkidle2', // Changed from networkidle2 to load faster
      timeout: timeout
    });

    // Scroll down multiple times to trigger lazy loading of content
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
    }

    // Wait for lazy-loaded listings to appear if selector is provided
    if (selector) {
      await page.waitForFunction(
        (sel: string, min: number) => document.querySelectorAll(sel).length >= min,
        { timeout: 5000, polling: 'raf' },
        selector,
        minElements
      ).catch(() => {
        // Timeout is fine, proceed with whatever listings we have
      });
    }
  };

export { launchBrowser, navigateAndWait };