// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const moviesContainer = document.getElementById('movies-container');
const messageDiv = document.getElementById('message');
const movieModal = document.getElementById('movie-modal');
const closeModal = document.getElementById('close-modal');
const modalContent = document.getElementById('modal-content');
const filterBtns = document.querySelectorAll('.filter-btn');
const browseTab = document.getElementById('browse-tab');
const favoritesTab = document.getElementById('favorites-tab');
const themeToggle = document.getElementById('theme-toggle');

// OMDb API Configuration
const API_KEY = 'c2e7a709';
const API_BASE_URL = 'https://www.omdbapi.com/';

// Current state
let currentGenre = 'all';
let currentView = 'browse';
let favorites = JSON.parse(localStorage.getItem('movieFavorites')) || [];
let currentTheme = localStorage.getItem('movieAppTheme') || 'light';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded - initializing app');

    // Initialize theme
    initializeTheme();

    // Load initial movies
    loadPopularMovies();

    // Event listeners
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Tab event listeners
    browseTab.addEventListener('click', () => switchView('browse'));
    favoritesTab.addEventListener('click', () => switchView('favorites'));

    // Filter button event listeners
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const genre = btn.dataset.genre;
            console.log('Filter clicked:', genre);

            // Update active button
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Load movies for selected genre
            currentGenre = genre;
            if (genre === 'all') {
                loadPopularMovies();
            } else {
                loadMoviesByGenre(genre);
            }
        });
    });

    closeModal.addEventListener('click', () => {
        movieModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === movieModal) {
            movieModal.style.display = 'none';
        }
    });

    console.log('Event listeners attached');
});

// Theme Functions
function initializeTheme() {
    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀ Light Mode';
    } else {
        document.body.classList.remove('dark-theme');
        themeToggle.textContent = '🌙 Dark Mode';
    }
}

function toggleTheme() {
    if (document.body.classList.contains('dark-theme')) {
        // Switch to light mode
        document.body.classList.remove('dark-theme');
        currentTheme = 'light';
        themeToggle.textContent = '🌙 Dark Mode';
    } else {
        // Switch to dark mode
        document.body.classList.add('dark-theme');
        currentTheme = 'dark';
        themeToggle.textContent = '☀ Light Mode';
    }

    // Save theme preference
    localStorage.setItem('movieAppTheme', currentTheme);
    console.log('Theme changed to:', currentTheme);
}

// Switch between browse and favorites view
function switchView(view) {
    currentView = view;

    // Update active tab
    browseTab.classList.toggle('active', view === 'browse');
    favoritesTab.classList.toggle('active', view === 'favorites');

    // Show/hide search and filters
    const searchContainer = document.querySelector('.search-container');
    const filterContainer = document.querySelector('.filter-container');

    if (view === 'favorites') {
        if (searchContainer) searchContainer.style.display = 'none';
        if (filterContainer) filterContainer.style.display = 'none';
        displayFavorites();
    } else {
        if (searchContainer) searchContainer.style.display = 'flex';
        if (filterContainer) filterContainer.style.display = 'flex';
        if (currentGenre === 'all') {
            loadPopularMovies();
        } else {
            loadMoviesByGenre(currentGenre);
        }
    }
}

// Favorite management functions
function addToFavorites(movie) {
    if (!isInFavorites(movie.imdbID)) {
        favorites.push(movie);
        saveFavorites();
        showMessage(`"${movie.Title}" added to favorites!`, 'success');
        return true;
    }
    return false;
}

function removeFromFavorites(imdbID) {
    favorites = favorites.filter(movie => movie.imdbID !== imdbID);
    saveFavorites();
    showMessage('Movie removed from favorites', 'success');

    // Refresh display if we're in favorites view
    if (currentView === 'favorites') {
        displayFavorites();
    }
}

function isInFavorites(imdbID) {
    return favorites.some(movie => movie.imdbID === imdbID);
}

function saveFavorites() {
    localStorage.setItem('movieFavorites', JSON.stringify(favorites));
}

function displayFavorites() {
    if (favorites.length === 0) {
        moviesContainer.innerHTML = `
            <div class="no-results">
                <h3>No favorites yet!</h3>
                <p>Browse movies and click the heart icon to add them to your favorites.</p>
            </div>
        `;
        clearMessage();
    } else {
        displayMovies(favorites, true);
        showMessage(`Showing ${favorites.length} favorite movies`, 'success');
    }
}

