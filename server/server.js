import express from 'express';
import formidable from 'express-formidable'
import pg from 'pg';
import { decrypt } from '@tka85/dotenvenc';
import https from 'https'
import http from 'http'

const app = express();
app.use(formidable());

const httpPort = 8495;
const httpsPort = 8496;

await decrypt();

const { Client } = pg;

function handleError(error, res) {
    res.json({
        status: JSON.parse(error.message).status_code,
        message: JSON.parse(error.message).message
    });
}

async function handleDbRequest(dbReq, values = []) {
    const client = new Client({
        host: process.env.dbHost,
        port: process.env.dbPort,
        database: process.env.db,
        user: process.env.dbUser,
        password: process.env.dbPsswd
    });

    client.connect();

    const { rows } = await client.query(dbReq, values);

    client.end();

    return Promise.resolve(rows);
}

function createRoutesJson() {
    const routes = {
        available_routes: {

        }
    }

    app._router.stack.filter(layer => layer.route).map(layer => {
        const aPath = layer.route.path.split('/');
        aPath.shift();

        let currPath = routes.available_routes;
        let addFrom = true;

        for(const path of aPath) {
            const method = Object.keys(layer.route.methods)[0].toUpperCase();

            let description = '';
            switch(method) {
                case 'GET':
                    description += 'Get';
                    break;
                case 'POST':
                    description += 'Create';
                    break;
                case 'PUT':
                    description += 'Update';
                    break;
            }

            if(!currPath[method] && aPath.indexOf(path) === 0) {
                currPath[method] = [];
            }

            if(!path.includes(':')) {
                currPath[method].push({
                    method: method,
                    path: `/${path}`,
                    description: `${description} ${path || 'API routes'}`
                });

                currPath = currPath[method][currPath[method].length - 1];
            } else {
                currPath.path += `/${path}`

                if(addFrom) {
                    addFrom = false;
                    currPath.description += ' from'
                } else if (aPath.indexOf(path) != aPath.length - 1) {
                    currPath.description += ','
                } else {
                    currPath.description += ' and'
                }

                currPath.description += ` ${path.replaceAll(':', '')}`
            }
        }
    });

    return routes
}

app.get('/', (_, res) => {
    const routes = createRoutesJson();

    res.json(routes);
});

app.get('/players', async (_, res) => {
    try {
        const players = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_players');

        res.json(players);
    } catch(error) {
        handleError(error, res)
    }
});

app.get('/players/:playerName', async (req, res) => {
    try {
        const [player] = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_players WHERE name = $1 ', [req.params.playerName]);

        res.json(player);
    } catch(error) {
        handleError(error, res)
    }
});

app.post('/players', async (req, res) => {
    const body = req.fields;

    try {
        const player = await handleDbRequest('INSERT INTO "arenaChampTracker".v_players(name) VALUES($1) RETURNING *', [body.playerName]);

        res.json(player);
    } catch(error) {
        handleError(error, res)
    }
});

app.get('/champs', async (_, res) => {
    try {
        const champs = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_champions');

        res.json(champs);
    } catch(error) {
        handleError(error, res)
    }
});

app.get('/champs/:champName', async (req, res) => {
    try {
        const [champ] = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_champions WHERE name = $1', [req.params.champName]);

        res.json(champ);
    } catch(error) {
        handleError(error, res)
    }
});

app.get('/stats/:playerName', async (req, res) => {
    try {
        const [player] = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_players WHERE name = $1', [req.params.playerName]);

        const stats = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_stats WHERE player_id = $1', [player?.player_id]);

        res.json(stats);
    } catch(error) {
        handleError(error, res)
    }
});

app.get('/stats/:playerName/:champName', async (req, res) => {
    try {
        const [player] = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_players WHERE name = $1', [req.params.playerName]);

        const [champ] = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_champions WHERE name = $1', [req.params.champName]);

        const [stat] = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_stats WHERE player_id = $1', [player?.player_id]);

        res.json({
            player,
            champion: champ,
            stat
        });
    } catch(error) {
        handleError(error, res)
    }
});

app.post('/stats/byName', async (req, res) => {
    const body = req.fields;

    try {
        const [player] = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_players WHERE name = $1', [body.playerName]);
        const [champ] = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_champions WHERE name = $1', [body.champName]);

        const [stat] = await handleDbRequest('INSERT INTO "arenaChampTracker".v_stats(player_id, champion_id, win) VALUES($1, $2, $3) RETURNING *', [player?.player_id, champ?.champion_id, true]);

        res.json(stat);
    } catch(error) {
        handleError(error, res)
    }
});

app.post('/stats/byId', async (req, res) => {
    const body = req.fields;

    try {
        const [stat] = await handleDbRequest('INSERT INTO "arenaChampTracker".v_stats(player_id, champion_id, win) VALUES($1, $2, $3) RETURNING *', [body.player_id, body.champion_id, true]);

        res.json(stat);
    } catch(error) {
        handleError(error, res)
    }
});

app.put('/stats/byName', async (req, res) => {
    const body = req.fields;

    try {
        const [player] = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_players WHERE name = $1', [body.playerName]);
        const [champ] = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_champions WHERE name = $1', [body.champName]);

        const [stat] = await handleDbRequest('UPDATE "arenaChampTracker".v_stats SET win = $1 WHERE player_id = $2 AND champion_id = $3 RETURNING *', [body.win, player?.player_id, champ?.champion_id]);

        res.json(stat);
    } catch(error) {
        handleError(error, res)
    }
});

app.put('/stats/byId', async (req, res) => {
    const body = req.fields;

    try {
        const [stat] = await handleDbRequest('UPDATE "arenaChampTracker".v_stats SET win = $1 WHERE player_id = $2 AND champion_id = $3 RETURNING *', [body.win,body.player_id, body.champion_id]);

        res.json(stat);
    } catch(error) {
        handleError(error, res)
    }
});

app.delete('/stats/byName', async (req, res) => {
    const body = req.fields;

    try {
        const [player] = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_players WHERE name = $1', [body.playerName]);
        const [champ] = await handleDbRequest('SELECT * FROM "arenaChampTracker".v_champions WHERE name = $1', [body.champName]);

        const [stat] = await handleDbRequest('DELETE "arenaChampTracker".v_stats WHERE player_id = $1 AND champion_id = $2 RETURNING *', [player.player_id, champ.champion_id]);

        res.json(stat);
    } catch(error) {
        handleError(error, res)
    }
});

app.delete('/stats/byId', async (req, res) => {
    const body = req.fields;

    try {
        const [stat] = await handleDbRequest('DELETE FROM "arenaChampTracker".v_stats WHERE player_id = $1 AND champion_id = $2', [body.player_id, body.champion_id]);

        res.json(stat);
    } catch(error) {
        handleError(error, res)
    }
});

const httpServer = http.createServer(app);
const httpsServer = https.createServer({}, app);

httpServer.listen(httpPort);
httpsServer.listen(httpsPort);