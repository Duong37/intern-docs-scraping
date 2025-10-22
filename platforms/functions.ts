import puppeteer, { Page, Browser } from "puppeteer";

const launchBrowser = async (): Promise<Browser> => {
    return await puppeteer.launch({
      headless: false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  };

const navigateAndWait = async (page: Page, url: string, timeout: number = 15000): Promise<void> => {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: timeout
    });
  };

export { launchBrowser, navigateAndWait };