function handleSearch() {
    const query = searchInput.value.trim();
    console.log('Handle search called with query:', query);

    if (query) {
        searchMovies(query);
    } else {
        // If no query, load based on current genre
        if (currentGenre === 'all') {
            loadPopularMovies();
        } else {
            loadMoviesByGenre(currentGenre);
        }
    }
}

function showMessage(text, type = 'info') {
    console.log('Message:', text, 'Type:', type);
    messageDiv.innerHTML = `<div class="${type}">${text}</div>`;

    // Auto-hide success messages after 3 seconds
    if (type === 'success') {
        setTimeout(() => {
            // ensure the same message is still present before clearing
            if (messageDiv.innerHTML.includes(text)) {
                clearMessage();
            }
        }, 3000);
    }
}

function clearMessage() {
    messageDiv.innerHTML = '';
}

function showLoading() {
    console.log('Showing loading state');
    moviesContainer.innerHTML = `
        <div class="loader">
            <div class="spinner"></div>
            <p>Loading movies...</p>
        </div>
    `;
}

// Load movies by genre
async function loadMoviesByGenre(genre) {
    console.log('Loading movies for genre:', genre);
    showLoading();
    clearMessage();

    try {
        const searchUrl = `${API_BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(genre)}&type=movie`;
        console.log('Fetching URL:', searchUrl);

        const response = await fetch(searchUrl);
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (data.Response === "True" && Array.isArray(data.Search)) {
            console.log('Movies found:', data.Search.length);
            // Get details for first 9 movies
            const moviePromises = data.Search.slice(0, 9).map(movie =>
                getMovieDetails(movie.imdbID)
            );
            const movieDetails = await Promise.all(moviePromises);
            const validMovies = movieDetails.filter(movie => movie !== null);
            console.log('Valid movie details:', validMovies.length);

            displayMovies(validMovies);
            showMessage(`Loaded ${validMovies.length} ${genre} movies`, 'success');
        } else {
            throw new Error(data.Error || `No ${genre} movies found`);
        }

    } catch (error) {
        console.error('Error loading genre movies:', error);
        showMessage(`Failed to load ${genre} movies: ${error.message}`, 'error');
        useSampleDataByGenre(genre);
    }
}

// Load popular movies (mixed genres)
async function loadPopularMovies() {
    console.log('Loading popular movies');
    showLoading();
    clearMessage();

    try {
        // Search for a mix of popular terms
        const popularTerms = ['movie', '2023', 'popular', 'best'];
        const randomTerm = popularTerms[Math.floor(Math.random() * popularTerms.length)];

        const searchUrl = `${API_BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(randomTerm)}&type=movie`;
        console.log('Fetching URL:', searchUrl);

        const response = await fetch(searchUrl);
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);

        if (data.Response === "True" && Array.isArray(data.Search)) {
            console.log('Movies found:', data.Search.length);
            // Get details for first 9 movies
            const moviePromises = data.Search.slice(0, 9).map(movie =>
                getMovieDetails(movie.imdbID)
            );
            const movieDetails = await Promise.all(moviePromises);
            const validMovies = movieDetails.filter(movie => movie !== null);
            console.log('Valid movie details:', validMovies.length);

            displayMovies(validMovies);
            showMessage(`Loaded ${validMovies.length} popular movies`, 'success');
        } else {
            throw new Error(data.Error || 'No popular movies found');
        }

    } catch (error) {
        console.error('Error in loadPopularMovies:', error);
        showMessage(`Failed to load movies: ${error.message}`, 'error');
        useSampleData();
    }
}

// Search movies
async function searchMovies(query) {
    console.log('Searching for:', query);
    showLoading();
    clearMessage();

    try {
        const searchUrl = `${API_BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=movie`;
        console.log('Search URL:', searchUrl);

        const response = await fetch(searchUrl);
        console.log('Search response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Search response:', data);

        if (data.Response === "True" && Array.isArray(data.Search)) {
            console.log('Search results:', data.Search.length);
            const moviePromises = data.Search.map(movie => getMovieDetails(movie.imdbID));
            const movieDetails = await Promise.all(moviePromises);
            const validMovies = movieDetails.filter(movie => movie !== null);

            if (validMovies.length > 0) {
                displayMovies(validMovies);
                showMessage(`Found ${validMovies.length} movies for "${query}"`, 'success');
            } else {
                throw new Error('No valid movie details found');
            }
        } else {
            showMessage(`No movies found for "${query}"`, 'error');
            moviesContainer.innerHTML = '<div class="no-results">No movies found. Try a different search term.</div>';
        }

    } catch (error) {
        console.error('Error in searchMovies:', error);
        showMessage(`Search failed: ${error.message}`, 'error');
        searchInSampleData(query);
    }
}

