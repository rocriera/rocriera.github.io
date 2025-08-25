document.addEventListener('DOMContentLoaded', () => {
  // Funció per actualitzar l'any al peu de pàgina
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // Intersecció d'observació per als elements amb la classe 'reveal'
  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
});

document.addEventListener("DOMContentLoaded", () => {
    const track = document.querySelector(".carousel-track");
    const container = track.parentElement;
    
    // Your image pool
    const imagePool = [
        "images/IMG-20250823-WA0005.jpg",
        "images/IMG-20250823-WA0006.jpg",
        "images/IMG-20250823-WA0005 copy.jpg",
        "images/IMG-20250823-WA0006 copy.jpg"
    ];
    
    let currentImageIndex = 0;
    let carouselInterval;
    let isAnimating = false;

    // Helper function to create an image and wrap it in a Promise
    function preloadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    }

    // Function to handle preloading all images before starting
    async function preloadAllImages() {
      const promises = imagePool.map(preloadImage);
      return Promise.all(promises);
    }
    
    function createImage(src) {
        const img = document.createElement("img");
        img.src = src;
        img.alt = "Image";
        return img;
    }
    
    function fillTrack() {
        track.innerHTML = '';
        const containerWidth = container.offsetWidth;
        const targetWidth = containerWidth * 2;
        let rightIndex = currentImageIndex;
        let trackWidth = 0;

        while (trackWidth < targetWidth / 2) {
            const newImage = createImage(imagePool[rightIndex % imagePool.length]);
            if (rightIndex === currentImageIndex) {
                newImage.classList.add('active-carousel-image');
            }
            track.appendChild(newImage);
            trackWidth += newImage.offsetWidth;
            rightIndex++;
        }
        
        /* Add 1 more for mobile devices bug */
        const newImage = createImage(imagePool[rightIndex % imagePool.length]);
        if (rightIndex === currentImageIndex) {
            newImage.classList.add('active-carousel-image');
        }
        track.appendChild(newImage);

        let leftIndex = currentImageIndex - 1;
        while (track.scrollWidth < targetWidth) {
            const newImage = createImage(imagePool[(leftIndex % imagePool.length + imagePool.length) % imagePool.length]);
            track.prepend(newImage);
            leftIndex--;
        }
    }
    
    function centerTrack() {
        const containerWidth = container.offsetWidth;
        const activeImage = track.querySelector('.active-carousel-image');
        if (!activeImage) return;
        let prevWidth = 0;
        let foundActive = false;
        for (const img of track.children) {
            if (img.classList.contains('active-carousel-image')) {
                foundActive = true;
            } else if (!foundActive) {
                prevWidth += img.offsetWidth;
            }
        }
        const activeImageWidth = activeImage.offsetWidth;
        const centerOffset = (containerWidth / 2) - (activeImageWidth / 2) - prevWidth;
        track.style.transition = 'none';
        track.style.transform = `translateX(${centerOffset}px)`;
        void track.offsetWidth;
        track.style.transition = 'transform 1.2s ease-in-out';
    }
    
    function nextImage() {
        if (isAnimating) return;
        isAnimating = true;
        const firstImageWidth = track.firstElementChild.offsetWidth;
        const currentTransform = new WebKitCSSMatrix(window.getComputedStyle(track).transform).e;
        const newTransform = currentTransform - firstImageWidth;
        track.style.transform = `translateX(${newTransform}px)`;
        track.addEventListener('transitionend', function handler() {
            currentImageIndex++;
            fillTrack();
            centerTrack();
            isAnimating = false;
            track.removeEventListener('transitionend', handler);
        });
    }

    function startCarousel() {
        fillTrack();
        centerTrack();
        carouselInterval = setInterval(nextImage, 5000);
    }
    
    function stopCarousel() {
        clearInterval(carouselInterval);
    }

    function handleResize() {
        if (isAnimating) {
            return;
        }
        stopCarousel();
        startCarousel();
    }

    // Main execution flow
    preloadAllImages().then(() => {
        // Once all images are loaded, start the carousel
        startCarousel();
        window.addEventListener('resize', handleResize);
    }).catch(error => {
        console.error("Failed to load images:", error);
    });
});