const request = require('supertest');
const app = require('../server');

describe('GET /app-version', () => {
    it('200 응답과 version 필드를 반환한다', async () => {
        const res = await request(app).get('/app-version');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('version');
    });

    it('version이 package.json의 version과 일치한다', async () => {
        const { version } = require('../package.json');
        const res = await request(app).get('/app-version');
        expect(res.body.version).toBe(version);
    });
});
