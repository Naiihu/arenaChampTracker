CREATE SCHEMA "arenaChampTracker";

CREATE SEQUENCE arenaCheckerIndexes START 1;

CREATE TABLE "arenaChampTracker".champions (
    champion_id integer,
    name varchar(50) NOT NULL,
    image varchar(50),
    riot_id integer,
    primary key (champion_id)
);

CREATE TABLE "arenaChampTracker".players (
    player_id integer,
    name varchar(16) NOT NULL,
    primary key (player_id)
);

CREATE TABLE "arenaChampTracker".stats (
    player_id integer,
    champion_id integer,
    win boolean NOT NULL,
    primary key (player_id, champion_id)
);

ALTER TABLE "arenaChampTracker".stats
ADD CONSTRAINT stats_player_id_fk FOREIGN KEY (player_id) REFERENCES "arenaChampTracker".players (player_id);

ALTER TABLE "arenaChampTracker".stats
ADD CONSTRAINT stats_champion_id_fk FOREIGN KEY (champion_id) REFERENCES "arenaChampTracker".champions (champion_id);

CREATE OR REPLACE VIEW "arenaChampTracker".v_champions AS (
    SELECT *
    FROM "arenaChampTracker".champions
);

CREATE
OR REPLACE RULE insert_v_champions AS ON INSERT TO "arenaChampTracker".v_champions DO INSTEAD (
    INSERT INTO
        "arenaChampTracker".champions (champion_id, name, image, riot_id)
    VALUES (
            nextval('arenacheckerindexes'),
            new.name,
            new.image,
            new.riot_id
        )
    RETURNING
        *
);

CREATE
OR REPLACE RULE delete_v_champions AS ON DELETE TO "arenaChampTracker".v_champions DO INSTEAD (
    DELETE FROM "arenaChampTracker".champions
    WHERE
        champions.champion_id = champion_id
    RETURNING
        *
);

CREATE
OR REPLACE RULE update_v_champions AS ON UPDATE TO "arenaChampTracker".v_champions DO INSTEAD (
    UPDATE "arenaChampTracker".champions
    SET
        name = new.name,
        image = new.image
    RETURNING
        *
);

CREATE OR REPLACE VIEW "arenaChampTracker".v_players AS (
    SELECT *
    FROM "arenaChampTracker".players
);

CREATE
OR REPLACE RULE insert_v_players AS ON INSERT TO "arenaChampTracker".v_players DO INSTEAD (
    INSERT INTO
        "arenaChampTracker".players (player_id, name)
    VALUES (
            nextval('arenacheckerindexes'),
            new.name
        )
    RETURNING
        *
);

CREATE
OR REPLACE RULE delete_v_players AS ON DELETE TO "arenaChampTracker".v_players DO INSTEAD (
    DELETE FROM "arenaChampTracker".players
    WHERE
        players.player_id = player_id
    RETURNING
        *
);

CREATE
OR REPLACE RULE update_v_players AS ON UPDATE TO "arenaChampTracker".v_players DO INSTEAD (
    UPDATE "arenaChampTracker".players
    SET
        game_name = new.game_name,
        tag_line = new.tag_line
    RETURNING
        *
);

CREATE OR REPLACE VIEW "arenaChampTracker".v_stats AS (
    SELECT *
    FROM "arenaChampTracker".stats
);

CREATE
OR REPLACE RULE insert_v_stats AS ON INSERT TO "arenaChampTracker".v_stats DO INSTEAD (
    INSERT INTO
        "arenaChampTracker".stats (player_id, champion_id, win)
    VALUES (
            new.player_id,
            new.champion_id,
            new.win
        )
    RETURNING
        *
);

CREATE
OR REPLACE RULE delete_v_stats AS ON DELETE TO "arenaChampTracker".v_stats DO INSTEAD (
    DELETE FROM "arenaChampTracker".stats
    WHERE
        stats.player_id = old.player_id
        AND stats.champion_id = old.champion_id
);