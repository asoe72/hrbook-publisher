const puppeteer = require('puppeteer');
const { checkLink } = require('../src/review/links/check_links');


const validGlobalUrl = 'https://hrbook-hrc.web.app/#/view/doc-hrscript/ko/3-flowcontrol-subprogram/7-call-jump/README?cont_model=Hi6';
const invalidGlobalUrl1 = 'https://hrbook-hrc.web.app/#/view/doc-hrscript/ko/4-flowcontrol-subprogram/7-call-jump/README?cont_model=Hi6';
const invalidGlobalUrl2 = 'https://book-hrc.web.app/#/view/doc-hrscript/ko/3-flowcontrol-subprogram/7-call-jump/README?cont_model=Hi6';


describe('checkHRBookLink', () => {

    let browser, page;

    beforeAll(async () => {
        browser = await puppeteer.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    // 각 테스트 시작 전에 새로운 페이지(탭)를 생성
    beforeEach(async () => {
        page = await browser.newPage();
    });

    // 각 테스트 종료 후에 페이지를 닫음 (상태 전이 방지)
    afterEach(async () => {
        await page.close();
    });

    it('valid url 1 (hrbook)에 200으로 리턴한다.', async () => {
        const iret = await checkLink(page, validGlobalUrl);
        expect(iret).toBe(200);
    }, 10000);

    it('invalid url 1 (hash 뒤 오류)에 4XX으로 리턴한다.', async () => {
        const iret = await checkLink(page, invalidGlobalUrl1);
        expect(iret).toBeGreaterThanOrEqual(400);
        expect(iret).toBeLessThan(500);
    }, 10000);

    it('invalid url 2 (hash 앞 오류)에 4XX으로 리턴한다.', async () => {
        const iret = await checkLink(page, invalidGlobalUrl2);
        expect(iret).toBeGreaterThanOrEqual(400);
        expect(iret).toBeLessThan(500);
    }, 10000);
});


const validExternalUrl = 'https://www.hd-hyundairobotics.com/part/am';
const invalidExternalUrl = 'https://www.hd-hyundairobotics.com/part/am2';


describe('checkExternalLink', () => {

    it('valid url (external)에 200으로 리턴한다.', async () => {
        const iret = await checkLink(null, validExternalUrl);
        expect(iret).toBe(200);
    }, 10000);

    it('invalid url (external)에 4XX로 리턴한다.', async () => {
        const iret = await checkLink(null, invalidExternalUrl);
        expect(iret).toBeGreaterThanOrEqual(400);
        expect(iret).toBeLessThan(500);
    }, 10000);

});
