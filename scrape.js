const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser'); // Lägg till bodyParser för att hantera POST-data
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json()); // Middleware för att läsa JSON-data

// Initiala auktioner
let urls = [
    'https://www.tradera.com/item/3011/648568125/grim-fandango-pc-big-box-endast-box-och-manual-',
    'https://www.tradera.com/item/308373/648568890/escape-from-monkey-island-pc-big-box',
    'https://www.tradera.com/item/308373/648568347/the-curse-of-monkey-island-pc-big-box-official-strategy-guide'
];

async function scrapeViews() {
    const browser = await puppeteer.launch({ headless: true });
    try {
        const scrapePromises = urls.map(async (url) => {
            const page = await browser.newPage();
            await page.goto(url, { waitUntil: 'networkidle2' });

            const title = await page.title();

            const views = await page.evaluate(() => {
                const elements = document.querySelectorAll('.text_reset__qhVLr.text_wrapper__g8400.size-oslo.text-gray-600');
                for (let element of elements) {
                    if (element.innerText.includes("Visningar")) { 
                        return element.innerText;
                    }
                }
                return 'Views not found';
            });

            const currentBid = await page.evaluate(() => {
                const bidElement = document.querySelector('.d-inline-block.animate-on-value-change_animate-on-value-change__MC2OO');
                return bidElement ? bidElement.innerText : 'No bids';
            });

            await page.close();
            return { title, views, currentBid, url }; // Lägg till URL här
        });

        const results = await Promise.all(scrapePromises);
        await browser.close();
        return results;
    } catch (error) {
        console.error('Error in scrapeViews function:', error);
        await browser.close();
        return [];
    }
}


// GET Endpoint för att hämta auktioner
app.get('/api/views', async (req, res) => {
    try {
        const data = await scrapeViews();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve data' });
    }
});

// POST Endpoint för att lägga till en ny auktions-URL
app.post('/api/add-auction', (req, res) => {
    const { url } = req.body;
    if (url && !urls.includes(url)) {
        urls.push(url);
        res.status(200).json({ message: 'Auction URL added successfully' });
    } else {
        res.status(400).json({ error: 'Invalid URL or URL already exists' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
