// @ts-nocheck 
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
const puppeteer = require('puppeteer');
const subreddit_url = (reddit) => `https://old.reddit.com/r/${reddit}/new/`;

export default class ScraperController {
  public async index({ request, response, view }: HttpContextContract) {
    const { subreddit, num } = request.only(['subreddit', 'num']);

    try {
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(subreddit_url(subreddit), { waitUntil: 'networkidle2', timeout: 60000 });

      let results = [];

      const scrapePosts = async (count) => {
        let postCount = 0;

        while (postCount < count) {
          await page.waitForSelector('#siteTable > div.thing', { timeout: 60000 });
          let elements = await page.$$('#siteTable > div.thing');
          
          if (elements.length === 0) break; // No posts found, exit loop

          for (let element of elements) {
            if (postCount >= count) break; // Stop if the number of processed posts reaches the limit

            try {
              // Fetch the post title
              let title = await element.$eval('p.title', node => node.innerText.trim());

              // Fetch and check the post's flair
              let statusElement = await element.$('span.linkflairlabel');
              let status = statusElement
                ? await statusElement.evaluate(node => node.innerText.trim())
                : '';
              let domainElement = await element.$('span.domain');
              let domain = domainElement
                ? await domainElement.evaluate(node => node.innerText.trim())
                : '';
              
              // Ensure we have a non-empty value for status or domain
              let relevant = status.toLowerCase().includes('hiring') || domain.toLowerCase().includes('hiring');
              if (relevant) {
                let authorUrl = await element.$eval('.tagline > a', node => 'https://www.reddit.com/user/' + node.innerText.trim());
                let upvotes = await element.$eval('div.score.likes', node => node.innerText.trim() || '0');

                // Push the post details into the results array
                results.push({
                  title,
                  status: status || 'N/A',  // Default value if status is not found
                  domain: domain || 'N/A',  // Default value if domain is not found
                  authorUrl,
                  upvotes,
                });

                postCount++;
              }
            } catch (elementError) {
              console.log('Error retrieving content for one post:', elementError);
            }
          }

          if (postCount < count) {
            // Click the "Next" button to go to the next page
            let nextButton = await page.$('.nav-buttons .next-button a');
            if (nextButton) {
              await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2' }),
                nextButton.click(),
              ]);
            } else {
              break; // No more pages to navigate
            }
          }
        }
      };

      await scrapePosts(num);

      await browser.close();

      // Returning the results array
      return view.render('home', { results });

    } catch (error) {
      console.log('Error while scraping', error);
    }
  }
}
