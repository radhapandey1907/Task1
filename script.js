const form = document.getElementById('uploadForm');
const fileInput = document.getElementById('imageUpload');
const titleInput = document.getElementById('imageTitle');
const categoryInput = document.getElementById('imageCategory');
const gallery = document.getElementById('gallery');
const message = document.getElementById('message');
const emptyMessage = document.getElementById('emptyMessage');
const filters = document.querySelectorAll('.filter-btn');
const preview = document.getElementById('preview');
const previewImage = document.getElementById('previewImage');
const previewTitle = document.getElementById('previewTitle');
let currentFilter = 'all';
let images = JSON.parse(localStorage.getItem('simpleGallery') || '[]');

function saveImages() {
  localStorage.setItem('simpleGallery', JSON.stringify(images));
}

function showImages() {
  gallery.innerHTML = '';
  const shownImages = images.filter(image => currentFilter === 'all' || image.category === currentFilter);
  emptyMessage.style.display = shownImages.length ? 'none' : 'block';

  shownImages.forEach(image => {
    const card = document.createElement('article');
    card.className = 'gallery-item';
    const img = document.createElement('img');
    img.src = image.src;
    img.alt = image.title;
    img.addEventListener('click', () => {
      previewImage.src = image.src;
      previewTitle.textContent = image.title;
      preview.classList.add('show');
    });
    const title = document.createElement('p');
    title.textContent = image.title;
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.addEventListener('click', () => {
      images = images.filter(item => item.id !== image.id);
      saveImages();
      showImages();
    });
    card.append(img, title, deleteButton);
    gallery.appendChild(card);
  });
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const file = fileInput.files[0];
  if (!file || !file.type.startsWith('image/')) {
    message.textContent = 'Please choose an image.';
    return;
  }
  if (file.size > 1024 * 1024) {
    message.textContent = 'Please choose an image smaller than 1 MB.';
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    images.push({
      id: Date.now().toString(),
      title: titleInput.value.trim(),
      category: categoryInput.value,
      src: reader.result
    });
    try {
      saveImages();
      form.reset();
      message.textContent = 'Image added successfully!';
      showImages();
    } catch (error) {
      message.textContent = 'Storage is full. Please use a smaller image.';
      images.pop();
    }
  };
  reader.readAsDataURL(file);
});

filters.forEach(button => button.addEventListener('click', () => {
  filters.forEach(item => item.classList.remove('active'));
  button.classList.add('active');
  currentFilter = button.dataset.filter;
  showImages();
}));

document.getElementById('closePreview').addEventListener('click', () => preview.classList.remove('show'));
preview.addEventListener('click', event => {
  if (event.target === preview) preview.classList.remove('show');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') preview.classList.remove('show');
});

showImages();
