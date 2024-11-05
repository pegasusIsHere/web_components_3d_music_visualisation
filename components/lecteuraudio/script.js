
function loadHTML(baseUrl, htmlRelativeUrl) {
    const htmlUrl = new URL(htmlRelativeUrl, baseUrl).href;
    return fetch(htmlUrl).then((response) => response.text());
}

function getBaseURL() {
    return new URL('.', import.meta.url).href;
}

export class MyAudioPlayer extends HTMLElement {
  
    constructor() {
        super();
        this.shadowroot = this.attachShadow({ mode: 'open' });
        this.src = this.getAttribute('src');
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 256;
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.baseURL = getBaseURL();
    }

    getanalyser(){
      return this.analyser;
    }

    async connectedCallback() {
        let STYLE = `<link rel="stylesheet" href="${this.baseURL + 'style.css'}">`;
        let HTML = await loadHTML(this.baseURL, `/components/lecteuraudio/index.html`);
        
        // Add Babylon canvas
        // HTML += '<canvas id="renderCanvas" style="width: 100%; height: 300px;"></canvas>';
        
        this.shadowroot.innerHTML = `${STYLE}${HTML}`;
        this.defineListeners();
        this.buildAudioGraph();
        // Dispatch the 'analyserReady' event with the analyser as detail
        
        // Wait for user gesture to resume audio context
        document.addEventListener('click', () => this.audioContext.resume());

        // Add a slight delay before dispatching the event
        setTimeout(() => {
            this.dispatchEvent(new CustomEvent("analyserReady", {
                detail: { analyser: this.analyser },
                bubbles: true,
                composed: true
            }));
            console.log("analyserReady event dispatched with analyser:", this.analyser);
        }, 500);  // Adjust delay as needed


        console.log("analyserReady event dispatched with analyser:", this.analyser);

        // this.create3DVisualization();
    }

    static get observedAttributes() {
        return ['src'];
    }

   // Respond to attribute changes
   attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'src' && newValue !== oldValue) {
        const player = this.shadowroot.querySelector('#player');
        
        // Check if the player element exists
        if (player) {
            player.src = newValue;
            player.load(); // Reload audio when src changes
            console.log("src changed to", newValue);
        } else {
            console.warn("Player element not found in shadow DOM");
        }
    }
}



    buildAudioGraph() {
        let player = this.shadowroot.querySelector('#player');
        player.src = this.src;
        let source = this.audioContext.createMediaElementSource(player);

        this.stereoPanner = this.audioContext.createStereoPanner();
        source.connect(this.stereoPanner);
        this.stereoPanner.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.animateBackground();
    }

    defineListeners() {
      let player = this.shadowroot.querySelector('#player');
      this.isPlaying = false; // Nouvel indicateur de lecture
  
      this.shadowroot.querySelector('#play').addEventListener('click', () => {
          player.play();
          this.audioContext.resume();
          this.isPlaying = true; // Activer l'indicateur de lecture
          this.shadowroot.querySelector('#play').disabled = true;
          this.shadowroot.querySelector('#pause').disabled = false;
          this.shadowroot.querySelector('#stop').disabled = false;
      });
  
      this.shadowroot.querySelector('#pause').addEventListener('click', () => {
          player.pause();
          this.isPlaying = false; // Désactiver l'indicateur de lecture
          this.shadowroot.querySelector('#play').disabled = false;
          this.shadowroot.querySelector('#pause').disabled = true;
          this.shadowroot.querySelector('#stop').disabled = false;
      });
  
      this.shadowroot.querySelector('#stop').addEventListener('click', () => {
          player.pause();
          player.currentTime = 0;
          this.isPlaying = false; // Désactiver l'indicateur de lecture
          this.shadowroot.querySelector('#play').disabled = false;
          this.shadowroot.querySelector('#pause').disabled = true;
          this.shadowroot.querySelector('#stop').disabled = true;
      });

      // event pour le changement de volume
        this.shadowroot.querySelector('#volume').addEventListener('change', () => {
            player.volume = this.shadowroot.querySelector('#volume').value;
            // log maximum value of player.volume
            console.log(player.volume);
        });
        // event pour augmenter la vitesse de lecture id composant speedup
        this.shadowroot.querySelector('#speedup').addEventListener('click', () => {
            player.playbackRate += 0.1;
        });
        // event pour diminuer la vitesse de lecture id composant speeddown
        this.shadowroot.querySelector('#speeddown').addEventListener('click', () => {
            player.playbackRate -= 0.1;
        });

        // ecouteur pour la progression de la lecture
        player.addEventListener('timeupdate', () => {
            let progress = this.shadowroot.querySelector('#progress');
            
            // Ensure player.duration is a valid number
            if (!isNaN(player.duration)) {
                progress.value = (player.currentTime / player.duration) * 100;
            }
        });


        // ecouteur pour click sur la progression et positionner la lecture
        this.shadowroot.querySelector('#progress').addEventListener('click', (event) => {
            let progress = this.shadowroot.querySelector('#progress');
            let position = event.offsetX / progress.offsetWidth;
            player.currentTime = position * player.duration;
            });

        // event pour manipuler stereo id stereo
        this.shadowroot.querySelector('#stereo').addEventListener('change', () => {
            this.stereoPanner.pan.value = this.shadowroot.querySelector('#stereo').value;
        });

      // Autres événements restent inchangés
  }
  

    animateBackground() {
        const updateBackground = () => {
            this.analyser.getByteFrequencyData(this.dataArray);

            const average = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
            const hue = (average / 256) * 360;
            const lightness = 50 + (average / 512) * 50;

            this.shadowroot.host.style.backgroundColor = `hsl(${hue}, 100%, ${lightness}%)`;

            requestAnimationFrame(updateBackground);
        };

        updateBackground();
    }

}

// Définir le custom element <my-audio-player>
customElements.define('my-audio-player', MyAudioPlayer);
