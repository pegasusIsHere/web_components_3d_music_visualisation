
function loadHTML(baseUrl, htmlRelativeUrl) {
    const htmlUrl = new URL(htmlRelativeUrl, baseUrl).href;
    return fetch(htmlUrl).then((response) => response.text());
}

function getBaseURL() {
    return new URL('.', import.meta.url).href;
}

export class PlayList extends HTMLElement {
  
    constructor() {
        super();
        this.shadowroot = this.attachShadow({ mode: 'open' });
        this.playlist = [];
        this.audioPlayer = document.querySelector('my-audio-player'); // Référence au lecteur audio
        this.baseURL = getBaseURL();
    }

 

    async connectedCallback() {
        let STYLE = `<link rel="stylesheet" href="${this.baseURL + 'style.css'}">`;
        let HTML = await loadHTML(this.baseURL, `index.html`);
        this.shadowroot.innerHTML = `${STYLE}${HTML}`;

        await this.loadPlaylist();
        this.render();

    }


    async loadPlaylist() {
        const response = await fetch(this.baseURL +'playlist.json');
        this.playlist = await response.json();
        console.log("playlist",this.playlist)
    }

    render() {
        this.shadowroot.innerHTML = `
            <ul>
                ${this.playlist.map((track, index) => `
                    <li>
                        <button id="id-${index}" class="play-track" data-index="${index}">${track.title}</button>
                    </li>
                `).join('')}
            </ul>
        `;
        this.defineListeners()
       }


    defineListeners() {

       this.shadowroot.querySelectorAll('.play-track').forEach(button => {
            console.log("button",button)
            button.addEventListener('click', (event) => {
                const trackIndex = event.currentTarget.dataset.index;
                this.playTrack(trackIndex);
            });
        });
    }

    playTrack(index) {
        const track = this.playlist[index];
        if (track && this.audioPlayer) {
            this.audioPlayer.setAttribute('src', this.baseURL+track.src);
            this.audioPlayer.shadowroot.querySelector('#player').play();
            console.log("music player",this.baseURL+track.src)
        }
    }



}

// Définir le custom element <my-audio-player>
customElements.define('play-list', PlayList);
