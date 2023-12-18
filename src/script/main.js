
async function getArtistTopTracks(artistName) {
    const clientId = '919cfbaf33894baa863a4da0d8abfc4d'; 
    const clientSecret = 'c37e2b9278544440bd3a5cb9bef52837'; 

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + btoa(clientId + ':' + clientSecret),
        },
        body: 'grant_type=client_credentials',
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const searchResponse = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`, {
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        },
    });

    const searchData = await searchResponse.json();
    const artistId = searchData.artists.items[0].id;

    const topTracksResponse = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        },
    });

    const topTracksData = await topTracksResponse.json();
    const topTracks = topTracksData.tracks;

    return topTracks.map(track => track.name);
}

document.addEventListener("keydown", function(event){
    if (event.key === "Enter") {
        var artistName = document.getElementById('artist-name').value;

        getArtistTopTracks(artistName)
            .then(recommendedTracks => {
                // const tracksList = document.getElementById('tracks-list');
                // recommendedTracks.forEach((track, index) => {
                //     const listItem = document.createElement('li');
                //     listItem.textContent = `${index + 1}. ${track}`;
                //     tracksList.appendChild(listItem);
                // });
                console.log(recommendedTracks);
            })
            .catch(error => console.error('Erro:', error));
    }
});

