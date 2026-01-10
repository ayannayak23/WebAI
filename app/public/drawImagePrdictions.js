const imageInput = document.getElementById('imageInput');
const imageCanvas = document.getElementById('imageCanvas');
const ctx = imageCanvas.getContext('2d');

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
        const context = imageCanvas.getContext('2d');
        context.drawImage(img, 0, 0);

        // Run detection
        model.detect(imageCanvas).then(predictions => {
            console.log('Predictions:', predictions);

            if (video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
                video.srcObject = null;
            }

            liveView.classList.add('invisible');
            document.getElementById('classFilters').classList.add('invisible');
            document.getElementById('confidenceControl').classList.add('invisible');
            screenshotBtn.disabled = true;

            trackedObjects = {};
            nextTrackId = 1;


            // Clear filters
            filterList.innerHTML = '';
            activeClasses.clear();
            createdClasses.clear();

            enableWebcamButton.disabled = false;
            stopButton.disabled = true;

            
            predictions.forEach(pred => {
                console.log(`Object: ${pred.class}, Score: ${pred.score}`);
                if (pred.score > 0.66) {
                    const [x, y, width, height] = pred.bbox;
                    console.log(`Drawing ${pred.class} at [${x}, ${y}, ${width}, ${height}]`);

                    // Bounding box
                    context.strokeStyle = 'red';
                    context.lineWidth = 2;
                    context.strokeRect(x, y, width, height);

                    // Label
                    context.fillStyle = 'red';
                    context.font = '25px Arial';
                    context.fontWeight = 'bold';
                    context.fillText(
                        `${pred.class} (${Math.round(pred.score * 100)}%)`,
                        x,
                        y > 10 ? y - 5 : 10
                    );
                }
            });
        }).catch(err => {
            console.error('Detection error:', err);
        });
    };
});