// Get movie details
async function getMovieDetails(imdbID) {
    try {
        console.log('Getting details for:', imdbID);
        const detailsUrl = `${API_BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=short`;
        const response = await fetch(detailsUrl);
        if (!response.ok) {
            console.warn('Details fetch failed for', imdbID, 'status', response.status);
            return null;
        }
        const data = await response.json();

        if (data.Response === "True") {
            console.log('Movie details loaded:', data.Title);
            return data;
        } else {
            console.warn('OMDb returned false for', imdbID, data.Error);
        }
    } catch (error) {
        console.error('Error getting movie details:', error);
    }
    return null;
}

// Display movies (with favorite buttons)
function displayMovies(movies, isFavoritesView = false) {
    console.log('Displaying movies:', movies.length);
    moviesContainer.innerHTML = '';

    if (!movies || movies.length === 0) {
        moviesContainer.innerHTML = '<div class="no-results">No movies found. Try a different search.</div>';
        return;
    }

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';

        const title = movie.Title || 'Unknown Title';
        const year = movie.Year || 'Unknown';
        const rating = movie.imdbRating || 'N/A';
        const poster = movie.Poster && movie.Poster !== 'N/A'
            ? movie.Poster
            : `https://via.placeholder.com/500x750/2a2f36/ffffff?text=${encodeURIComponent(title)}`;
        const overview = movie.Plot || 'No description available.';
        const isFavorited = isInFavorites(movie.imdbID);

        movieCard.innerHTML = `
            <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" 
                    data-imdbid="${movie.imdbID}">
                ${isFavorited ? '❤' : '🤍'}
            </button>
            <img src="${poster}" alt="${title}" class="movie-poster" 
                 onerror="this.src='https://via.placeholder.com/500x750/2a2f36/ffffff?text=No+Image'">
            <div class="movie-info">
                <h3 class="movie-title">${title}</h3>
                <p class="movie-year">${year}</p>
                <div class="movie-rating">
                    <span class="star">★</span>
                    <span>${rating}</span>
                </div>
            </div>
        `;

        // Favorite button event
        const favoriteBtn = movieCard.querySelector('.favorite-btn');
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering movie card click

            if (isFavoritesView) {
                // Remove from favorites
                removeFromFavorites(movie.imdbID);
            } else {
                // Toggle favorite
                if (isInFavorites(movie.imdbID)) {
                    removeFromFavorites(movie.imdbID);
                    favoriteBtn.classList.remove('favorited');
                    favoriteBtn.innerHTML = '🤍';
                } else {
                    if (addToFavorites(movie)) {
                        favoriteBtn.classList.add('favorited');
                        favoriteBtn.innerHTML = '❤';
                    }
                }
            }
        });

        // Movie card click (show details)
        movieCard.addEventListener('click', () => {
            console.log('Movie card clicked:', title);
            showMovieDetails(movie, isFavoritesView);
        });

        moviesContainer.appendChild(movieCard);
    });
}

