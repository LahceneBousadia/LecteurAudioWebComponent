import './lib/webaudio-controls.js';

const getBaseURL = () => {
  return new URL('.',
    import.meta.url);
};

class myComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({
      mode: 'open'
    });
    this.src = this.getAttribute('src');

    // pour faire du WebAudio
    this.ctx = new AudioContext();
  }

  connectedCallback() {
    // Do something
    this.shadowRoot.innerHTML = `
      <canvas id="myCanvas"></canvas>
      <br>
      <audio id="player" src="${this.src}" controls crossorigin="anonymous"></audio>
      <br>
      
      <webaudio-knob 
        id="stop" 
        src="./assets/knobs/stop.png" 
        value="0" max="2" step="0.1" diameter="128" 
        valuetip="0" tooltip="Stop">
      </webaudio-knob>

      <webaudio-knob 
          id="volume" 
          src="./assets/knobs/volume.png" 
          value="1" max="2" step="0.1" diameter="128" 
          valuetip="0" tooltip="Volume: %s">
      </webaudio-knob>
        
      <webaudio-knob 
        id="pause" 
        src="./assets/knobs/pause.png" 
        value="0" max="2" step="0.1" diameter="128" 
        valuetip="0" tooltip="Pause">
      </webaudio-knob>
        
      </webaudio-knob>
        <webaudio-knob id="play" src="./assets/knobs/play.png" 
        value="0" type="kick" diameter="128"
        valuetip="0" tooltip="Play">
      </webaudio-knob>
      
      <webaudio-switch 
        id="reculer" 
        src="./assets/knobs/reculer.png" 
        value="0" type="kick" diameter="128" 
        valuetip="0" tooltip="Reculer avec 10sec">
      </webaudio-switch>

      <webaudio-switch 
        id="avancee" 
        src="./assets/knobs/avancee.png" 
        value="0" type="kick" diameter="128" 
        valuetip="0" tooltip="Avancée 10sec">
      </webaudio-switch>

      <webaudio-knob 
        id="balance" 
        src="./assets/knobs/balance.png" 
        value="0" min="-1" max="1" step="0.1" diameter="128"
        valuetip="0" tooltip="Balance">
      </webaudio-knob>

    `;

    this.fixRelativeURLs();

    this.player = this.shadowRoot.querySelector('#player');



    this.buildGraph();

    // pour dessiner/animer
    this.canvas = this.shadowRoot.querySelector('#myCanvas');
    this.canvasCtx = this.canvas.getContext('2d');

    this.player.onplay = () => {
      // pour démarrer webaudio lors d'un click...
      console.log("play");
      this.ctx.resume();
    }

    this.defineListeners();

    // on démarre l'animation
    requestAnimationFrame(() => {
      this.animation();
    });
    
  }

  animation() {
    // 1 - on efface le canvas
    this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 2 - je dessine la waveform
    this.canvasCtx.fillRect(10 + Math.random() * 10, 10, 20, 20);

    // 3 - on rappelle la fonction dans 1/60ème de seconde
    requestAnimationFrame(() => {
      this.animation();
    });
  }

  buildGraph() {
    let source = this.ctx.createMediaElementSource(this.player);
    source.connect(this.ctx.destination);
    this.gainNode
  }

  fixRelativeURLs() {
    const baseURL = getBaseURL();
    console.log('baseURL', baseURL);

    const knobs = this.shadowRoot.querySelectorAll('webaudio-knob');
    const switchs = this.shadowRoot.querySelectorAll('webaudio-switch');
    const sliders = this.shadowRoot.querySelectorAll('webaudio-slider');

    for (const s of switchs) {
      console.log("switchs" + s.getAttribute('src'));

      const src = s.src;
      s.src = baseURL + src;

      console.log("new value : " + s.src);
    }
    for (const knob of knobs) {
      console.log("fixing " + knob.getAttribute('src'));

      const src = knob.src;
      knob.src = baseURL + src;

      console.log("new value : " + knob.src);
    }
    for (const slider of sliders) {
      console.log("fixing " + slider.getAttribute('src'));

      const src = slider.src;
      slider.src = baseURL + src;

      console.log("new value : " + slider.src);
    }
  }

  defineListeners() {
    this.shadowRoot.querySelector('#play').addEventListener('click', () => {
      this.player.play();
    });

    this.shadowRoot.querySelector('#pause').addEventListener('click', () => {
      this.player.pause();
    });
    this.shadowRoot.querySelector('#stop').addEventListener('click', () => {
      this.player.pause();
      this.player.currentTime = 0;
    });
    this.shadowRoot.querySelector('#volume').addEventListener('input', (evt) => {
      this.player.volume = evt.target.value;
    });

    this.shadowRoot.querySelector('#avancee').addEventListener('click', (evt) => {
      this.player.currentTime += 10;
    });
    this.shadowRoot.querySelector('#reculer').addEventListener('click', (evt) => {
      this.player.currentTime -= 10;
    });
    this.shadowRoot.querySelector('#balance').addEventListener('input', (evt) => {
      this.player.balance = evt.target.value;
    }
    );
  }
}

