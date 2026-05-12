import {test, expect} from '@playwright/test';

test.describe('Home page', ()=>{
    test('Handling the pop-up', async ({browser})=>{
        const context= await browser.newContext();
        const page=await context.newPage();
        await page.goto("https://www.justdial.com/");

        await page.waitForLoadState("domcontentloaded");
        const closeBanner=page.locator("//span[@aria-label='Close Banner']");
        if(await closeBanner.isVisible()){
            await closeBanner.click();
        };
         await expect(closeBanner).toBeHidden();
         //await expect(page.locator("//span[@aria-label='Close Banner']")).toBeHidden();
         const loginBanner= page.getByLabel("May be later")
         if(await loginBanner.isVisible()){
             await loginBanner.click();
         };
         await expect(loginBanner).toBeHidden();

        const listing=page.locator("#header_freelisting");
        await listing.hover();
        await page.waitForLoadState("domcontentloaded");
        // await page.goto("https://www.justdial.com/Free-Listing?source=77&cta_from=W_hmpge_web_header_freelisting");
        // await page.waitForLoadState("networkidle"); 
        // const [newPage]=await Promise.all([
        //    context.waitForEvent("page"), listing.click()]);
        await listing.click();
        await page.waitForLoadState("domcontentloaded");
        const input=page.locator(".entermobilenumber_input__eCrdc").first();
        //await page.locator(".entermobilenumber_input__eCrdc").first().waitFor();
        await input.pressSequentially("1234567890", {delay: 200});
        const start_now=page.locator(".entermobilenumber_innertext__sRcH7").first();
        await start_now.click();
        await page.pause();
   })
})