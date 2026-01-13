// Switch between front and back camera for mobile view
const flipCameraBtn = document.getElementById('flipCameraBtn');
const webcamVideo = document.getElementById('webcam');
const webcamButton = document.getElementById('webcamButton');

let currentFacingMode = 'user'; // 'user' = front, 'environment' = back

flipCameraBtn.addEventListener('click', async () => {
    try {
        // Stop current stream
        const tracks = webcamVideo.srcObject.getTracks();
        tracks.forEach(track => track.stop());

        // Switch facing mode
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';

        // Get new stream with opposite camera
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: currentFacingMode },
                width: { ideal: 640 },
                height: { ideal: 480 }
            },
            audio: false
        });

        webcamVideo.srcObject = stream;
    } catch (error) {
        console.error('Error switching camera:', error);
        alert('Could not switch camera. Your device may not support multiple cameras.');
        // Reset facing mode on error
        currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    }
});