customElements.define("my-audio", myComponent);

// This line is a trick to initialize the AudioContext
// that will work on all recent browsers
var audioCtx = window.AudioContext || window.webkitAudioContext;
var audioContext, canvasContext;

var filters = [];

var analyser;
var width, height;
var dataArray, bufferLength;

window.onload = function() {
  audioContext= new audioCtx();
  
  canvas = document.querySelector("#myCanvas");
  width = canvas.width;
  height = canvas.height;
  canvasContext = canvas.getContext("2d");  
  buildAudioGraph();
  
  requestAnimationFrame(visualize);
};

function buildAudioGraph() {
  var mediaElement = document.getElementById('player');
    mediaElement.onplay = (e)=>{audioContext.resume();}

    // fix for autoplay policy
  mediaElement.addEventListener('play',() => audioContext.resume());

  var sourceNode =   audioContext.createMediaElementSource(mediaElement);
  
  // Create an analyser node
  analyser = audioContext.createAnalyser();
  
  // Try changing for lower values: 512, 256, 128, 64...
  analyser.fftSize = 1024;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);
  
  
  // create the equalizer. It's a set of biquad Filters


    // Set filters
    [60, 170, 350, 1000, 3500, 10000].forEach(function(freq, i) {
      var eq = audioContext.createBiquadFilter();
      eq.frequency.value = freq;
      eq.type = "peaking";
      eq.gain.value = 0;
      filters.push(eq);
    });

   // Connect filters in serie
   sourceNode.connect(filters[0]);
   for(var i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i+1]);
    }

   // connect the last filter to the speakers
   filters[filters.length - 1].connect(analyser);
    
  analyser.connect(audioContext.destination);
}

function visualize() {
  // clear the canvas
  // like this: canvasContext.clearRect(0, 0, width, height);
  
  // Or use rgba fill to give a slight blur effect
  canvasContext.fillStyle = 'rgba(0, 0, 0, 0.5)';
  canvasContext.fillRect(0, 0, width, height);
  
  // Get the analyser data
  analyser.getByteTimeDomainData(dataArray);

  canvasContext.lineWidth = 2;
  canvasContext.strokeStyle = 'lightBlue';

  // all the waveform is in one single path, first let's
  // clear any previous path that could be in the buffer
  canvasContext.beginPath();
  
  var sliceWidth = width / bufferLength;
  var x = 0;

  for(var i = 0; i < bufferLength; i++) {
     var v = dataArray[i] / 255;
     var y = v * height;

     if(i === 0) {
        canvasContext.moveTo(x, y);
     } else {
        canvasContext.lineTo(x, y);
     }

     x += sliceWidth;
  }

  canvasContext.lineTo(canvas.width, canvas.height/2);
  
  // draw the path at once
  canvasContext.stroke();  
  
  // call again the visualize function at 60 frames/s
  requestAnimationFrame(visualize);
  
}

function changeGain(sliderVal,nbFilter) {
  var value = parseFloat(sliderVal);
  filters[nbFilter].gain.value = value;
  
  // update output labels
  var output = document.querySelector("#gain"+nbFilter);
  output.value = value + " dB";
}

