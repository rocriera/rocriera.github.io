document.addEventListener('DOMContentLoaded', () => {
  // --- CONFIGURATION FOR THE BANNER ---
  const bannerSettings = {
    isVisible: false, // Change to false to make the whole section disappear
    message: 'Del <strong class="text-blue"> divendres 12 de Juliol</strong> fins al <strong class="text-blue"> final de l&#39estiu</strong>, web tancada. Escriu per <strong class="text-blue">whats</strong> per reservar.',
    imagePath: 'resources/estiu2.jpg'
  };

  const banner = document.querySelector('.franja-vacances');
  const bannerText = banner.querySelector('p:last-child');

  if (bannerSettings.isVisible) {
    banner.style.display = 'flex'; 
    banner.style.backgroundImage = `url('${bannerSettings.imagePath}')`;
    bannerText.innerHTML = bannerSettings.message;
  } else {
    banner.style.display = 'none';
  }

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
        "images/1.jpeg",
        "images/2.jpeg",
        "images/3.jpeg",
        "images/4.jpeg",
        "images/5.jpeg",
        "images/6.jpeg",
        "images/7.jpeg",
        "images/8.jpeg",
        "images/9.jpeg",
        "images/10.jpeg",
        "images/11.jpeg",
        "images/12.jpeg",
        "images/13.jpeg",
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
            const newImage2 = createImage(imagePool[(leftIndex % imagePool.length + imagePool.length) % imagePool.length]);
            track.prepend(newImage2);
            leftIndex--;
        }

        /* Add 1 more for mobile devices bug */
        const newImage2 = createImage(imagePool[(leftIndex % imagePool.length + imagePool.length) % imagePool.length]);
        track.prepend(newImage2);
    }
    
    function centerTrack() {
        const containerWidth = container.offsetWidth;
        const activeImage = track.querySelector('.active-carousel-image');
        if (!activeImage) return;

        // Calculem el centre exacte de la imatge activa respecte la pista
        const activeCenter = activeImage.offsetLeft + (activeImage.offsetWidth / 2);
        const centerOffset = (containerWidth / 2) - activeCenter;

        track.style.transition = 'none';
        track.style.transform = `translateX(${centerOffset}px)`;
        void track.offsetWidth; // Força el reflow per a la propera animació
        track.style.transition = 'transform 1.2s ease-in-out';
    }
    
    function nextImage() {
        if (isAnimating) return;
        isAnimating = true;

        const activeImage = track.querySelector('.active-carousel-image');
        if (!activeImage || !activeImage.nextElementSibling) {
            isAnimating = false;
            return;
        }

        // Calculem la distància de centre a centre entre la imatge actual i la següent
        const nextImg = activeImage.nextElementSibling;
        const activeCenter = activeImage.offsetLeft + (activeImage.offsetWidth / 2);
        const nextCenter = nextImg.offsetLeft + (nextImg.offsetWidth / 2);
        const shiftDistance = nextCenter - activeCenter;

        const currentTransform = new WebKitCSSMatrix(window.getComputedStyle(track).transform).e;
        const newTransform = currentTransform - shiftDistance;

        track.style.transition = 'transform 1.2s ease-in-out';
        track.style.transform = `translateX(${newTransform}px)`;

        function handler() {
            track.removeEventListener('transitionend', handler);
            currentImageIndex = (currentImageIndex + 1) % imagePool.length;
            fillTrack();
            centerTrack();
            isAnimating = false;
        }

        track.addEventListener('transitionend', handler);
    }

    function startCarousel() {
        fillTrack();
        centerTrack();
        carouselInterval = setInterval(nextImage, 4000);
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
        startCarousel();
        window.addEventListener('resize', handleResize);
    }).catch(error => {
        console.error("Failed to load images:", error);
    });
});