const puppeteer = require('puppeteer');

// Array med adresser du vill hämta visningar från
const urls = [
    'https://www.tradera.com/item/3011/648568125/grim-fandango-pc-big-box-endast-box-och-manual-',
    'https://www.tradera.com/item/308373/648568890/escape-from-monkey-island-pc-big-box',
    'https://www.tradera.com/item/308373/648568347/the-curse-of-monkey-island-pc-big-box-official-strategy-guide'
];

(async () => {
    const browser = await puppeteer.launch({ headless: true });

    // Mappar alla URL:er till Promises som körs parallellt
    const scrapePromises = urls.map(async (url) => {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Hämta sidtitel
        const title = await page.title();

        // Hämta visningsantalet
        const views = await page.evaluate(() => {
            const elements = document.querySelectorAll('.text_reset__qhVLr.text_wrapper__g8400.size-oslo.text-gray-600');
            for (let element of elements) {
                if (element.innerText.includes("Visningar")) { 
                    return element.innerText;
                }
            }
            return 'Views not found';
        });

        await page.close();
        return { title, views }; // Returnerar objekt med titel och visningar
    });

    const results = await Promise.all(scrapePromises); // Väntar på alla anrop

    results.forEach(result => {
        console.log(`Titel: ${result.title} - Antal visningar: ${result.views}`);
    });

    await browser.close(); // Stänger browser-instansen när alla är färdiga
})();
