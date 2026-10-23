const STORAGE_KEY = "myImageGalleryUploads";
const DELETED_KEY = "myImageGalleryDeletedSamples";

const gallery = document.getElementById("gallery");
const uploadForm = document.getElementById("uploadForm");
const imageUpload = document.getElementById("imageUpload");
const imageTitle = document.getElementById("imageTitle");
const imageCategory = document.getElementById("imageCategory");
const message = document.getElementById("message");

const deleteModeBtn = document.getElementById("deleteModeBtn");
const selectAllBtn = document.getElementById("selectAllBtn");
const deleteSelectedBtn = document.getElementById("deleteSelectedBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const selectionCount = document.getElementById("selectionCount");

const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const imageCaption = document.getElementById("imageCaption");
const emptyMessage = document.getElementById("emptyMessage");

const filterButtons = document.querySelectorAll(".filter-btn");

let currentFilter = "all";
let deleteMode = false;
let visibleItems = [];
let currentIndex = 0;
let lastFocusedElement = null;

function readStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
    } catch (error) {
        return fallback;
    }
}

function saveStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        message.textContent =
            "LocalStorage is full or unavailable. Try a smaller image.";
        return false;
    }
}

function getItems() {
    return [...gallery.querySelectorAll(".gallery-item")];
}

function getSelectedItems() {
    return getItems().filter(item =>
        item.querySelector(".selection-check").checked
    );
}

/* Create a card for an uploaded image */
function createGalleryItem(data) {
    const item = document.createElement("article");
    item.className = "gallery-item";
    item.dataset.id = data.id;
    item.dataset.category = data.category;

    const imageWrap = document.createElement("div");
    imageWrap.className = "image-wrap";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "selection-check";
    checkbox.setAttribute("aria-label", "Select " + data.title);

    checkbox.addEventListener("change", () => {
        item.classList.toggle("selected", checkbox.checked);
        updateSelectionControls();
    });

    const img = document.createElement("img");
    img.className = "gallery-image";
    img.src = data.image;
    img.alt = data.title;
    img.loading = "lazy";

    const caption = document.createElement("div");
    caption.className = "caption";
    caption.textContent = data.title;

    imageWrap.append(checkbox, img);
    item.append(imageWrap, caption);

    return item;
}

/* Remove sample images deleted in earlier sessions */
function loadDeletedSamples() {
    const deleted = readStorage(DELETED_KEY, []);

    if (!Array.isArray(deleted)) return;

    deleted.forEach(id => {
        const item = getItems().find(card => card.dataset.id === id);
        if (item) item.remove();
    });
}

/* Restore uploaded images */
function loadSavedUploads() {
    const uploads = readStorage(STORAGE_KEY, []);

    if (!Array.isArray(uploads)) return;

    uploads.forEach(data => {
        if (
            !data ||
            typeof data.id !== "string" ||
            typeof data.title !== "string" ||
            !["nature", "city", "animals"].includes(data.category) ||
            typeof data.image !== "string" ||
            !data.image.startsWith("data:image/")
        ) {
            return;
        }

        if (getItems().some(item => item.dataset.id === data.id)) return;

        gallery.appendChild(createGalleryItem(data));
    });
}

/* Filter images */
function applyFilter() {
    const items = getItems();

    items.forEach(item => {
        const matches =
            currentFilter === "all" ||
            item.dataset.category === currentFilter;

        item.hidden = !matches;

        if (!matches) {
            item.querySelector(".selection-check").checked = false;
            item.classList.remove("selected");
        }
    });

    visibleItems = items.filter(item => !item.hidden);

    emptyMessage.style.display =
        visibleItems.length === 0 ? "block" : "none";

    updateSelectionControls();
}

/* Update selection toolbar */
function updateSelectionControls() {
    const selected = getSelectedItems();

    selectionCount.textContent =
        selected.length + " image(s) selected";

    const allSelected =
        visibleItems.length > 0 &&
        visibleItems.every(item =>
            item.querySelector(".selection-check").checked
        );

    selectAllBtn.textContent =
        allSelected ? "Deselect All" : "Select All";

    deleteSelectedBtn.disabled = selected.length === 0;
}

/* Turn selection mode on or off */
function setDeleteMode(enabled) {
    deleteMode = enabled;
    document.body.classList.toggle("delete-mode", enabled);

    selectAllBtn.hidden = !enabled;
    deleteSelectedBtn.hidden = !enabled;
    cancelDeleteBtn.hidden = !enabled;

    deleteModeBtn.textContent =
        enabled ? "Selection Mode Active" : "Select Images to Delete";

    deleteModeBtn.disabled = enabled;

    if (!enabled) {
        getItems().forEach(item => {
            item.querySelector(".selection-check").checked = false;
            item.classList.remove("selected");
        });
    }

    updateSelectionControls();
}

