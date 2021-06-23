import { writeFileSync } from 'fs'
import puppeteer from 'puppeteer-core'
import { websites } from './websites.js'


const browser = await puppeteer.launch({
        product: 'chrome',
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
      }),
      page = (await browser.pages())[0],
      withStats = [
        // I collected stats manually from a few authenticated pages
        {
          name: 'Netlify site settings page',
          primaryClassType: 'utility',
          category: 'application',
          url: 'https://app.netlify.com/sites/css-selector-builder/settings/general',
          stats: {
            "maxLength": 32,
            "maxCharacters": 553,
            "averageLength": 2.35,
            "averageCharacters": 35.4
          }
        },
        {
          name: 'GitHub account settings page',
          primaryClassType: 'semantic',
          category: 'application',
          url: 'https://github.com/settings/profile',
          stats: {
            "maxLength": 15,
            "maxCharacters": 195,
            "averageLength": 1.4,
            "averageCharacters": 17.87
          }
        },
        {
          name: 'Stripe dashboard',
          primaryClassType: 'utility',
          category: 'application',
          url: 'https://dashboard.stripe.com/dashboard',
          stats: {
            "maxLength": 15,
            "maxCharacters": 407,
            "averageLength": 2.87,
            "averageCharacters": 51.02
          }
        },
      ]

for (const website of websites) {
  await page.goto(website.url)

  const stats = await page.evaluate(() => {
    function toClassListStats (arrayOfElements) {
      // Map each element to the number of classes in its class list, and 
      // the number of characters in its class list
      const classListLengths = arrayOfElements.map(el => ({
        length: el.classList.length,
        characters: [...el.classList].join(' ').length,
      }))
      
      // Sum all class list lengths and characters
      const total = classListLengths.reduce((total, { length, characters }) => ({
        length: total.length + length,
        characters: total.characters + characters
      }), { length: 0, characters: 0 })
      
      // Stats 🔥🔥🔥
      return {
        maxLength: Math.max(...classListLengths.map(({ length }) => length)),
        maxCharacters: Math.max(...classListLengths.map(({ characters }) => characters)),
        
        averageLength: Math.round(total.length / classListLengths.length * 100) / 100,
        averageCharacters: Math.round(total.characters / classListLengths.length * 100) / 100,
      }
    }

    return toClassListStats([...document.querySelectorAll('*')])
  })

  withStats.push({ ...website, stats })
}

await browser.close()

// Sort by average characters descending
withStats.sort(({ stats: { averageCharacters: a } }, { stats: { averageCharacters: b } }) => b - a)

const tableColumns = ['Website', 'Category', 'Primary class type', ...Object.keys(withStats[0].stats)]
const markdownTable = withStats.reduce(
  (table, website) => `${table}\n| [${website.name}](${website.url}) | ${website.category} | ${website.primaryClassType} | ${Object.values(website.stats).join(' | ')} |`,
  `| ${tableColumns.join(' | ')} |\n| ${tableColumns.map(() => '---').join(' | ')} |`
)

writeFileSync('./withStats.json', JSON.stringify(withStats, null, 2), 'utf8')
writeFileSync('./withStats.md', markdownTable, 'utf8')
