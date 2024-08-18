const axios = require('axios');
const cheerio = require('cheerio');
const express = require('express');

const app = express();
const port = 3000;

const BASE_URL = 'https://webscraper.io/test-sites/e-commerce/static/computers/laptops';

//Get the pagination last page number
const getLastPageNumber = async () => {
    try {
        const { data } = await axios.get(BASE_URL);
        const $ = cheerio.load(data);

        const paginationLinks = $('.pagination li');
        const lastPageNumber = parseInt(paginationLinks.eq(paginationLinks.length - 2).text().trim(), 10);

        return isNaN(lastPageNumber) ? 1 : lastPageNumber;
    } catch (error) {
        console.error('Error getting last page number:', error);
        return 1;
    }
};

// Get the lenovo pc from wich page
const scrapeLenovoLaptopsFromPage = async (pageNumber) => {
    try {
        const { data } = await axios.get(`${BASE_URL}?page=${pageNumber}`);
        const $ = cheerio.load(data);

        const laptops = [];

        $('.product-wrapper').each((index, element) => {
            const title = $(element).find('.title').text();
            if (title.includes('ThinkPad') || title.includes('Lenovo')) {
                const price = $(element).find('.price').text();
                const description = $(element).find('.description').text();
                const imageUrl = $(element).find('img').attr('src');

                laptops.push({
                    title,
                    price,
                    description,
                    imageUrl: `https://webscraper.io${imageUrl}`
                });
            }
        });

        return laptops;
    } catch (error) {
        console.error(`Error scraping Lenovo laptops from page ${pageNumber}:`, error);
        return [];
    }
};


//Main function
const scrapeAllLenovoLaptops = async () => {
    let laptops = [];

    //Get the last page from pagination
    const lastPageNumber = await getLastPageNumber();

    //Get the all the laptops from the pages 
    for (let page = 1; page <= lastPageNumber; page++) {
        const laptopsFromPage = await scrapeLenovoLaptopsFromPage(page);
        laptops = laptops.concat(laptopsFromPage);
    }

    //Sort the laptops by price
    let laptopsSortedByPrice = laptops.sort((a, b) => {
        const priceA = parseFloat(a.price.replace('$', '').replace(',', ''));
        const priceB = parseFloat(b.price.replace('$', '').replace(',', ''));
        return priceA - priceB;
    });


    return laptopsSortedByPrice;
};


//Reat api
app.get('/lenovo-laptops', async (req, res) => {
    const laptops = await scrapeAllLenovoLaptops();
    res.json(laptops);
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
