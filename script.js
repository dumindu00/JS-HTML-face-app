const video = document.getElementById("video");
const result = document.getElementById("result");

// Load models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("/models")

    
]).then(startVideo);
console.log("faceapi:", faceapi);

// Start webcam
function startVideo() {
    navigator.mediaDevices.getUserMedia({ video: {} })
    .then(stream => {
        video.srcObject = stream;
    })
    .catch(err => console.log(err));
}

let knownDescriptor = null;

// When video starts
video.addEventListener("play", async () => {

    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
        
        const detections = await faceapi
            .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detections) {
            result.innerText = "No face detected";
            return;
        }

        // Store reference face
        if (!knownDescriptor) {
            knownDescriptor = detections.descriptor;
            result.innerText = "Reference face stored";
            return;
        }

        // Compare
        const distance = faceapi.euclideanDistance(
            knownDescriptor,
            detections.descriptor
        );

        if (distance < 0.5) {
            result.innerText = "Match: Same person";
        } else {
            result.innerText = "No match";
        }

    }, 1000);
});

let knownFaces = [];

document.getElementById("register").onclick = async () => {
    const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor()

        if (!detection) {
            result.innerHTML = "No face to register";
            return
        }

        knownFaces.push(detection.descriptor);
        result.innerText = "Face registered!"

}


document.getElementById("check").onclick = async () => {

    const detection = await faceapi
        .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

        if(!detection) {
            result.innerHTML = "No face detected";
            return;
        }

        let matchFound = false;

        for (let face of knownFaces) {
            const distance = faceapi.euclideanDistance(face, detection.descriptor);

                if (distance < 0.5) {
                    matchFound = true
                    break
                }
        }

        result.innerHTML = matchFound ? "Match found" : "Unknown person"
}