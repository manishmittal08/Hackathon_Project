import { test, expect } from '@playwright/test';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import path from 'path';
import { validateNumber } from '../javascript_files/number_testing.js';
import { log } from 'console';

chromium.use(stealth());

test('Justdial - Reliable Click Fix', async () => {
    // 1. DELETE your 'user_data' folder manually before running this!
    const userDataDir = path.join(process.cwd(), 'jd_reliable_session');

    const context = await chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: { width: 1366, height: 768 },
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        args: ['--disable-blink-features=AutomationControlled']
    });

    const page = context.pages()[0] || await context.newPage();

    // Set a natural referer
    await page.setExtraHTTPHeaders({ 'Referer': 'https://www.google.com/' });

    console.log("Navigating to Justdial...");
    await page.goto('https://www.justdial.com/', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveTitle(/justdial/i);

    const searchBox = page.getByRole('combobox', { name: 'Search' });
    await expect(searchBox).toBeVisible();

    // Step 2: Handle the banner (if it blocks the header)
    const bannerClose = page.locator('span[aria-label="Close Banner"]').first();
    if (await bannerClose.isVisible({ timeout: 5000 })) {
        await bannerClose.click();
    }

    page.on("popup", async dialog => {
        await page.getByLabel("May be later").click();
    });
    //await page.locator('a:has-text("Gym")').first().click();
    //await page.pause();


    //     //Wait for the element to be present in the DOM
    const freeListingAnchor = page.locator('#header_freelisting a');

    // Ensure it's in the viewport (Playwright click already handles scroll, but evaluate if needed)
    await freeListingAnchor.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));

    // Hover first - this is critical for Justdial to load the destination's JS chunks
    await freeListingAnchor.hover();
    await page.waitForTimeout(500); // Small human-like delay

    // Perform the click
    // Using force: true helps if there's a transparent overlay (common on JD)
    await freeListingAnchor.click({ force: true });

    console.log("Navigation triggered");
    const input = page.locator(".entermobilenumber_input__eCrdc").first();
    await input.waitFor({ state: 'visible', timeout: 5000 });
    // Generate number starting with 1,2,3,4, or 5
    const firstDigit = Math.floor(Math.random() * 5) + 1; // 1 to 5
    const remainingDigits = Math.floor(Math.random() * 1000000000); // 9 digits
    const random_number = firstDigit * 1000000000 + remainingDigits;
    //await page.pause();
    await input.pressSequentially(random_number.toString(), { delay: 200 });

    const isInValid = validateNumber(random_number.toString());
    console.log(isInValid ? "Invalid Number" : "Valid Number");

    const start_now = page.locator(".entermobilenumber_innertext__sRcH7").first();
    await start_now.click();
    await expect(page).toHaveURL(/justdial\.com/);

    const wrongInputLocator = page.locator(".entermobilenumber_error__text__uPM09");
    let wrongInputText = '';
    try {
        await wrongInputLocator.waitFor({ state: 'visible', timeout: 5000 });
        wrongInputText = await wrongInputLocator.textContent();
    } catch (error) {
        wrongInputText = 'result message did not appear';
    }

    // Print output only for invalid (negative) numbers
    if (isInValid) {
        console.log('Number validation error message:', wrongInputText?.trim());
        expect(wrongInputText).not.toBe('result message did not appear');
        expect(wrongInputText?.trim().length).toBeGreaterThan(0);
    } else {
        await expect(wrongInputLocator).toBeHidden({ timeout: 5000 });
    }
    page.on("popup", async dialog => {
        await page.locator("button").nth(5).click();
    });
    await page.locator(".secondarybutton span").click();
    await page.goBack();
    await page.waitForTimeout(500);
    await searchBox.click();
    await searchBox.pressSequentially('Car Service', { delay: 200 });
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'Car Service Centres Category' }).locator('a').click();

    // Manual clicking through the menu to ensure all JS chunks load properly means selceting car manually
    // await page.locator(".cardhotkey__content",{hasText: 'Car Service'}).hover();
    // await page.locator(".cardhotkey__content",{hasText: 'Car Service'}).click();
    // await page.waitForTimeout(500);
    // await page.getByRole('link', { name: 'BMW' }).first().hover();
    // await page.getByRole('link', { name: 'BMW' }).first().click();
    // await page.waitForTimeout(500);
    // await page.getByRole('link', { name: 'BMW 6 Series' }).first().hover();
    // await page.getByRole('link', { name: 'BMW 6 Series' }).first().click();
    await page.waitForTimeout(500);
    await page.getByRole('combobox', { name: 'Ratings' }).click();
    const ratingOption = page.getByRole('option', { name: 'Ratings 4.0+' }).first();
    await ratingOption.waitFor({ state: 'visible', timeout: 5000 });
    await ratingOption.click();
    await page.waitForTimeout(500);
    await page.getByRole('combobox', { name: 'Sort by' }).click();
    await page.getByRole('option', { name: 'Distance' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('combobox', { name: 'Top Rated' }).click();
    await page.waitForTimeout(500);
    const listings = page.locator('.resultbox_info');
    await listings.first().waitFor({ state: 'visible', timeout: 30000 });
    await expect(listings.first()).toBeVisible();

    console.log('--- Displaying 5 Top Rated Car Wash Services ---');
    const count = await listings.count();
    expect(count).toBeGreaterThan(0);
    let validServiceCount = 0;
    for (let i = 0; i < count && validServiceCount < 5; i++) {
        const card = listings.nth(i);
        await card.scrollIntoViewIfNeeded();
        // Extract Name, Rating & Review Count
        const name = await card.locator('.resultbox_title_anchor').first().innerText();
        const ratingText = await card.locator('.resultbox_totalrate').first().innerText().catch(() => '0');
        const votesText = await card.locator('.resultbox_countrate').first().innerText().catch(() => '0');

        const rating = parseFloat(ratingText);
        const votes = parseInt(votesText.replace(/[^0-9]/g, ''), 10) || 0;

        // Enforcement of Condition: Votes must cross 20
        if (votes > 20) {
            // Robust phone extraction inside the card:
            // 1) locate the actual call-content span used by Justdial
            // 2) if element exists, try to read `data-phone` first
            // 3) fallback to visible text
            const phoneEl = await card.locator('div.callbutton span.callcontent.callNowAnchor, span.callcontent.callNowAnchor, .callcontent.callNowAnchor, .callcontent, .contact-number, .call_now_action, [data-phone]').first();
            let phone = 'Contact info hidden';
            if (await phoneEl.count() > 0) {
                phone = await phoneEl.getAttribute('data-phone');
                if (!phone) {
                    phone = await phoneEl.innerText().catch(() => '');
                }
                phone = phone ? phone.trim() : '';
                if (!phone || /^(show\s+)?number$/i.test(phone) || /show number/i.test(phone)) {
                    phone = 'Contact info hidden';
                }
            }

            console.log(`${validServiceCount + 1}. Business Name: ${name.trim()}`);
            console.log(`   Rating Profile: ${rating} ★ (${votes} Votes)`);
            console.log(`   Phone Number: ${phone}`);
            console.log('--------------------------------------------------');

            validServiceCount++;
        }
    }

    expect(validServiceCount).toBeGreaterThan(0);
    await page.waitForTimeout(1500);
    await page.getByAltText('Justdial Logo').click();
    // await page.getByRole("link",{name : 'Justdial'}).click();
    await page.waitForTimeout(500);
    await searchBox.click();
    await searchBox.pressSequentially('Gym', { delay: 200 });
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: 'Gyms near me' }).locator('a').click();
    await page.waitForTimeout(500);

    //await page.getByRole('combobox', { name: 'Gym' }).click();
    await page.locator(".filter_drop_icon").nth(2).click();
    await page.waitForTimeout(500);

    const fitnessButton = await page.getByRole("option").allTextContents();
    expect(fitnessButton.length).toBeGreaterThan(0);
    console.log('----- Sub-menu Items Extracted under Gym -----');
    console.log(fitnessButton);

    await context.close();
});


