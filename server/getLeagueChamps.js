import pg from 'pg';
import { decrypt } from '@tka85/dotenvenc'

const { Client } = pg;

await decrypt();

const cli = new Client({
    host: process.env.dbHost,
    port: process.env.dbPort,
    database: process.env.db,
    user: process.env.dbUser,
    password: process.env.dbPsswd
});

await cli.connect();

async function registerChamps() {
    const resp = await fetch('https://ddragon.leagueoflegends.com/cdn/15.6.1/data/en_US/champion.json');
    const json = await resp.json();


    const query = 'INSERT INTO "arenaChampTracker".v_champions(name, image) VALUES($1, $2)';

    for(const champ in json.data) {
        const values = [
            json.data[champ].name,
            json.data[champ].image.full
        ];

        await cli.query(query, values);
    }
};

await registerChamps();

await cli.end();