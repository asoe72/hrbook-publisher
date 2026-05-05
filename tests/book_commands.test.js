'use strict';

const path = require('path');

// mock 모듈
jest.mock('../src/md2html', () => ({ convDir: jest.fn().mockResolvedValue(0) }));
jest.mock('../src/bookbind', () => ({ bind: jest.fn().mockResolvedValue(undefined) }));

const { bindBook } = require('../src/book_commands');
const md2html = require('../src/md2html');
const bookbind = require('../src/bookbind');


describe('bindBook', () => {
    const mockFs = require('fs');

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(mockFs, 'existsSync').mockReturnValue(true);
        jest.spyOn(mockFs, 'rmSync').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('SUMMARY.md 없으면 -1 반환', async () => {
        mockFs.existsSync.mockImplementation((p) => {
            return !p.endsWith('SUMMARY.md');
        });
        const result = {};
        const ret = await bindBook('/some/path', [], result);
        expect(ret).toBe(-1);
        expect(result.msg).toContain('not found');
    });

    test('bookinfo.json 없으면 -2 반환', async () => {
        mockFs.existsSync.mockImplementation((p) => {
            return !p.endsWith('bookinfo.json');
        });
        const result = {};
        const ret = await bindBook('/some/path', [], result);
        expect(ret).toBe(-2);
        expect(result.msg).toContain('not found');
    });

    test('두 파일 모두 있으면 0 반환', async () => {
        mockFs.existsSync.mockReturnValue(true);
        const result = {};
        const ret = await bindBook('/some/path', [], result);
        expect(ret).toBe(0);
    });

    test('두 파일 모두 있으면 md2html.convDir 호출됨', async () => {
        mockFs.existsSync.mockReturnValue(true);
        await bindBook('/some/path', [], {});
        expect(md2html.convDir).toHaveBeenCalledWith('/some/path', 'public/out/', []);
    });

    test('두 파일 모두 있으면 bookbind.bind 호출됨', async () => {
        mockFs.existsSync.mockReturnValue(true);
        await bindBook('/some/path', ['v1'], {});
        expect(bookbind.bind).toHaveBeenCalledWith(
            'public/out/',
            '/some/path',
            ['v1'],
            path.join('/some/path', 'SUMMARY.md'),
            path.join('/some/path', 'bookinfo.json')
        );
    });

    test('두 파일 모두 있으면 public/out/ 폴더 삭제 후 진행', async () => {
        mockFs.existsSync.mockReturnValue(true);
        await bindBook('/some/path', [], {});
        expect(mockFs.rmSync).toHaveBeenCalledWith('public/out/', { recursive: true, force: true });
    });
});
