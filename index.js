const fs = require('fs')
const readline = require('readline');
const request = require('request');

const TOKEN = process.env.GIT_TOKEN
// early out when we don't have a token
if (!TOKEN) {
    console.error('Please provide a git token by setting the environment variable GIT_TOKEN')
    process.exit(1);
}
// read input file
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
            lineBuffer.push({ plugin, url, type });
        });
        readInterface.on('close', function () {
            resolve(lineBuffer);
        });
    }
)
// wrapper function to resolve all Promise
const getPluginsInfo = async (plugins) => new Promise(
    (resolve, reject) => {
        const all = plugins.map((release) => getPluginInfo(release))
        Promise.all(all)
            .catch((err) => { 
                reject(err)
            })
            .then((plugins) => {
                resolve(plugins);
            })
    }
)
// contact github and get releases
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
                    isActive: JSON.parse(line)?.length > 0,
                    ...plugin
                });
            })
            .on('close', () => resolve(lineBuffer));
    }
);
// right now we only check releases
const main = async () => {
    const releases = await generateUrlList('releases')
    getPluginsInfo(releases).then((all) => {
        fs.writeFile('./plugins.dist.json', JSON.stringify(all), err=> {
            if (err) {
              console.error(err);
            }
            console.info('file written successfully');
            console.log(all);
          });
    })
};

// invoke
main();
