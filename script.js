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
  const images = track.querySelectorAll("img");
  let currentIndex = 0;
  let isAnimating = false;

  function nextImage() {
    if (isAnimating) return;
    isAnimating = true;

    const firstImage = track.querySelector("img");
    const imageWidth = firstImage.offsetWidth + (parseInt(getComputedStyle(firstImage).marginLeft) + parseInt(getComputedStyle(firstImage).marginRight));


    // mueve a la izquierda
    track.style.transform = `translateX(-${imageWidth}px)`;

    // al acabar la animación...
    track.addEventListener("transitionend", function handler() {
      track.style.transition = "none"; // quita transición
      track.appendChild(firstImage);   // pasa la primera al final
      track.style.transform = "translateX(0)"; // resetea posición

      // fuerza reflow
      void track.offsetWidth;

      // vuelve a activar transición
      track.style.transition = "transform 1.2s ease-in-out";

      isAnimating = false;
      track.removeEventListener("transitionend", handler);
    });
  }

  // cada 5s
  setInterval(nextImage, 5000);
});
