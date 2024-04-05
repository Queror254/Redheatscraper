// @ts-nocheck
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
const puppeteer = require('puppeteer');
//const autoScroll = require('puppeteer-autoscroll-down');

export default class ScraperController {

  public async index({ request, response }: HttpContextContract) {
    const { subreddit } = request.only(['subreddit']);
    try {
      // Launch the browser and open a new blank page
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();

      // Retry navigation up to 3 times
      let retryCount = 0;
      let success = false;
      while (!success && retryCount < 3) {
        try {
          // Navigate the page to a URL: https://www.reddit.com/r/forhire/new/
          await page.goto('https://www.reddit.com/r/forhire/new/', { timeout: 240000 });
          success = true;
        } catch (navigationError) {
          console.error('Navigation error:', navigationError);
          retryCount++;
        }
      }

      if (!success) {
        throw new Error('Failed to navigate to the page after multiple attempts');
      }

      // Dynamically import puppeteer-autoscroll-down
      //const autoScroll = await import('puppeteer-autoscroll-down');

      // Scrolling down the page
      //await autoScroll.default(page);

      // Extracting articles
      const articles = await page.$$eval('article', (elements) => {
        return elements.map((element) => {
          const title = element.querySelector('a[slot="title"]')?.textContent.trim() || ''
          const content = element.querySelector('#t3_1bu1ftc-post-rtjson-content')?.textContent.trim() || ''
          const author = element.querySelector('span[slot="authorName"]')?.textContent.trim() || ''
          const postLink = element.querySelector('a[slot="full-post-link"]')?.getAttribute('href') || ''

          return { title, content, author, postLink }
        })
      })

      await browser.close();
      return response.json({ articles })
    } catch (error) {
      console.error('Error scraping:', error)
      return response.status(500).json({ error: 'Failed to scrape articles' })
    }
  }

}
