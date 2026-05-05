const puppeteer = require('puppeteer');
const { checkLink } = require('../src/review/links/check_links');


const validGlobalUrl = 'https://hrbook-hrc.web.app/#/view/doc-hrscript/ko/3-flowcontrol-subprogram/7-call-jump/README?cont_model=Hi6';
const invalidGlobalUrl1 = 'https://hrbook-hrc.web.app/#/view/doc-hrscript/ko/4-flowcontrol-subprogram/7-call-jump/README?cont_model=Hi6';
const invalidGlobalUrl2 = 'https://book-hrc.web.app/#/view/doc-hrscript/ko/3-flowcontrol-subprogram/7-call-jump/README?cont_model=Hi6';


describe('checkHRBookLink', () => {

    let context = {}, browser, page;

    beforeAll(async () => {
        browser = await puppeteer.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    // 각 테스트 시작 전에 새로운 페이지(탭)를 생성
    beforeEach(async () => {
        context.browserPage = await browser.newPage();
    });

    // 각 테스트 종료 후에 페이지를 닫음 (상태 전이 방지)
    afterEach(async () => {
        await context.browserPage.close();
    });

    it('valid url 1 (hrbook)에 true로 리턴한다.', async () => {
        const iret = await checkLink(context, validGlobalUrl);
        expect(iret).toBe(true);
    }, 10000);

    it('invalid url 1 (hash 뒤 오류)에 false로 리턴한다.', async () => {
        const iret = await checkLink(context, invalidGlobalUrl1);
        expect(iret).toBe(false);
    }, 10000);

    it('invalid url 2 (hash 앞 오류)에 false로 리턴한다.', async () => {
        const iret = await checkLink(context, invalidGlobalUrl2);
        expect(iret).toBe(false);
    }, 10000);
});


const validExternalUrl = 'https://www.hd-hyundairobotics.com/part/am';
const invalidExternalUrl = 'https://www.hd-hyundairobotics.com/part/am2';


describe('checkExternalLink', () => {

    it('valid url (external)에 true로 리턴한다.', async () => {
        const iret = await checkLink(null, validExternalUrl);
        expect(iret).toBe(true);
    }, 10000);

    it('invalid url (external)에 false로 리턴한다.', async () => {
        const iret = await checkLink(null, invalidExternalUrl);
        expect(iret).toBe(false);
    }, 10000);

});
