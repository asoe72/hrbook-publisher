const { normalizeBook, bindBook } = require('./src/book_commands');

// ----------------------------------------------
/// process.argv에서 command와 --path_md 파싱
/// @return { command, path_md }
function parseArgs(argv)
{
    const command = argv[2] || null;
    let path_md = null;

    for (let i = 3; i < argv.length; i++) {
        const match = argv[i].match(/^--path_md=(.+)$/);
        if (match) {
            path_md = match[1].replace(/^["']|["']$/g, '');
        }
    }

    return { command, path_md };
}


// ----------------------------------------------
function printUsage()
{
    console.log('hrbook2pdf');
    console.log('Usage:');
    console.log('  node cli.js normalize-book --path_md="<path>"');
    console.log('  node cli.js bind-book --path_md="<path>"');
}


// ----------------------------------------------
async function main()
{
    const { command, path_md } = parseArgs(process.argv);

    if (!command || !path_md) {
        printUsage();
        process.exit(1);
    }

    const result = {};
    let iret;

    if (command === 'normalize-book') {
        iret = normalizeBook(path_md, result);
        if (iret === 0) {
            console.log('normalize-book ok');
        } else {
            console.error(result.msg || `error code=${iret}`);
            process.exit(1);
        }
    }
    else if (command === 'bind-book') {
        iret = await bindBook(path_md, [], result);
        if (iret === 0) {
            console.log('bind-book ok');
        } else {
            console.error(result.msg || `error code=${iret}`);
            process.exit(1);
        }
    }
    else {
        console.error(`Unknown command: ${command}`);
        printUsage();
        process.exit(1);
    }
}


// ----------------------------------------------
if (require.main === module) {
    main();
}


module.exports = { parseArgs, main };
