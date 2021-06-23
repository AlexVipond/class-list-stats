import { writeFileSync } from 'fs'
import puppeteer from 'puppeteer-core'
import { websites } from './websites.js'


const browser = await puppeteer.launch({
        product: 'chrome',
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        headless: true,
      }),
      page = (await browser.pages())[0]

const withStats = []
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
        totalLength: total.length,
        totalCharacters: total.characters,
    
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


