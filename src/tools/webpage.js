const cycletls = require('cycletls').default
const openai = require('../llm/openai')
const cheerio = require('cheerio')

const getClient = async () => {
  return cycletls()
}

const config = {
  ja3: '772,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,45-0-17513-10-27-16-23-18-35-13-51-65281-43-5-11,29-23-24,0',
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7,zh-TW;q=0.6',
    'Dnt': '1',
    'Sec-Ch-Ua': `"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"`,
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': `"Windows"`,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
  }
}

module.exports = {
  id: "Web scraper",
  desc: "Scrape any website and get the data you want, you can use this after search to get more information",
  args: [{
    name: "url",
    desc: "the url to scrape",
    type: "STRING",
    required: true
  }, {
    name: "mode",
    desc: "text, link, image. you can use link mode to get next page link, image mode to get image url, text mode to get text content of your selected part",
    type: "STRING",
    required: true
  }, {
    name: "part",
    desc: "the part of the website to scrape, e.g. article list, post content etc.",
    type: "STRING",
    required: false
  }],
  run: async (args) => {
    const url = args.url;

    if (!url.startsWith('http')) {
      throw new Error('url must starts with http')
    }

    const partOfWebpage = args.part || "body";
    const client = await getClient()
    const res = await client.get(url, config)
    const body = res.body.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    const $ = cheerio.load(body)

    if (args.mode === 'text') {
      const bodyText = $('body').text().replace(/\s+/g, ' ').trim()

      if (!partOfWebpage) {
        return bodyText
      }

      try {
        const part = $(partOfWebpage).text().replace(/\s+/g, ' ').trim()
        if (part) {
          return part
        }
      } catch (error) { }

      try {
        const resp = await openai.createChatCompletion({
          messages: [{
            role: 'system',
            content: `you should get the ${partOfWebpage} from the user content`
          }, {
            role: 'user',
            content: bodyText
          }],
          model: 'gpt-3.5-turbo-16k'
        })

        return resp.data.choices[0].message.content
      } catch (error) {
        throw new Error(error.message)
      }
    } else if (args.mode === 'link') {
      const links = $('a').map((i, el) => {
        return `${$(el).text()} - ${$(el).attr('href')}`
      }).get()

      return links.join('\n')
    } else if (args.mode === 'image') {
      const images = $('img').map((i, el) => {
        const alt = $(el).attr('alt') || ''
        const src = $(el).attr('src') || ''
        return `${alt} - ${src}`
      }).get()

      return images.join('\n')
    }
  }
}
