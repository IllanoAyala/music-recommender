let justArtist = true;

const clientId = '2f5473de3e754d19b45076f7a280bf7b';
const clientSecret = 'a75b581755ad4dd3b8f75db0acc0a557';
async function getRecommendedTracks(artistName, reload) {

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

    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=4`, {
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

    // if(!reload){
    //     const allArtists = searchData.artists.items.map(artist => artist.name)

    //     // function autocomplete(){
    //         const artistName = (document.getElementById('artist-name').value).toLowerCase();
    //         const autocompleteList = document.getElementById('autocomplete-list');

    //         autocompleteList.innerHTML = '';

    //         const suggestions = allArtists.filter(artist => artist.toLowerCase().includes(artistName));
    //         // console.log(suggestions)

    //         suggestions.forEach(suggestion => {
    //             const suggestionDiv = document.createElement('div');
    //             suggestionDiv.innerHTML = suggestion;
    //             suggestionDiv.addEventListener('click', () => {
    //             document.getElementById('artist-name').value = suggestion;
    //             autocompleteList.innerHTML = '';
    //             document.getElementById('reload-btn').click()
    //             });
    //             autocompleteList.appendChild(suggestionDiv);
    //         });

    //     // }
    // }

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

        if(artistName === '')
        {
            const containerTracks = document.getElementById("container-tracks");
            const autocompleteList = document.getElementById('autocomplete-list');

            containerTracks.textContent = '';
            autocompleteList.innerHTML = '';

            selectedTracksSet.clear();

        }
        else if(artistName === 'Deftones') //Ela gosta *apagar depois*
        {
            const containerTracks = document.getElementById("container-tracks");
            const autocompleteList = document.getElementById('autocomplete-list');

            autocompleteList.innerHTML = '';
            containerTracks.textContent = 'i luv, anita!';
            containerTracks.classList.add('iluvu');
        }

        else{
            autoComplete(artistName);
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

    //add gif
    containerTracks.appendChild(createLoadingGif());
    document.getElementById('reload-btn').disabled = true;

    // containerTracks.innerHTML = 'Carregando...';

    try {
        let recommendedTracks = await getRecommendedTracks(artistName, true);

        recommendedTracks = recommendedTracks.filter(track => !selectedTracksSet.has(track.name));

        if(justArtist){
            console.log(recommendedTracks.length)
            while (recommendedTracks.length < 5) {
                let additionalTracks = await getRecommendedTracks(artistName, true);

                recommendedTracks.push(...additionalTracks.filter(track => !selectedTracksSet.has(track.name)));
            }

            console.log(recommendedTracks.length)

            if(recommendedTracks.length > 5){              
                recommendedTracks.splice(5, recommendedTracks.length - 5)
            }

            console.log(recommendedTracks.length)

        }

        containerTracks.removeChild(document.getElementById("loading"))
        document.getElementById('reload-btn').disabled = false;

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

document.getElementById("change-mode").addEventListener("click", function(){
    justArtist = !justArtist
    console.log(`${justArtist}`)
    // document.getElementById('reload-btn').click()

    
    // if(justArtist){
    //     document.getElementById("artist-name").classList.add("change")
    // }
    // else{
    //     document.getElementById("artist-name").classList.remove("change")
    // }
})

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

    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=4`, {
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

    // if(!reload){
        const allArtists = searchData.artists.items.map(artist => artist.name)

        
        const artistName1 = (document.getElementById('artist-name').value).toLowerCase();
        const autocompleteList = document.getElementById('autocomplete-list');

        autocompleteList.innerHTML = '';

        const suggestions = allArtists.filter(artist => artist.toLowerCase().includes(artistName1));
        // console.log(suggestions)

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
    // }
}
