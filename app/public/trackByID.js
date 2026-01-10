function getCentroid(bbox) {
    return {
        x: bbox[0] + bbox[2] / 2,
        y: bbox[1] + bbox[3] / 2
    };
}

function distance(a, b) {
    return Math.sqrt(
        Math.pow(a.x - b.x, 2) +
        Math.pow(a.y - b.y, 2)
    );
}

function trackDetections(predictions) {
    const updatedTracks = {};
    const usedTrackIds = new Set();

    predictions.forEach(pred => {
        const centroid = getCentroid(pred.bbox);

        let bestMatchId = null;
        let bestDistance = Infinity;

        // Try to match with existing tracks
        for (const id in trackedObjects) {
            const track = trackedObjects[id];

            if (track.class !== pred.class || usedTrackIds.has(id)) continue;

            const d = distance(centroid, track);
            if (d < bestDistance && d < MAX_DISTANCE) {
                bestDistance = d;
                bestMatchId = id;
            }
        }

        if (bestMatchId !== null) {
            // Update existing track
            updatedTracks[bestMatchId] = {
                ...trackedObjects[bestMatchId],
                x: centroid.x,
                y: centroid.y,
                missed: 0
            };
            pred.trackId = bestMatchId;
            usedTrackIds.add(bestMatchId);
        } else {
            // Create new track
            const id = nextTrackId++;
            updatedTracks[id] = {
                id,
                class: pred.class,
                x: centroid.x,
                y: centroid.y,
                missed: 0
            };
            pred.trackId = id;
            usedTrackIds.add(id);
        }
    });

    // Handle missed tracks
    for (const id in trackedObjects) {
        if (!updatedTracks[id]) {
            trackedObjects[id].missed++;
            if (trackedObjects[id].missed <= MAX_MISSED_FRAMES) {
                updatedTracks[id] = trackedObjects[id];
            }
        }
    }

    trackedObjects = updatedTracks;
}
