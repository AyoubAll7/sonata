class MusicFinder {
    constructor() {
        this.API_KEY = '98e973b204f72de3dd6c25176c8083db'; // Inscrivez-vous sur https://audd.io/
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;

        this.searchButton = document.getElementById('searchButton');
        this.loader = document.getElementById('loader');
        this.result = document.getElementById('result');
        this.resultContainer = document.getElementById('resultContainer');

        this.initializeEvents();
    }

    async initializeRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.mediaRecorder = new MediaRecorder(stream);

            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };

            this.mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                await this.identifyMusic(audioBlob);
            };

            return true;
        } catch (error) {
            console.error('Erreur d\'initialisation du microphone:', error);
            alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
            return false;
        }
    }

    async identifyMusic(audioBlob) {
        this.loader.style.display = 'block';
        this.result.style.display = 'none';

        const formData = new FormData();
        formData.append('file', audioBlob);
        formData.append('api_token', this.API_KEY);
        formData.append('return', 'spotify,apple_music');

        try {
            const response = await fetch('https://api.audd.io/', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.result) {
                this.showResult({
                    title: data.result.title,
                    artist: data.result.artist,
                    image: data.result.spotify?.album?.images[0]?.url || 'default-album.png',
                    url: data.result.spotify?.external_urls?.spotify || '#',
                    album: data.result.album,
                    releaseDate: data.result.release_date
                });
            } else {
                this.showError("Musique non trouvée. Essayez encore.");
            }
        } catch (error) {
            console.error('Erreur lors de l\'appel API:', error);
            this.showError("Erreur lors de l'identification. Réessayez.");
        }
    }

    startRecording() {
        this.audioChunks = [];
        this.mediaRecorder.start();
        this.isRecording = true;
        this.searchButton.querySelector('.status-text').textContent = 'Écoute en cours...';
        this.searchButton.classList.add('recording');

        // Arrêter automatiquement après 5 secondes
        setTimeout(() => {
            if (this.isRecording) {
                this.stopRecording();
            }
        }, 5000);
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.searchButton.querySelector('.status-text').textContent = 'Appuyez pour écouter';
            this.searchButton.classList.remove('recording');
        }
    }

    showResult(song) {
        this.loader.style.display = 'none';
        this.result.style.display = 'block';

        document.getElementById('songImage').src = song.image;
        document.getElementById('songTitle').textContent = song.title;
        document.getElementById('songArtist').textContent = song.artist;
        document.getElementById('listenButton').href = song.url;

        // Ajouter des informations supplémentaires
        const additionalInfo = document.createElement('div');
        additionalInfo.className = 'additional-info';
        additionalInfo.innerHTML = `
            <p>Album: ${song.album}</p>
            <p>Date de sortie: ${song.releaseDate}</p>
        `;
        this.result.appendChild(additionalInfo);
    }

    showError(message) {
        this.loader.style.display = 'none';
        this.result.style.display = 'block';
        this.result.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Réessayer
                </button>
            </div>
        `;
    }

    initializeEvents() {
        this.searchButton.addEventListener('click', async () => {
            if (!this.isRecording) {
                const initialized = await this.initializeRecording();
                if (initialized) {
                    this.startRecording();
                    this.resultContainer.style.display = 'block';
                } else {
                    alert('Impossible d\'accéder au microphone');
                }
            } else {
                this.stopRecording();
            }
        });
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    new MusicFinder();
});

// Gestion des boutons supplémentaires
document.getElementById('playButton').addEventListener('click', function () {
    alert('Lecture de la musique');
});

document.getElementById('shareButton').addEventListener('click', function () {
    const songTitle = document.getElementById('songTitle').textContent;
    const artistName = document.getElementById('songArtist').textContent;
    if (navigator.share) {
        navigator.share({
            title: songTitle,
            text: `Écoute ${songTitle} par ${artistName}`,
            url: window.location.href
        }).catch(console.error);
    } else {
        alert('Partage non supporté sur ce navigateur');
    }
});
