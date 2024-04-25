// @ts-nocheck
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
const puppeteer = require('puppeteer');
const subreddit_url = (reddit) => `https://old.reddit.com/r/${reddit}/`
//const autoScroll = require('puppeteer-autoscroll-down');

export default class ScraperController {

  public async index({ request, response, view }: HttpContextContract) {
    const { subreddit } = request.only(['subreddit']);
    //const subreddit:string = 'hiring';

    try {
      // Launch the browser and open a new blank page
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      await page.goto(subreddit_url(subreddit), { waitUntil: 'networkidle0', timeout: 240000 });

      try {
        let elements = await page.$$('#siteTable > div.thing'); 
        let results = [];

        for (let element of elements) {
          let title = await element.$eval(('p[class="title"]'), node => node.innerText.trim());
          let postTime = await element.$eval(('p[class="tagline "] > time'), node => node.getAttribute('title'));
          let authorName = await element.$eval(('p[class="tagline "] > a[class="author"]'), node => node.getAttribute('href'));
          let authorUrl = await element.$eval(('p[class="tagline "] > a[class="author"]'), node => node.innerText.trim());
          let upvotes = await element.$eval(('div.score.likes'), node => node.innerText.trim());
          let comments = await element.$eval(('a[data-event-action="comments"]'), node => node.innerText.trim());

          results.push({
            title, 
            postTime, 
            authorName, 
            authorUrl, 
            upvotes,
            comments
          });
        }

        // Returning the results array
        return view.render('home', {results});

      } catch(error) {
        console.log('Error While retrieving content(Level Two)', error);
      }

      await browser.close()
      
    } catch (error) {
      console.log('Error while scraping(Top Level)', error);
    }

}
}
