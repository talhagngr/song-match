document.getElementById('spotifyLoginButton').addEventListener('click', function() {
    const clientId = '6aaaeb6d3a884d5d94bf46bcdab165e1'; // Replace with your client ID
    const redirectUri = encodeURIComponent('https://talhagngr.github.io/'); // URL encode the redirect URI
    const scopes = 'user-library-read playlist-read-private playlist-read-collaborative'; // Spotify scopes
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&scope=${encodeURIComponent(scopes)}`;

    window.location.href = authUrl;
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
            playlist.tracks = await fetchPlaylistTracks(accessToken, playlist.id);
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
    container.innerHTML = '';

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
        
        // Display tracks for each playlist
        if (playlist.tracks) {
            const tracksContainer = document.createElement('div');
            tracksContainer.className = 'tracks-container';

            playlist.tracks.forEach(track => {
                const trackElement = document.createElement('p');
                trackElement.textContent = track.track.name; // Assuming 'track' has a 'name' property
                tracksContainer.appendChild(trackElement);
            });

            playlistContainer.appendChild(tracksContainer);
        }

        container.appendChild(playlistContainer);
    });
}

function selectPlaylist(playlistId) {
    selectedPlaylists.push(playlistId);
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
    // Implement UI feedback for errors
    console.error(message); // Placeholder for actual UI implementation
}

function getAuthorizationCode() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const authCode = urlParams.get('code');
    if (authCode) {
        console.log("Authorization Code:", authCode);
        exchangeAuthCodeForToken(authCode);
    } else {
        console.log("No authorization code found in URL.");
    }
}

function exchangeAuthCodeForToken(authCode) {
    const clientId = '6aaaeb6d3a884d5d94bf46bcdab165e1'; // Replace with your client ID
    const clientSecret = 'bee9e6ab487d4a3aa70fc310e61fc950'; // Replace with your client secret

    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('code', authCode);
    body.append('redirect_uri', 'https://talhagngr.github.io/');

    const authString = btoa(clientId + ':' + clientSecret); // Base64 encode client ID and secret

    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + authString
        },
        body: body
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok during token exchange');
        }
        return response.json();
    })
    .then(data => {
        console.log('Access Token:', data.access_token);
        return fetchUserPlaylists(data.access_token);
    })
    .catch(error => console.error('Error during token exchange:', error));
}

window.onload = getAuthorizationCode;

// Function to search a track on YouTube
async function searchYouTube(trackName, artistName, youtubeApiKey) {
    const query = encodeURIComponent(`${trackName} ${artistName}`);
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&key=AIzaSyC6P8DieyB9R6dGogTwtky3vS1o0kAm6eU`;

    try {
        const response = await fetch(searchUrl);
        if (!response.ok) {
            throw new Error(`YouTube Search HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        return data.items[0].id.videoId; // Assuming the first result is the desired one
    } catch (error) {
        console.error('Error searching YouTube:', error);
    }
}

// Function to create a playlist on YouTube
async function createYouTubePlaylist(title, description, accessToken) {
    const createPlaylistUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,status`;

    const playlistDetails = {
        snippet: { title, description },
        status: { privacyStatus: 'private' }
    };

    try {
        const response = await fetch(createPlaylistUrl, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                snippet: { title, description },
                status: { privacyStatus: 'private' }
        });

        if (!response.ok) {
            throw new Error(`YouTube Playlist Creation HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Created YouTube Playlist:', data);
        return data.id; // Return the created playlist ID
    } catch (error) {
        console.error('Error creating YouTube playlist:', error);
        displayError('Error creating YouTube playlist');
    }
}

// Function to add a track to a YouTube playlist
async function addTrackToYouTubePlaylist(playlistId, trackId, accessToken) {
    const addToPlaylistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet`;

    const trackDetails = {
        snippet: {
            playlistId,
            resourceId: {
                kind: 'youtube#video',
                videoId: trackId
            }
        }
    };

    try {
        const response = await fetch(addToPlaylistUrl, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                snippet: {
                    playlistId: playlistId,
                    resourceId: {
                        kind: 'youtube#video',
                        videoId: trackVideoId
                    }
                }
        });

        if (!response.ok) {
            throw new Error(`YouTube Add Track HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Added track to YouTube Playlist:', data);
    } catch (error) {
        console.error('Error adding track to YouTube playlist:', error);
        displayError('Error adding track to YouTube playlist');
    }
}

// Example usage (you need to implement the logic to call these functions appropriately)
// searchYouTube('Track Name', 'YouTubeAccessToken').then(trackId => {
//     createYouTubePlaylist('My Playlist', 'Description', 'YouTubeAccessToken').then(playlistId => {
//         addTrackToYouTubePlaylist(playlistId, trackId, 'YouTubeAccessToken');
//     });
// });

window.onload = getAuthorizationCode;
