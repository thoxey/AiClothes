document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('imageUpload');
    const uploadedImage = document.getElementById('uploaded-image');
    const svgOverlay = document.getElementById('svg-overlay');
    const loadingSpinner = document.getElementById('loading-spinner');
    const deselectButton = document.getElementById('deselect-button');
    const saveSelectionButton = document.getElementById('save-selection-button');
    const cutoutContainer = document.getElementById('cutout-container');

    let selectedSegments = new Set(); // Store selected segments
    let currentFilename = ""; // Store the uploaded filename

    var uploadJson;

    // 📂 File upload event
    fileInput.addEventListener('change', function () {
        if (fileInput.files.length > 0) {
            uploadImage(fileInput.files[0]);
        }
    });

    function uploadImage(file) {
        const formData = new FormData();
        formData.append('file', file);

        // Show loading spinner while processing
        loadingSpinner.style.display = 'block';

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            uploadJson = data;
            // Hide the spinner once done
            loadingSpinner.style.display = 'none';

            if (data.success) {
                currentFilename = data.file;
                uploadedImage.src = `/static/uploads/${data.file}`;
                uploadedImage.onload = function () {
                    updateSVGOverlay(data.polygons);
                    displayMask(data.mask);  // Display the mask
                };
            } else {
                alert('Upload failed: ' + data.error);
            }
        })
        .catch(err => {
            console.error('Error uploading image:', err);
            alert('An error occurred while uploading.');
            loadingSpinner.style.display = 'none';
        });
    }

    function displayMask(base64Mask) {
        const maskImg = new Image();
        maskImg.src = `data:image/png;base64,${base64Mask}`;
        maskImg.style.position = "absolute";
        maskImg.style.top = uploadedImage.offsetTop + "px";
        maskImg.style.left = uploadedImage.offsetLeft + "px";
        maskImg.style.width = uploadedImage.width + "px";
        maskImg.style.height = uploadedImage.height + "px";
        maskImg.style.opacity = 0.5; // Adjust opacity as needed

        // Add mask to the UI
        document.body.appendChild(maskImg);
    }

    function updateSVGOverlay(svgPaths) {
        // Ensure the SVG matches the uploaded image size
        svgOverlay.setAttribute('viewBox', `0 0 ${uploadedImage.naturalWidth} ${uploadedImage.naturalHeight}`);
        svgOverlay.style.width = uploadedImage.width + 'px';
        svgOverlay.style.height = uploadedImage.height + 'px';
        svgOverlay.innerHTML = ''; // Clear previous segments
        selectedSegments.clear(); // Reset selection

        svgPaths.forEach((pathStr, index) => {
            const pathElem = document.createElementNS("http://www.w3.org/2000/svg", "path");
            pathElem.setAttribute("d", pathStr);
            pathElem.setAttribute("fill-rule", "evenodd");
            pathElem.classList.add('segment');

            // Click to toggle selection
            pathElem.addEventListener('click', function () {
                if (selectedSegments.has(pathElem)) {
                    selectedSegments.delete(pathElem);
                    pathElem.classList.remove('selected');
                } else {
                    selectedSegments.add(pathElem);
                    pathElem.classList.add('selected');
                }
            });

            svgOverlay.appendChild(pathElem);
        });
    }

    // ❌ Deselect All Segments
    deselectButton.addEventListener('click', function () {
        selectedSegments.forEach(segment => segment.classList.remove('selected'));
        selectedSegments.clear();
    });

    // 💾 Save Selection & Process Cutout
    saveSelectionButton.addEventListener('click', function () {
        if (selectedSegments.size === 0) {
            alert('No segments selected!');
            return;
        }

        // Create an empty mask the same size as the uploaded image
        const canvas = document.createElement('canvas');
        canvas.width = uploadedImage.naturalWidth;
        canvas.height = uploadedImage.naturalHeight;
        const ctx = canvas.getContext('2d');

        // Fill selected segments on the canvas
        ctx.fillStyle = 'white'; // Mask will be white on black background
        selectedSegments.forEach(segment => {
            const path = new Path2D(segment.getAttribute("d"));
            ctx.fill(path);
        });

        // Convert mask to image data
        canvas.toBlob(function (blob) {
            const formData = new FormData();
            formData.append('mask', blob, 'mask.png');
            formData.append('filename', currentFilename);

            fetch('/save-selection', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayCutout(data.cutout);
                } else {
                    alert('Error saving selection.');
                }
            })
            .catch(err => console.error('Save Error:', err));
        }, 'image/png');
    });

    function displayCutout(cutoutUrl) {
        cutoutContainer.innerHTML = `<img src="${cutoutUrl}" alt="Cutout Image">`;
    }
});