/* Upload and save image to LocalStorage */
uploadForm.addEventListener("submit", event => {
    event.preventDefault();

    const file = imageUpload.files[0];
    const title = imageTitle.value.trim();
    const category = imageCategory.value;

    if (!file || !file.type.startsWith("image/")) {
        message.textContent = "Please select a valid image.";
        return;
    }

    if (file.size > 1024 * 1024) {
        message.textContent =
            "Please select an image under 1 MB for browser storage.";
        return;
    }

    if (!title) {
        message.textContent = "Please enter an image title.";
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        const data = {
            id: "upload-" + Date.now() + "-" +
                Math.random().toString(36).slice(2, 8),
            title: title,
            category: category,
            image: reader.result
        };

        const uploads = readStorage(STORAGE_KEY, []);

        if (!Array.isArray(uploads)) {
            message.textContent = "Unable to read saved images.";
            return;
        }

        uploads.push(data);

        if (!saveStorage(STORAGE_KEY, uploads)) return;

        const item = createGalleryItem(data);
        gallery.appendChild(item);

        uploadForm.reset();
        applyFilter();

        message.textContent = "Image uploaded and saved successfully!";

        item.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    };

    reader.onerror = () => {
        message.textContent = "Unable to read this image.";
    };

    reader.readAsDataURL(file);
});

/* Delete selection controls */
deleteModeBtn.addEventListener("click", () => {
    setDeleteMode(true);
    message.textContent = "Select the images you want to delete.";
});

selectAllBtn.addEventListener("click", () => {
    const allSelected =
        visibleItems.length > 0 &&
        visibleItems.every(item =>
            item.querySelector(".selection-check").checked
        );

    visibleItems.forEach(item => {
        const checkbox = item.querySelector(".selection-check");
        checkbox.checked = !allSelected;
        item.classList.toggle("selected", !allSelected);
    });

    updateSelectionControls();
});

deleteSelectedBtn.addEventListener("click", () => {
    const selected = getSelectedItems();

    if (!selected.length) {
        message.textContent = "Please select images first.";
        return;
    }

    if (!confirm("Delete " + selected.length +
        " selected image(s)? This cannot be undone.")) {
        return;
    }

    const selectedIds = new Set(
        selected.map(item => item.dataset.id)
    );

    const uploads = readStorage(STORAGE_KEY, []);
    const deletedSamples = readStorage(DELETED_KEY, []);

    const updatedUploads = Array.isArray(uploads)
        ? uploads.filter(data => !selectedIds.has(data.id))
        : [];

    const updatedSamples = Array.isArray(deletedSamples)
        ? [...deletedSamples]
        : [];

    selected.forEach(item => {
        const id = item.dataset.id;

        if (id.startsWith("sample-") &&
            !updatedSamples.includes(id)) {
            updatedSamples.push(id);
        }
    });

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUploads));
        localStorage.setItem(DELETED_KEY, JSON.stringify(updatedSamples));
    } catch (error) {
        message.textContent = "Unable to save deletion. Try again.";
        return;
    }

    selected.forEach(item => item.remove());

    setDeleteMode(false);
    applyFilter();

    message.textContent =
        selected.length + " image(s) deleted successfully.";
});

cancelDeleteBtn.addEventListener("click", () => {
    setDeleteMode(false);
    message.textContent = "Selection cancelled.";
});

/* Category filters */
filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        filterButtons.forEach(btn => btn.classList.remove("active"));
        button.classList.add("active");

        currentFilter = button.dataset.filter;
        applyFilter();
    });
});

/* Lightbox preview */
function openLightbox(item) {
    applyFilter();

    currentIndex = visibleItems.indexOf(item);
    if (currentIndex < 0) return;

    lastFocusedElement = document.activeElement;

    showImage();

    lightbox.classList.add("show");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    document.getElementById("closeBtn").focus();
}

function showImage() {
    if (!visibleItems.length) return;

    const item = visibleItems[currentIndex];
    const img = item.querySelector(".gallery-image");
    const caption = item.querySelector(".caption");

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;

    imageCaption.textContent =
        caption.textContent + " (" +
        (currentIndex + 1) + " of " +
        visibleItems.length + ")";
}

function nextImage() {
    if (!visibleItems.length) return;

    currentIndex = (currentIndex + 1) % visibleItems.length;
    showImage();
}

function previousImage() {
    if (!visibleItems.length) return;

    currentIndex =
        (currentIndex - 1 + visibleItems.length) %
        visibleItems.length;

    showImage();
}

function closeLightbox() {
    lightbox.classList.remove("show");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastFocusedElement) lastFocusedElement.focus();
}

/* Click image to open full preview */
gallery.addEventListener("click", event => {
    if (deleteMode) return;

    const img = event.target.closest(".gallery-image");
    if (!img) return;

    const item = img.closest(".gallery-item");

    if (item && !item.hidden) {
        openLightbox(item);
    }
});

/* Navigation buttons */
document.getElementById("nextBtn")
    .addEventListener("click", nextImage);

document.getElementById("prevBtn")
    .addEventListener("click", previousImage);

document.getElementById("closeBtn")
    .addEventListener("click", closeLightbox);

lightbox.addEventListener("click", event => {
    if (event.target === lightbox) closeLightbox();
});

/* Keyboard navigation */
document.addEventListener("keydown", event => {
    if (!lightbox.classList.contains("show")) return;

    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowRight") nextImage();
    if (event.key === "ArrowLeft") previousImage();
});

/* Initial loading */
loadDeletedSamples();
loadSavedUploads();
applyFilter();
