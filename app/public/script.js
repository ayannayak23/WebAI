const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');
const stopButton = document.getElementById('stopWebcam');
const imageInput = document.getElementById('imageInput');
const imageCanvas = document.getElementById('imageCanvas');
const ctx = imageCanvas.getContext('2d');


let webcamRunning = false;
let animationFrameId = null;

// Store the resulting model in the global scope of our app.
var model = undefined;
console.log(tf.version.tfjs);

// Check if webcam access is supported.
function getUserMediaSupported() {
    return !! (navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

function enableCam(event) {
    // Only continue if the model has finished loading.
    if (!model) {
        return;
    }
    
    liveView.classList.remove('invisible');

    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia({ video: true })
    .then(function(stream) {
        video.srcObject = stream;
        webcamRunning = true;

        enableWebcamButton.disabled = true;
        stopButton.disabled = false;
        video.addEventListener('loadeddata', predictWebcam);
    })
    .catch(function(err) {
        alert(
        "Webcam access was denied.\n" +
        "Please allow camera permissions and reload the page."
        );
    });

}

// Stop the webcam and prediction loop
function stopWebcam() {
    if (!webcamRunning) return;

    // Stop prediction loop
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Stop camera stream
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }

    // Remove bounding boxes
    boundingBoxes.forEach(el => liveView.removeChild(el));
    boundingBoxes = [];

    webcamRunning = false;
    liveView.classList.add('invisible');


    enableWebcamButton.disabled = false;
    stopButton.disabled = true;
}


// If webcam supported, add event listener to button
// for when user wants to activate it to call enableCam
if (getUserMediaSupported()) {
    enableWebcamButton.addEventListener('click', enableCam);
} else {
    console.warn('getUserMedia() is not supported by your browser');
}

stopButton.addEventListener('click', stopWebcam);

// getUsermedia parameters to force video but not audio.
const constraints = {
    video: true
};

// Warm up the model by running a single detection on a dummy image.
function warmupModel() {
    const dummyCanvas = document.createElement('canvas');
    dummyCanvas.width = 300;
    dummyCanvas.height = 300;

    // Run one detection to force tensor allocation
    model.detect(dummyCanvas).then(() => {
        console.log('Model warmup completed');
    });
}


// wait for the model to load before using
// note: coco-ssd is an external object loaded from our index.html
const loadingElement = document.getElementById('loading');
const modelInfoPanel = document.getElementById('modelInfo');


cocoSsd.load().then(function(loadedModel) {
    model = loadedModel;

    warmupModel();

    // Hide loading message
    loadingElement.classList.add('invisible');
    modelInfoPanel.classList.remove('invisible');

    // Show demo section
    demosSection.classList.remove('dimmed');
});

// Function to draw predictions on a single image canvas
function drawImagePredictions(predictions) {
    predictions.forEach(pred => {
        if (pred.score > 0.66) {
            const [x, y, width, height] = pred.bbox;

            // Bounding box
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // Label
            ctx.fillStyle = 'red';
            ctx.font = '16px Arial';
            ctx.fillText(
                `${pred.class} (${Math.round(pred.score * 100)}%)`,
                x,
                y > 10 ? y - 5 : 10
            );
        }
    });
}

// Draw the predictions on the image canvas
imageInput.addEventListener('change', () => {
    if (!model) return;

    const file = imageInput.files[0];
    if (!file) return;

    imageCanvas.classList.remove('invisible');


    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
        // Resize canvas to image
        imageCanvas.width = img.width;
        imageCanvas.height = img.height;

        // Draw image
        ctx.drawImage(img, 0, 0);

        // Run detection with tensor cleanup
        tf.tidy(() => {
            model.detect(img).then(predictions => {
                drawImagePredictions(predictions);
            });
        });
    };
});


var boundingBoxes = [];

// Prediction loop
function predictWebcam() {
    if (!webcamRunning) return;
    // Now let's start classifying a frame in the stream.
    model.detect(video).then(function(predictions) {
        tf.tidy(() => {
            // Remove any highlighting we did previous frame.
            for (let i = 0; i < boundingBoxes.length; i++) {
                liveView.removeChild(boundingBoxes[i]);
            }
            boundingBoxes.splice(0);
            // Now lets loop through predictions and draw them to the live view if
            // they have a high confidence score.
            for (let n = 0; n < predictions.length; n++) {
                // If we are over 50% sure we are sure we classified it right, draw it!
                if (predictions[n].score > 0.50) {
                    const p = document.createElement('p');
                    p.innerText = predictions[n].class + ' - with ' +
                        Math.round(parseFloat(predictions[n].score) * 100) +
                        '% confidence.';
                    p.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: ' +
                        (predictions[n].bbox[1] - 10) + 'px; width: ' +
                        (predictions[n].bbox[2] - 10) + 'px; top: 0; left: 0;';
                    const highlighter = document.createElement('div');
                    highlighter.setAttribute('class', 'highlighter');

                    highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: ' +
                        predictions[n].bbox[1] + 'px; width: ' +
                        predictions[n].bbox[2] + 'px; height: ' +
                        predictions[n].bbox[3] + 'px;';

                    liveView.appendChild(highlighter);
                    liveView.appendChild(p);

                    boundingBoxes.push(highlighter);
                    boundingBoxes.push(p);
                }
            }
        });
        // Call this function again to keep predicting when the browser is ready.
        animationFrameId = window.requestAnimationFrame(predictWebcam);
    });
}