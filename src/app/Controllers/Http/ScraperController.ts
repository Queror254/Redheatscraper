// @ts-nocheck
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
const puppeteer = require('puppeteer');
const subreddit_url = (reddit) => `https://old.reddit.com/r/${reddit}/new/`
//const autoScroll = require('puppeteer-autoscroll-down');

export default class ScraperController {

  public async index({ request, response, view }: HttpContextContract) {
    const { subreddit } = request.only(['subreddit']);
    //const subreddit:string = 'hiring';

    try {
      // Launch the browser and open a new blank page
      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();
      await page.goto(subreddit_url(subreddit), { waitUntil: 'networkidle0', timeout: 60000 });

      try {
        let elements = await page.$$('#siteTable > div.thing'); 
        let results = [];

        await page.waitForSelector('#siteTable > div.thing')
        await page.waitForSelector('.tagline > time');
        await page.waitForSelector('.tagline > a');
        await page.waitForSelector('.score.likes');
        await page.waitForSelector('a[data-event-action="comments"]');


        for (let element of elements) {
          let title = await element.$eval(('p.title'), node => node.innerText.trim());
          //let postTime = await element.$eval(('.tagline > time'), node => node.getAttribute('title'));
         // let authorName = await element.$eval(('.tagline > a'), node => node.getAttribute('href'));
          let authorUrl = await element.$eval(('.tagline > a'), node => node.innerText.trim());
          authorUrl = 'https://www.reddit.com/user/' + authorUrl
          let upvotes = await element.$eval(('div.score.likes'), node => node.innerText.trim());
         // let comments = await element.$eval(('a[data-event-action="comments"]'), node => node.innerText.trim());

          results.push({
            title, 
           // postTime, 
           // authorName, 
            authorUrl, 
            upvotes,
          //  comments
          });
        }

        await browser.close()
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
