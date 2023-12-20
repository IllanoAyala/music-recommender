async function getRecommendedTracks(artistName) {
    const clientId = 'e92fa6d32df84cafb0702c1601a598ec';
    const clientSecret = '3b32fb193e924ba780e28d617e7a59e3';

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
        },
        body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
        throw new Error('failed to get access token');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        },
    });

    if (!searchResponse.ok) {
        throw new Error('failed to search artist');
    }

    const searchData = await searchResponse.json();
    if (!searchData.artists.items[0]) {
        throw new Error('artist not found');
    }

    const artistId = searchData.artists.items[0].id;

    const recommendationsResponse = await fetch(`https://api.spotify.com/v1/recommendations?seed_artists=${artistId}&limit=7`, {
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        },
    });

    if (!recommendationsResponse.ok) {
        throw new Error('failed to get recommended tracks');
    }

    const recommendationsData = await recommendationsResponse.json();
    const recommendedTracks = recommendationsData.tracks;

    return recommendedTracks.map(track => ({
        name: track.name,
        albumCover: track.album.images && track.album.images[0] ? track.album.images[0].url : 'imagem não disponível',
        uri: track.uri
    }));
}

function getSpotifyPlayUrl(uri) {
    return `https://open.spotify.com/track/${uri}`;
}

let timeWriting;
const interval = 700;

document.getElementById('artist-name').addEventListener('input', function (event) {
    clearTimeout(timeWriting);

    timeWriting = setTimeout(async function () {
        var artistName = event.target.value;

        if(artistName === '')
        {
            const containerTracks = document.getElementById("container-tracks");
            containerTracks.textContent = '';
            selectedTracksSet.clear();

        }
        else if(artistName === 'Frank Ocean') //Ela gosta de frank ocean
        {
            const containerTracks = document.getElementById("container-tracks");
            containerTracks.textContent = 'Fiz isso aqui para você. Gosto de você.  (Tudo bem se não achar tão legal)';
            containerTracks.classList.add('iluvu');
        }

        else{

            try {

                const recommendedTracks = await getRecommendedTracks(artistName);
                const containerTracks = document.getElementById("container-tracks");
                
                containerTracks.textContent = '';
                containerTracks.classList.remove('iluvu')
    
                recommendedTracks.forEach((track, index) => {
                    const listItem = document.createElement('div');
                    listItem.innerHTML = `
                        <p>${track.name}</p>
                        <img src="${track.albumCover}" alt="${track.name} - Album Cover" style="width: 35px; height: 35px; margin-right: 5px">
                    `;
                    listItem.classList.add('music-track');

                    listItem.addEventListener('click', () => {
                        const playUrl = getSpotifyPlayUrl((track.uri).replace("spotify:track:", ""));
                
                        window.open(playUrl, '_blank');
                    });

                    containerTracks.appendChild(listItem);
                });
            } catch (error) {
                console.error('Error:', error);
            }
        }
    }, interval);
});


let selectedTracksSet = new Set();

document.getElementById('reload-btn').addEventListener('click', async function () {
    var artistName = document.getElementById('artist-name').value;

    try {
        let recommendedTracks = await getRecommendedTracks(artistName);

        recommendedTracks = recommendedTracks.filter(track => !selectedTracksSet.has(track.name));

        recommendedTracks.forEach(track => selectedTracksSet.add(track.name));

        const containerTracks = document.getElementById("container-tracks");
        containerTracks.textContent = '';

        recommendedTracks.forEach((track, index) => {
            const listItem = document.createElement('div');
            listItem.innerHTML = `
                <p>${track.name}</p>
                <img src="${track.albumCover}" alt="${track.name} - Album Cover" style="width: 30px; height: 30px; margin-right: 5px">
            `;
            listItem.classList.add('music-track');

            listItem.addEventListener('click', () => {
                const playUrl = getSpotifyPlayUrl((track.uri).replace("spotify:track:", ""));
        
                window.open(playUrl, '_blank');
            });

            containerTracks.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error:', error);
    }
});
