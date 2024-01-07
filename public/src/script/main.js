//Autor: Illano Ayala - 2024

async function getRecommendedTracks(artistName) {

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

    if(!justArtist){
        const recommendationsResponse = await fetch(`https://api.spotify.com/v1/recommendations?seed_artists=${artistId}&limit=6`, {
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

    else{
        const recommendationsResponse = await fetch(`https://api.spotify.com/v1/recommendations?seed_artists=${artistId}&limit=10`, {
            headers: {
                'Authorization': 'Bearer ' + accessToken,
            },
        });

        if (!recommendationsResponse.ok) {
            throw new Error('failed to get recommended tracks');
        }
    
        const recommendationsData = await recommendationsResponse.json();
        const recommendedTracks = recommendationsData.tracks;
        
        const artistResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            headers: {
                'Authorization': 'Bearer ' + accessToken,
            },
        });

        if (!artistResponse.ok) {
            throw new Error('failed to get artist details');
        }

        const artistData = await artistResponse.json();
        const originalArtistName = artistData.name;

        const allRecommendedTracks = recommendedTracks;

        const sameArtistTracks = allRecommendedTracks.filter(track => {
            const trackArtists = track.artists.map(artist => artist.name);
            return trackArtists.includes(originalArtistName);
        });

        return (sameArtistTracks.slice(0, 6)).map(track => ({
            name: track.name,
            albumCover: track.album.images && track.album.images[0] ? track.album.images[0].url : 'imagem não disponível',
            uri: track.uri
        }));
    }
}

let timeWriting;
const interval = 100;

document.getElementById('artist-name').addEventListener('input', function (event) {
    clearTimeout(timeWriting);

    timeWriting = setTimeout(async function () {
        let artistName = event.target.value;
        const containerTracks = document.getElementById("container-tracks");

        if(artistName === '')
        {
            const autocompleteList = document.getElementById('autocomplete-list');

            containerTracks.textContent = '';
            autocompleteList.innerHTML = '';

            selectedTracksSet.clear();

        }
        // else if(artistName === '') //Ela gosta *apagar depois*
        // {
        //     const containerTracks = document.getElementById("container-tracks");
        //     const autocompleteList = document.getElementById('autocomplete-list');

        //     autocompleteList.innerHTML = '';
        //     containerTracks.textContent = '';
        //     containerTracks.classList.add('iluvu');
        // }

        else{
            autoComplete(artistName);
            containerTracks.textContent = '';
            containerTracks.classList.remove('iluvu');
        }
    }, interval);
});

function createLoadingGif(){
    const loadingDiv = document.createElement('div');
    loadingDiv.id = "loading";
    const img = document.createElement('img');
    img.src = 'src/styles/img/icons8-carregando.gif'
    loadingDiv.appendChild(img);
    return loadingDiv;
}

let selectedTracksSet = new Set();

document.getElementById('reload-btn').addEventListener('click', async function () {
    let artistName = document.getElementById('artist-name').value;
    const containerTracks = document.getElementById("container-tracks");

    const iframes = document.querySelectorAll("iframe");

    for (let index = 0; index < iframes.length; index++) {
        containerTracks.removeChild(iframes[index]);           
    }

    containerTracks.appendChild(createLoadingGif());

    try {
        let recommendedTracks = await getRecommendedTracks(artistName);

        recommendedTracks = recommendedTracks.filter(track => !selectedTracksSet.has(track.name));

        if(justArtist){
            console.log(recommendedTracks.length)

            let numberTracks = document.getElementById("container").offsetHeight >= 800 ? 6 : 5;

            while (recommendedTracks.length < numberTracks) {
                let additionalTracks;
        
                try {
                    additionalTracks = await Promise.race([
                        getRecommendedTracks(artistName),
                        new Promise((_resolve, reject) => {
                            setTimeout(() => reject(new Error('timeout, not found tracks')), 5000);
                        }),
                    ]);
                } catch (error) {
                    console.error(error.message);
                    break; 
                }
        
                recommendedTracks.push(...additionalTracks.filter(track => !selectedTracksSet.has(track.name)));
            }

            console.log(recommendedTracks.length)

            if(recommendedTracks.length > numberTracks){              
                recommendedTracks.splice(numberTracks, recommendedTracks.length - numberTracks)
            }

            console.log(recommendedTracks.length)

        }

        containerTracks.removeChild(document.getElementById("loading"))
        containerTracks.innerHTML = '';

        recommendedTracks.forEach((track, index) => {
            const iframe = document.createElement('iframe');
            iframe.src = `https://open.spotify.com/embed/track/${(track.uri).replace("spotify:track:", "")}?utm_source=generator`;
            iframe.width = '100%';
            iframe.height = '90vh';
            iframe.frameBorder = '0';
            iframe.allowfullscreen = true;
            iframe.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
            iframe.loading = 'lazy';
            iframe.style.borderRadius = '12px';
            iframe.className = 'iframe';

            iframe.addEventListener('load', () => {
                iframe.classList.add('loaded'); 
            });
        
            containerTracks.appendChild(iframe);
        });
    } catch (error) {
        console.error('Error:', error);
    }
});

// document.getElementById("change-mode").addEventListener("click", function(){
//     justArtist = !justArtist
//     console.log(`${justArtist}`)
//     // document.getElementById('reload-btn').click()

    
//     // if(justArtist){
//     //     document.getElementById("artist-name").classList.add("change")
//     // }
//     // else{
//     //     document.getElementById("artist-name").classList.remove("change")
//     // }
// })

document.addEventListener('click', (event) => {
    const autocompleteContainer = document.getElementById('container-artist');
    if (!autocompleteContainer.contains(event.target)) {
        document.getElementById('autocomplete-list').innerHTML = '';
    }
});


async function autoComplete(artistName){
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

    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=9`, {
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

    const allArtists = searchData.artists.items.map(artist => artist.name)

    
    const artistName1 = (document.getElementById('artist-name').value).toLowerCase();
    const autocompleteList = document.getElementById('autocomplete-list');

    autocompleteList.innerHTML = '';

    const suggestions = allArtists.filter(artist => artist.toLowerCase().includes(artistName1));
    // console.log(suggestions)
    // console.log(document.getElementById("container").offsetHeight)

    suggestions.forEach(suggestion => {
        const suggestionDiv = document.createElement('div');
        suggestionDiv.innerHTML = suggestion;
        suggestionDiv.addEventListener('click', () => {
        document.getElementById('artist-name').value = suggestion;
        autocompleteList.innerHTML = '';
        document.getElementById('reload-btn').click()
        });
        autocompleteList.appendChild(suggestionDiv);
    });
}
