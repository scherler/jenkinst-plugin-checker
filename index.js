const fs = require('fs')
const readline = require('readline');
const request = require('request');

const TOKEN = process.env.GIT_TOKEN

if (!TOKEN) {
    console.error('Please provide a token')
    process.exit(1);
}

function readFile(type) {
    return readline.createInterface({
        input: fs.createReadStream(`./plugins.${type}.txt`),
        console: false
    });
}

// generate array of plugin list
const generateUrlList = async (type) => new Promise(
    (resolve) => {
        const lineBuffer = [];
        const readInterface = readFile(type);
        readInterface.on('line', function (plugin) {
            const url = `https://api.github.com/repos/${plugin}/${type}`
            lineBuffer.push({ plugin, url });
        });
        readInterface.on('close', function () {
            console.log('end');
            resolve(lineBuffer);
        });
    }
)

const main = async () => {
    const releases = await generateUrlList('releases')
    const tags = await generateUrlList('tags')
    const plugins = [...releases, ...tags];
    // generateInfo('releases');

    console.log(plugins);
};

main();

const getPluginInfo = async (plugin) => new Promise(
    (resolve, reject) => {
        const lineBuffer = [];

        const options = {
            url: plugin.url,
            method: 'GET',
            Authorization: `Bearer ${TOKEN}`,
            headers: {
                "User-Agent": 'jenkins-plugin-checker',
                "Accept": 'application/vnd.github+json',
                "Content-Type": "application/json",
            },
        };
        const rl = readline.createInterface({
            input: request(options).on('error', (err) => reject(err)),
        });
        rl
            .on('line', (line) => {
                lineBuffer.push({
                    releases: JSON.parse(line)?.length > 0,
                    plugin
                });
            })
            .on('close', () => resolve(lineBuffer));
    }
);



