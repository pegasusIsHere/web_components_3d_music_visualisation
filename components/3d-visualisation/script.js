function loadHTML(baseUrl, htmlRelativeUrl) {
    const htmlUrl = new URL(htmlRelativeUrl, baseUrl).href;
    return fetch(htmlUrl).then((response) => response.text());
}

function getBaseURL() {
    return new URL('.', import.meta.url).href;
}

class Visualisation3d extends HTMLElement {
    constructor() {
        super();
        // Attaching shadow root without assigning it directly
        this.attachShadow({ mode: 'open' });
        this.baseURL = getBaseURL();
        
    }
    
    async connectedCallback() {
        const STYLE = `<link rel="stylesheet" href="${this.baseURL + 'style.css'}">`;
        const HTML = await loadHTML(this.baseURL, 'index.html');
        // console.log(loadHTML())
        // Insert HTML and Canvas into Shadow DOM
        this.shadowRoot.innerHTML = `${STYLE}${HTML}`;
        this.animationGroup = null; // To store the animation group of the model
        this.mytag = "ayoubhofr"
        
        // Ensure #render element exists
        this.canvas = this.shadowRoot.querySelector('#render');
        if (!this.canvas) {
            console.error("Canvas element with ID 'render' not found in the loaded HTML.");
            return;
        }

        // Listen for the 'analyserReady' event
        document.addEventListener('analyserReady', (event) => {
            console.log("recieve from function",this.getAnalyser())
            console.log("Received analyserReady event:", event);
            this.analyser = event.detail.analyser;
            console.log("Analyser set in Visualisation3d:", this.analyser);
        });

        // Dispatch a custom event to indicate the component is ready
        // this.dispatchEvent(new CustomEvent("ready", { bubbles: true, composed: true }));

        // Initialize the Babylon scene
        this.create3DVisualization();

    }

    // import animted model
    async importModels(scene,camera) {
        const modelPath = new URL('models/dancer.glb', this.baseURL).href;
        BABYLON.SceneLoader.ImportMesh("", modelPath, "", scene,  (newMeshes, particleSystems, skeletons, animationGroups) =>    {
            // Set the target of the camera to the first imported mesh
            newMeshes[0].position = new BABYLON.Vector3(0, 0, 0);
            // newMeshes[0].scaling = new BABYLON.Vector3(5,5,5);
            camera.target = newMeshes[0];
            // Store the animation group for controlling animations
            this.animationGroup = animationGroups[0];

            if (this.animationGroup) {
                this.animationGroup.stop(); // Stop animation immediately after loading
            }
        });
    }
    toggleAnimation(playing) {
        if (this.animationGroup) {
            if (playing) {
                this.animationGroup.start(true); // Resume animation
            } else {
                this.animationGroup.stop(); // Pause animation
            }
        }
    }

    create3DVisualization() {
        const engine = new BABYLON.Engine(this.canvas, true);
        const scene = new BABYLON.Scene(engine);

        // Set up camera
        const camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 4, 20, new BABYLON.Vector3(0, 0, 0), scene);
        camera.attachControl(this.canvas, true);

        // Lighting
        const hemiLight = new BABYLON.HemisphericLight("HemiLight", new BABYLON.Vector3(0, 1, 0), scene);
        hemiLight.intensity = 0.5;

        // Ground
        const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 20 }, scene);

        // Visualization Boxes in a Circle
        const numBoxes = 30;
        const boxes = [];
        for (let i = 0; i < numBoxes; i++) {
            const box = BABYLON.MeshBuilder.CreateBox("box", { height: 1, width: 0.3, depth: 0.3 }, scene);
            box.position = new BABYLON.Vector3(
                Math.cos((i / numBoxes) * 2 * Math.PI) * 6,
                0.5,
                Math.sin((i / numBoxes) * 2 * Math.PI) * 6
            );
            const material = new BABYLON.StandardMaterial("boxMat", scene);
            material.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
            box.material = material;
            boxes.push(box);
        }

        scene.metadata = { boxes };

        // Rotation animation for the camera
        scene.onBeforeRenderObservable.add(() => {
            camera.alpha += 0.01;
        });

        // Run the render loop
        this.importModels(scene,camera)
        engine.runRenderLoop(() => {
            scene.render();
            if (this.analyser)
                this.updateVisualization(scene);

        });

    }

    updateVisualization(scene) {
        // const analyser = this.getAnalyser();
        const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(dataArray);

        const boxes = scene.metadata.boxes;
        boxes.forEach((box, index) => {
            const scale = Math.max(dataArray[index] / 128, 0.1);
            box.scaling.y = scale;
            box.position.y = scale / 2;

            const intensity = scale / 2;
            box.material.diffuseColor = new BABYLON.Color3(0.5 + intensity, 0.3, 1 - intensity);
        });
        if(dataArray[0]>0)
            this.toggleAnimation(true)
        else
            this.toggleAnimation(false)

    }

    getAnalyser() {
        // Assuming `MyAudioPlayer` contains the analyser setup
        return this.shadowRoot.querySelector('my-audio-player')?.getanalyser();
    }
}

// Define the custom element <visualisation-3d>
customElements.define('visualisation-3d', Visualisation3d);
