let properties;

(async function loadProperties() {
    const resp = await fetch('./properties.json');
    properties = await resp.json();
})();

function toggleDropDown(event) {
    if(event.target.querySelector('.dropdown').style.display === 'none' || !event.target.querySelector('.dropdown').style.display) {
        event.target.querySelector('.dropdown').style.display = 'flex'
    } else {
        event.target.querySelector('.dropdown').style.display = 'none'
    }
}

async function toggleWin(event) {
    let figure;
    let wasWin = false;

    if(event.target.tagName !== 'FIGURE') {
        figure = event.target.parentElement;
    } else {
        figure = event.target;
    }

    const statExisted = Boolean(figure.attributes['statExisted'].value);
    const playerId = parseInt(figure.attributes['playerId'].value);
    const championId = parseInt(figure.attributes['championId'].value);


    if(playerId && statExisted && championId) {
        if(figure.classList.contains('win')) {
            wasWin = true;
        };


        figure.classList.toggle('win');

        const formData = new FormData();
        formData.append('player_id', playerId);
        formData.append('champion_id', championId);
        formData.append('win', !wasWin);

        figure.attributes['statExisted'] = !statExisted;

        console.log(formData);

        await fetch(`http://${properties.app_api}/stats/byId`, {
            method: statExisted ? 'DELETE' : 'POST',
            body: formData
        });
    }
}

function filterChamps(value) {
    const champs = document.querySelectorAll('#championsList figure.champion');

    champs.forEach((champ) => {
        if(!champ.lastElementChild.textContent.includes(value)) {
            champ.style.display = 'none'
        } else {
            champ.style.display = 'flex';
        }
    });
}