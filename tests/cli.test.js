'use strict';

jest.mock('../src/book_commands', () => ({
    normalizeBook: jest.fn().mockReturnValue(0),
    bindBook: jest.fn().mockResolvedValue(0),
}));

const { parseArgs, main } = require('../cli');
const bookCommands = require('../src/book_commands');

describe('parseArgs', () => {
    test('command와 path_md 모두 파싱', () => {
        const result = parseArgs(['node', 'cli.js', 'normalize-book', '--path_md=/my/book']);
        expect(result.command).toBe('normalize-book');
        expect(result.path_md).toBe('/my/book');
    });

    test('command 없으면 null 반환', () => {
        const result = parseArgs(['node', 'cli.js']);
        expect(result.command).toBeNull();
        expect(result.path_md).toBeNull();
    });

    test('--path_md 없으면 path_md가 null', () => {
        const result = parseArgs(['node', 'cli.js', 'normalize-book']);
        expect(result.command).toBe('normalize-book');
        expect(result.path_md).toBeNull();
    });

    test('--path_md 값에 큰따옴표 포함 시 제거', () => {
        const result = parseArgs(['node', 'cli.js', 'bind-book', '--path_md="C:/my docs/book"']);
        expect(result.path_md).toBe('C:/my docs/book');
    });

    test('--path_md 값에 작은따옴표 포함 시 제거', () => {
        const result = parseArgs(['node', 'cli.js', 'bind-book', "--path_md='C:/my docs/book'"]);
        expect(result.path_md).toBe('C:/my docs/book');
    });

    test('Windows 스타일 경로 처리', () => {
        const result = parseArgs(['node', 'cli.js', 'bind-book', '--path_md=C:\\Users\\user\\book']);
        expect(result.path_md).toBe('C:\\Users\\user\\book');
    });

    test('공백이 포함된 경로 처리 (따옴표 없는 경우)', () => {
        const result = parseArgs(['node', 'cli.js', 'normalize-book', '--path_md=/my book/path']);
        expect(result.path_md).toBe('/my book/path');
    });
});


describe('main', () => {
    let originalArgv;
    let exitSpy;

    beforeEach(() => {
        originalArgv = process.argv;
        exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
        jest.clearAllMocks();
    });

    afterEach(() => {
        process.argv = originalArgv;
        jest.restoreAllMocks();
    });

    test('normalize-book 명령 성공 시 console.log 출력', async () => {
        process.argv = ['node', 'cli.js', 'normalize-book', '--path_md=/my/book'];
        bookCommands.normalizeBook.mockReturnValue(0);
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        await main();

        expect(bookCommands.normalizeBook).toHaveBeenCalledWith('/my/book', {});
        expect(logSpy).toHaveBeenCalledWith('normalize-book ok');
    });

    test('bind-book 명령 성공 시 console.log 출력', async () => {
        process.argv = ['node', 'cli.js', 'bind-book', '--path_md=/my/book'];
        bookCommands.bindBook.mockResolvedValue(0);
        const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        await main();

        expect(bookCommands.bindBook).toHaveBeenCalledWith('/my/book', [], {});
        expect(logSpy).toHaveBeenCalledWith('bind-book ok');
    });

    test('command 없으면 process.exit(1) 호출', async () => {
        process.argv = ['node', 'cli.js'];
        jest.spyOn(console, 'log').mockImplementation(() => {});

        await expect(main()).rejects.toThrow('process.exit');
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('--path_md 없으면 process.exit(1) 호출', async () => {
        process.argv = ['node', 'cli.js', 'normalize-book'];
        jest.spyOn(console, 'log').mockImplementation(() => {});

        await expect(main()).rejects.toThrow('process.exit');
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('알 수 없는 명령이면 process.exit(1) 호출', async () => {
        process.argv = ['node', 'cli.js', 'unknown-cmd', '--path_md=/my/book'];
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'log').mockImplementation(() => {});

        await expect(main()).rejects.toThrow('process.exit');
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('normalize-book 실패 시 process.exit(1) 호출', async () => {
        process.argv = ['node', 'cli.js', 'normalize-book', '--path_md=/my/book'];
        bookCommands.normalizeBook.mockReturnValue(-1);
        jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(main()).rejects.toThrow('process.exit');
        expect(exitSpy).toHaveBeenCalledWith(1);
    });

    test('bind-book 실패 시 process.exit(1) 호출', async () => {
        process.argv = ['node', 'cli.js', 'bind-book', '--path_md=/my/book'];
        bookCommands.bindBook.mockResolvedValue(-1);
        jest.spyOn(console, 'error').mockImplementation(() => {});

        await expect(main()).rejects.toThrow('process.exit');
        expect(exitSpy).toHaveBeenCalledWith(1);
    });
});
