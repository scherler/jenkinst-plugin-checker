const fs = require('fs')
const readline = require('readline');
const request = require('request');

const TOKEN = process.env.GIT_TOKEN

if (!TOKEN) {
    console.error('Please provide a token')
    process.exit(1);
}

generateInfo('releases');

function generateInfo(type) {
    const readInterface = readline.createInterface({
        input: fs.createReadStream(`./plugins.${type}.txt`),
        output: process.stdout,
        console: false
    });

    readInterface.on('line', function (line) {
        getPluginInfo(line).then((plugin) => {
            console.log(plugin);
        });
    });

    const getPluginInfo = async (plugin) => new Promise(
        (resolve, reject) => {
            const lineBuffer = [];
            const url = `https://api.github.com/repos/${plugin}/${type}        `;

            const options = {
                url,
                method: 'GET',
                Authorization: `Bearer ${TOKEN}`,
                headers: {
                    "User-Agent": 'jenkins-plugin-checker',
                    "Accept": 'application/vnd.github+json',
                    "Content-Type": "application/json",
                },
            };
            const callback = (error, response, body) => {
                // console.log(body);
                console.log(response.statusCode);
            };
            const rl = readline.createInterface({
                input: request(options, callback).on('error', (err) => reject(err)),
            });
            rl
                .on('line', (line) => {
                    lineBuffer.push({
                        releases: JSON.parse(line)?.length>0,
                        plugin
                    });
                })
                .on('close', () => resolve(lineBuffer));
        }
    );
}