function showMovieDetails(movie, isFavoritesView = false) {
    const isFavorited = isInFavorites(movie.imdbID);
    const title = movie.Title || 'Unknown Title';
    const year = movie.Year || 'Unknown';
    const rating = movie.imdbRating || 'N/A';
    const poster = movie.Poster && movie.Poster !== 'N/A'
        ? movie.Poster
        : `https://via.placeholder.com/500x750/2a2f36/ffffff?text=${encodeURIComponent(title)}`;
    const overview = movie.Plot || 'No description available.';

    modalContent.innerHTML = `
        <img src="${poster}" alt="${title}" class="modal-poster"
             onerror="this.src='https://via.placeholder.com/800x450/2a2f36/ffffff?text=No+Image'">
        <div class="modal-info">
            <h2 class="modal-title">${title}</h2>
            <div class="modal-details">
                <div class="detail-item">${year}</div>
                <div class="detail-item">${movie.Runtime || 'N/A'}</div>
                <div class="detail-item">${movie.Rated || 'N/A'}</div>
                <div class="modal-rating detail-item">
                    <span class="star">★</span>
                    <span>${rating}</span>
                </div>
            </div>
            <div class="modal-details">
                <div class="detail-item"><strong>Genre:</strong> ${movie.Genre || 'Unknown'}</div>
                <div class="detail-item"><strong>Director:</strong> ${movie.Director || 'Unknown'}</div>
            </div>
            <div class="modal-details">
                <div class="detail-item"><strong>Cast:</strong> ${movie.Actors || 'Unknown'}</div>
            </div>
            <p class="modal-overview">${overview}</p>
            <button class="modal-favorite-btn ${isFavorited ? 'favorited' : ''}" 
                    id="modal-favorite-btn" data-imdbid="${movie.imdbID}">
                ${isFavorited ? '❤ Remove from Favorites' : '🤍 Add to Favorites'}
            </button>
        </div>
    `;

    // Modal favorite button event
    const modalFavoriteBtn = document.getElementById('modal-favorite-btn');
    modalFavoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentlyFavorited = isInFavorites(movie.imdbID);
        if (currentlyFavorited) {
            removeFromFavorites(movie.imdbID);
            modalFavoriteBtn.classList.remove('favorited');
            modalFavoriteBtn.innerHTML = '🤍 Add to Favorites';
            // Also update the card button if it exists
            const cardBtn = document.querySelector(`.favorite-btn[data-imdbid="${movie.imdbID}"]`);
            if (cardBtn) {
                cardBtn.classList.remove('favorited');
                cardBtn.innerHTML = '🤍';
            }
        } else {
            if (addToFavorites(movie)) {
                modalFavoriteBtn.classList.add('favorited');
                modalFavoriteBtn.innerHTML = '❤ Remove from Favorites';
                // Also update the card button if it exists
                const cardBtn = document.querySelector(`.favorite-btn[data-imdbid="${movie.imdbID}"]`);
                if (cardBtn) {
                    cardBtn.classList.add('favorited');
                    cardBtn.innerHTML = '❤';
                }
            }
        }
    });

    movieModal.style.display = 'block';
}

// Fallback functions with genre-specific sample data
function useSampleDataByGenre(genre) {
    console.log('Using genre sample data for:', genre);
    const genreMovies = sampleMovies.filter(movie =>
        movie.Genre && movie.Genre.toLowerCase().includes(genre.toLowerCase())
    );

    if (genreMovies.length > 0) {
        displayMovies(genreMovies);
        showMessage(`Showing sample ${genre} movies`, 'info');
    } else {
        useSampleData();
    }
}

function searchInSampleData(query) {
    console.log('Using sample data for search:', query);
    const filteredMovies = sampleMovies.filter(movie =>
        movie.Title.toLowerCase().includes(query.toLowerCase())
    );
    if (filteredMovies.length === 0) {
        showMessage(`No movies found for "${query}" in sample data`, 'error');
        moviesContainer.innerHTML = '<div class="no-results">No movies found. Try a different search term.</div>';
    } else {
        displayMovies(filteredMovies);
        showMessage(`Showing sample results for "${query}"`, 'info');
    }
}

function useSampleData() {
    console.log('Using sample data');
    displayMovies(sampleMovies);
    showMessage('Using sample data. OMDb API might be unavailable.', 'info');
}

// Enhanced sample data with genres
const sampleMovies = [
    {
        imdbID: "tt0133093",
        Title: "The Matrix",
        Year: "1999",
        imdbRating: "8.7",
        Poster: "https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg",
        Plot: "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
        Genre: "Action, Sci-Fi",
        Runtime: "136 min",
        Director: "Lana Wachowski, Lilly Wachowski",
        Actors: "Keanu Reeves, Laurence Fishburne, Carrie-Anne Moss",
        Rated: "R"
    },
    {
        imdbID: "tt1119646",
        Title: "The Hangover",
        Year: "2009",
        imdbRating: "7.7",
        Poster: "https://m.media-amazon.com/images/M/MV5BNGQwZjg5YmYtY2VkNC00NzliLTljYTctNzI5NmU3MjE2ODQzXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg",
        Plot: "Three buddies wake up from a bachelor party in Las Vegas, with no memory of the previous night and the bachelor missing.",
        Genre: "Comedy",
        Runtime: "100 min",
        Director: "Todd Phillips",
        Actors: "Zach Galifianaki"
    }
];