// Wait for dropdown menu to appear and extract sub-options (yoga, cardio, etc.)
//    const dropdownOptions = page.locator('ul.filter_ul li, .dropdown-menu li, [class*="resfilter_item_outer"]').filter({ hasText: /yoga|cardio|crossfit|zumba|pilates/i });
//     await dropdownOptions.first().waitFor({ state: 'visible', timeout: 5000 });

//     const subMenuCount = await dropdownOptions.count();
//     const subMenuList = [];

//     for (let i = 0; i < subMenuCount; i++) {
//         const itemText = await dropdownOptions.nth(i).innerText();
//         if (itemText.trim() !== '') {
//             subMenuList.push(itemText.trim());
//         }
//     }

//     console.log('--- Sub-menu Items Extracted under Gym ---');
//     console.log(subMenuList);

// 1. Target the actual child list items inside the open dropdown menu wrapper
// Based on your DevTools screenshot, the active class is 'resfilter_item_outer'
//const dropdownOptions = page.locator('ul#filter_ul li, [class*="resfilter_item_outer"]');
// 1. Target and click the actual button containing "Fitness Options"

// 2. Locate the floating filter dropdown container that Justdial overlays onto the page.
// We target it by looking for the wrapper containing your filter selection items.
// const dropdownContainer = page.locator('div[class*="filter"]').filter({ hasText: 'Gym' }).last();

// // 3. Drill down into the specific items/labels inside that visible filter container
// const dropdownOptions = dropdownContainer.locator('label, span, li, [role="option"]');

// // 4. Wait safely for the first real option to show up on screen
// await dropdownOptions.first().waitFor({ state: 'visible', timeout: 5000 });

// // 5. Extract and print the content cleanly
// const allGymCategories = await dropdownOptions.allInnerTexts();

// // 6. Deduplicate and clean up empty arrays or strings
// const cleanOptions = [...new Set(allGymCategories.map(text => text.trim()).filter(Boolean))];
// console.log('All Gym Categories:', cleanOptions);


// 2. Instead of checking for specific text visibility instantly,
// just wait for the first menu item container itself to be attached to the page DOM
//await dropdownOptions.first().waitFor({ state: 'attached', timeout: 12000 });

// 3. Extract all the text values natively
//const allItems = await dropdownOptions.allInnerTexts();

// 4. Clean and filter the array inside JavaScript using your keywords
// const targetKeywords = /gym|yoga|cardio|aerobics|zumba|martial arts|functional training|pilates/i;
// const filteredMenuOptions = allItems
//     .map(text => text.split('\n')[0].trim()) // Grab the main name, ignore sub-counts or spaces
//     .filter(text => targetKeywords.test(text) && text !== '');

// console.log('--- Extracted Sub-Menu Items ---');
// console.log(filteredMenuOptions);