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
            // Hide the spinner once done
            loadingSpinner.style.display = 'none';

            if (data.success) {
                currentFilename = data.file; // Store the filename
                uploadedImage.src = `/static/uploads/${data.file}`;
                uploadedImage.onload = function () {
                    updateSVGOverlay(data.polygons);
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

        let selectedPaths = [];
        selectedSegments.forEach(segment => {
            selectedPaths.push(segment.getAttribute("d"));
        });

        fetch('/save-selection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedSegments: selectedPaths, filename: currentFilename })
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
    });

    function displayCutout(cutoutUrl) {
        cutoutContainer.innerHTML = `<img src="${cutoutUrl}" alt="Cutout Image">`;
    }
});
