<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Arena Champ Tracker</title>
    <link rel="stylesheet" href="style.css">
    <script src="script.js"></script>
    <?php $properties = json_decode(file_get_contents('properties.json')); ?>
    <?php $players = json_decode(file_get_contents('http://'.$properties->app_api.'/players')) ?>
    <?php
        if($_SERVER['REQUEST_URI'] != '/') {
            $player = array_filter($players, function($v) {
                return  $v->name == str_replace('/', '', str_replace('%20', ' ', $_SERVER['REQUEST_URI']));
            });

            $stats = json_decode(file_get_contents('http://'.$properties->app_api.'/stats'.$_SERVER['REQUEST_URI']));
        } else {
            $player = [];

            $stats = [];
        }
    ?>
    <?php $champions = json_decode(file_get_contents('http://'.$properties->app_api.'/champs')) ?>
</head>
<body>
    <header>

    </header>
    <main>
        <section id="playersSelect">
            <button type="button" class="dropdown-toggle" id="players" onclick="toggleDropDown(event)"><?= str_replace('/', '', str_replace('%20', ' ', $_SERVER['REQUEST_URI'])) ?>
                <div class="dropdown" for="players">
                    <?php for ($i = 0; $i < count($players); $i++) {?><a href="<?='http://'.$_SERVER['HTTP_HOST'].'/'.$players[$i]->name?>" class="dropdown-item"><?= $players[$i]->name ?></a><?php } ?>
                </div>
            </button>
        </section>
        <section id="filterChamps">
            <input type="search" name="filterChamps" placeholder="Search champion" oninput="filterChamps(value)"/>
        </section>
        <section id="championsList">
            <?php for ($i=0; $i < count($champions); $i++) { ?>
                <?php
                    if(!empty($stats)) {
                        $stat = array_filter($stats, function($v) use($champions, $i) {
                            return $v->champion_id == $champions[$i]->champion_id;
                        });

                        $showWin = false;

                        if(!empty($stat)) {
                            $showWin = true;
                        }
                    }
                ?>
                <figure class="champion <?= $showWin ? 'win' : '' ?>" onclick="toggleWin(event)"
                    championId="<?= $champions[$i]->champion_id ?>" playerId="<?php if(!empty($player)){ echo $player[key($player)]->player_id; } ?>"
                    statExisted="<?= $showWin ?>"
                >
                    <img src="https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/<?= $champions[$i]->riot_id ?>.png" alt="<?= "Image of ".$champions[$i]->name ?>">
                    <figcaption><?= $champions[$i]->name ?></figcaption>
                </figure>
            <?php } ?>
        </section>
    </main>
    <footer>

    </footer>
</body>
</html>