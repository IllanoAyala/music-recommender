async function getRecommendedTracks(artistName) {
    const clientId = 'e1a59126035044f9a966bbfb65d83d5b';
    const clientSecret = 'ebf4f3aa64814e3b9e7c95efb1189edf';

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

    const recommendationsResponse = await fetch(`https://api.spotify.com/v1/recommendations?seed_artists=${artistId}&limit=5`, {
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



let timeWriting;
const interval = 500;

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
            containerTracks.textContent = 'Fiz isso aqui para você. Gosto de você. (Tudo bem se não achar tão legal)';
            containerTracks.classList.add('iluvu');
        }

        else{

            try {

                const recommendedTracks = await getRecommendedTracks(artistName);
                const containerTracks = document.getElementById("container-tracks");
                
                containerTracks.textContent = '';
                containerTracks.classList.remove('iluvu')
    
                recommendedTracks.forEach((track, index) => {
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://open.spotify.com/embed/track/${(track.uri).replace("spotify:track:", "")}?utm_source=generator`; 
                    iframe.width = '100%';
                    iframe.height = '90';
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
        }
    }, interval);
});


let selectedTracksSet = new Set();

document.getElementById('reload-btn').addEventListener('click', async function () {
    var artistName = document.getElementById('artist-name').value;

    try {
        let recommendedTracks = await getRecommendedTracks(artistName);

        recommendedTracks = recommendedTracks.filter(track => !selectedTracksSet.has(track.name));

        const containerTracks = document.getElementById("container-tracks");
        const iframes = document.querySelectorAll("iframe");

        for (let index = 0; index < iframes.length; index++) {
            containerTracks.removeChild(iframes[index]);
            
        }

        recommendedTracks.forEach((track, index) => {
            const iframe = document.createElement('iframe');
            iframe.src = `https://open.spotify.com/embed/track/${(track.uri).replace("spotify:track:", "")}?utm_source=generator`;
            iframe.width = '100%';
            iframe.height = '90';
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

