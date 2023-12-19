document.getElementById('spotifyLoginButton').addEventListener('click', function() {
    var clientId = '6aaaeb6d3a884d5d94bf46bcdab165e1'; // Your client ID
    var redirectUri = encodeURIComponent('https://talhagngr.github.io/song-match/'); // URL encode the redirect URI
    var scopes = 'user-library-read playlist-read-private playlist-read-collaborative'; // Scopes
    var authUrl = 'https://accounts.spotify.com/authorize' +
                  '?client_id=' + clientId +
                  '&response_type=code' +
                  '&redirect_uri=' + redirectUri +
                  '&scope=' + encodeURIComponent(scopes); // URL encode the scopes

    window.location.href = authUrl;
});

let selectedPlaylists = [];

function fetchUserPlaylists(accessToken) {
    return fetch('https://api.spotify.com/v1/me/playlists', {
        headers: { 'Authorization': 'Bearer ' + accessToken }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Playlists fetched successfully', data);
        displayPlaylists(data.items); // Function to display playlists
    })
    .catch(error => console.error('Error fetching playlists:', error));
}

function displayPlaylists(playlists) {
    const container = document.getElementById('playlistContainer');
    container.innerHTML = ''; // Clear existing content

    playlists.forEach(playlist => {
        // Create a container div for each playlist item
        const playlistContainer = document.createElement('div');
        playlistContainer.className = 'playlist-item';

        // Create a checkbox for the playlist
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = playlist.id; // Use a unique identifier for the playlist
        checkbox.addEventListener('change', () => {
            // Handle checkbox change event to track selected playlists
            if (checkbox.checked) {
                selectPlaylist(playlist.id); // Pass the playlist ID to the selectPlaylist function
            } else {
                deselectPlaylist(playlist.id); // Pass the playlist ID to the deselectPlaylist function
            }
        });

        // Create a label for the checkbox with the playlist name
        const label = document.createElement('label');
        label.textContent = playlist.name;

        // Append the checkbox and label to the playlist container
        playlistContainer.appendChild(checkbox);
        playlistContainer.appendChild(label);

        // Append the playlist container to the main container
        container.appendChild(playlistContainer);
    });
}

function selectPlaylist(playlistId) {
    // Add the playlist ID to the selectedPlaylists array
    selectedPlaylists.push(playlistId);
    console.log('Selected Playlists:', selectedPlaylists);
    // Update the UI or add more functionality here
}

function deselectPlaylist(playlistId) {
    // Remove the playlist ID from the selectedPlaylists array
    const index = selectedPlaylists.indexOf(playlistId);
    if (index !== -1) {
        selectedPlaylists.splice(index, 1);
    }
    console.log('Selected Playlists:', selectedPlaylists);
    // Update the UI or add more functionality here
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
    const clientId = '6aaaeb6d3a884d5d94bf46bcdab165e1';
    const clientSecret = 'bee9e6ab487d4a3aa70fc310e61fc950'; // Exposed client secret for personal use

    const body = new URLSearchParams();
    body.append('grant_type', 'authorization_code');
    body.append('code', authCode);
    body.append('redirect_uri', 'https://talhagngr.github.io/song-match/');

    const authString = btoa(clientId + ':' + clientSecret); // Encode credentials in Base64

    fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': 'Basic ' + authString // Use Base64-encoded credentials
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
