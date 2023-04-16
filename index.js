const puppeteer = require('puppeteer');
const express = require('express');

var browser = null;
var page = null;
var wait = t => new Promise(r => setTimeout(r, t));

(async () => {
    browser = await puppeteer.launch({ headless: false });
    page = await browser.newPage();

    // Set screen size
    await page.setViewport({
        width: 1035,
        height: 665,
        deviceScaleFactor: 1,
    });

    page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 YaBrowser/23.3.1.895 Yowser/2.5 Safari/537.36")
    await page.goto('https://iss.vyatsu.ru/kaf/', { waitUntil: 'networkidle2' });

    //   Авторизуемся
    await page.evaluate(val => document.querySelector('input[id="O60_id-inputEl"]').value = val, "login");
    await page.evaluate(val => document.querySelector('input[id="O6C_id-inputEl"]').value = val, "password");
    await page.click('a[id="O64_id"]');

    await page.waitForSelector('label[id="OA3_id"]');
    await page.click('td[id="O19_id-inputCell"]');
    await page.click('li[class="x-boundlist-item"]:nth-child(4)');

    await page.waitForSelector('td[id="OF8_id-inputCell"]');
    await wait(500);
    await page.click('td[id="OF8_id-inputCell"]');
    await wait(500);
    await page.click(('div[id="boundlist-1015-listEl"] .x-boundlist-item:nth-child(3)'));
    await wait(500);
    await page.click('td[id="O13A_id-inputCell"]');
    await wait(500);
    await page.click(('div[id="boundlist-1053-listEl"] .x-boundlist-item:nth-child(1)'));
    await wait(500);
    await page.click(('td[id="OE4_id-bodyEl"]'));

})();

const app = express();
app.use(express.static('public'));
var getList = closed => new Promise((resolve, reject) => {
    page.evaluate(closed => {
        var data = []
        document.querySelectorAll('tbody')[27].querySelectorAll('tr').forEach((el, id) => {
            var item = {
                id,
                cmp: el.querySelector('td:nth-child(2)')?.innerText?.trim(),
                name: el.querySelector('td:nth-child(9)')?.innerText?.trim(),
                closed: el.querySelector('td:nth-child(10)')?.innerText?.trim()?.split('/')[0] == '1',
                qid: el.querySelector('td:nth-child(12)')?.innerText?.trim(),
                trid: el.id
            }
            if (closed == -1 || (closed == 1 && item.closed) || (closed == 0 && !item.closed)) data.push(item)
        })
        return data
    }, Number(closed)).then(data => { resolve(data) })
})

app.get('/list', (req, res) => {
    getList(-1).then(data => { res.send(data) })

})

app.get('/select', (req, res) => {
    (async () => {
        if (req.query.closed < 2) {
            var list = await getList(req.query.closed)
            var count = list.length
            var partsCount = Number(req.query.partscount)
            var partsNum = Number(req.query.partsnum)
            var itemsinpart = Math.round(count / partsCount)
    
            var startfrom = partsNum * itemsinpart
            var endfor = startfrom + itemsinpart
    
            var i = startfrom
            while (i < endfor && i < count) {
                await page.click(`tr#${list[i].trid} :nth-child(1) div`);
                i++
            }
        } else if (req.query.closed == 2) {
            var list = await getList(0)
            var count = list.length
            var partsCount = Number(req.query.partscount)
            var partsNum = Number(req.query.partsnum)
            var itemsinpart = Math.round(count / partsCount)
    
            var startfrom = partsNum * itemsinpart
            var endfor = startfrom + itemsinpart
    
            var i = startfrom
            while (i < endfor && i < count) {
                await page.click(`tr#${list[i].trid} :nth-child(1) div`);
                i++
            }

            var list = await getList(1)
            var count = list.length
            var partsCount = Number(req.query.partscount)
            var partsNum = Number(req.query.partsnum)
            var itemsinpart = Math.round(count / partsCount)
    
            var startfrom = partsNum * itemsinpart
            var endfor = startfrom + itemsinpart
    
            var i = startfrom
            while (i < endfor && i < count) {
                await page.click(`tr#${list[i].trid} :nth-child(1) div`);
                i++
            }
        }
        res.send("ok")
    })();
})

app.get('/comp', (req, res) => {
    (async () => {
        var compNum = Number(req.query.partsnum)+1
        var btnid = await page.evaluate(()=>{
            return document.querySelectorAll('a.x-btn')[21].id
        })
        await page.click(`a#${btnid}`);
        await page.waitForSelector('div.x-window');
        await wait(500);
        await page.waitForSelector(`.x-window tbody tr:nth-child(${compNum})`);
        await page.click(`.x-window tbody tr:nth-child(${compNum})`);
        await wait(100);
        var btnid = await page.evaluate(()=>{
            return document.querySelectorAll('a.x-btn')[23].id
        })
        await page.click(`a#${btnid}`);
        await wait(500);
        res.send("ok")
    })();
})

app.get('/zuv', (req, res) => {
    (async () => {
        var list = await getList(req.query.closed)
        var count = list.length
        var partsCount = 1
        var partsNum = 0
        var itemsinpart = Math.round(count / partsCount)

        var startfrom = partsNum * itemsinpart
        var endfor = startfrom + itemsinpart

        var i = startfrom
        while (i < endfor && i < count) {
            try {
                if (!(i % 3)) {
                    await page.click(`tr#${list[i].trid} :nth-child(3) div`);
                    await wait(100);
                    await page.waitForSelector('label[id="OA3_id"]');
                } else {
                    await page.click(`tr#${list[i].trid} :nth-child(4) div`);
                    await wait(100);
                    await page.click(`tr#${list[i].trid} :nth-child(5) div`);
                    await wait(100);
                }
                if ( Number(req.query.att) == 1 ) await page.click(`tr#${list[i].trid} :nth-child(6) div`);
                else await page.click(`tr#${list[i].trid} :nth-child(7) div`);
            } catch { } 
            i++
        }
        res.send("ok")
    })();
})


app.listen(3333);

