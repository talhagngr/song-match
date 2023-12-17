document.getElementById('spotifyLoginButton').addEventListener('click', function() {
    const clientId = '6aaaeb6d3a884d5d94bf46bcdab165e1'; // Replace with your actual client ID
    const redirectUri = encodeURIComponent('https://talhagngr.github.io/song-match/'); // Make sure this matches the redirect URI in your Spotify app settings
    const scopes = 'user-library-read playlist-read-private playlist-read-collaborative'; // Required Spotify scopes
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scopes)}`;

    window.location.href = authUrl; // Redirects to Spotify's authorization page
});

let selectedPlaylists = [];

async function fetchUserPlaylists(accessToken) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me/playlists', {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Playlists fetched successfully', data);
        for (const playlist of data.items) {
            playlist.tracks = await fetchPlaylistTracks(accessToken, playlist.id); // Fetch tracks for each playlist
        }
        displayPlaylists(data.items);
    } catch (error) {
        console.error('Error fetching playlists:', error);
        displayError('Error fetching playlists');
    }
}

async function fetchPlaylistTracks(accessToken, playlistId) {
    try {
        const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            headers: { 'Authorization': 'Bearer ' + accessToken }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const tracksData = await response.json();
        console.log('Tracks fetched successfully for playlist ID:', playlistId, tracksData);
        return tracksData.items; // Return the tracks
    } catch (error) {
        console.error(`Error fetching tracks for playlist ${playlistId}:`, error);
        displayError(`Error fetching tracks for playlist ${playlistId}`);
    }
}

function displayPlaylists(playlists) {
    const container = document.getElementById('playlistContainer');
    if (!container) {
        console.error('Playlist container not found');
        return;
    }
    container.innerHTML = ''; // Clear existing content

    playlists.forEach(playlist => {
        const playlistContainer = document.createElement('div');
        playlistContainer.className = 'playlist-item';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = playlist.id;
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectPlaylist(playlist.id);
            } else {
                deselectPlaylist(playlist.id);
            }
        });

        const label = document.createElement('label');
        label.textContent = playlist.name;

        playlistContainer.appendChild(checkbox);
        playlistContainer.appendChild(label);
        
        if (playlist.tracks && playlist.tracks.length > 0) {
            const tracksContainer = document.createElement('div');
            tracksContainer.className = 'tracks-container';

            playlist.tracks.forEach(track => {
                const trackElement = document.createElement('p');
                trackElement.textContent = track.track.name; // Display track name
                tracksContainer.appendChild(trackElement);
            });

            playlistContainer.appendChild(tracksContainer);
        }

        container.appendChild(playlistContainer);
    });
}

function selectPlaylist(playlistId) {
    if (!selectedPlaylists.includes(playlistId)) {
        selectedPlaylists.push(playlistId);
    }
    console.log('Selected Playlists:', selectedPlaylists);
}

function deselectPlaylist(playlistId) {
    const index = selectedPlaylists.indexOf(playlistId);
    if (index !== -1) {
        selectedPlaylists.splice(index, 1);
    }
    console.log('Selected Playlists:', selectedPlaylists);
}

function displayError(message) {
    console.error(message); // Implement UI feedback for errors
}

async function getAuthorizationCode() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const authCode = urlParams.get('code');
    if (authCode) {
        console.log("Authorization Code:", authCode);
        await exchangeAuthCodeForToken(authCode); // Await the token exchange
    } else {
        console.log("No authorization code found in URL.");
    }
}

async function exchangeAuthCodeForToken(authCode) {
    const clientId = '6aaaeb6d3a884d5d94bf46bcdab165e1'; // Replace with your actual client ID
    const clientSecret = 'bee9e6ab487d4a3aa70fc310e61fc950'; // Replace with your actual client secret

    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('code', authCode);
    body.append('redirect_uri', encodeURIComponent('https://talhagngr.github.io/song-match/'));

    const authString = btoa(clientId + ':' + clientSecret);

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + authString
            },
            body: body
        });

        if (!response.ok) {
            throw new Error('Network response was not ok during token exchange');
        }

        const data = await response.json();
        console.log('Access Token:', data.access_token);
        fetchUserPlaylists(data.access_token); // Fetch playlists using the access token
    } catch (error) {
        console.error('Error during token exchange:', error);
    }
}

window.onload = getAuthorizationCode; // Ensure this function is called when the page loads
