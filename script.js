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

  // Gestió de l'enllaç per obrir el calendari en una nova pestanya
  const openCalendarLink = document.getElementById('openCalendar');
  openCalendarLink?.addEventListener('click', event => {
    event.preventDefault();
    const iframeSrc = document.querySelector('#reserva iframe')?.src;
    if (iframeSrc) {
      window.open(iframeSrc, '_blank');
    }
  });

  // --- Lògica de control de scroll per a mòbils ---
  const iframe = document.querySelector('#reserva iframe');
  const body = document.body;

  function isMobile() {
    // Detecta si l'ample de la finestra és inferior a 768px (ample típic de tauleta/mòbil)
    return window.innerWidth <= 768;
  }

  if (iframe && isMobile()) {
    iframe.addEventListener('load', () => {
      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.body.style.overflow = 'hidden'; // Amaga l'scroll intern de l'iframe per defecte
    });

    // Detecta l'scroll dins de l'iframe
    iframe.contentWindow.addEventListener('scroll', () => {
      const iframeScrollTop = iframe.contentWindow.pageYOffset || iframe.contentWindow.document.documentElement.scrollTop;
      const iframeScrollHeight = iframe.contentWindow.document.documentElement.scrollHeight;
      const iframeHeight = iframe.contentWindow.innerHeight;

      const isAtBottom = iframeScrollTop + iframeHeight >= iframeScrollHeight;

      if (isAtBottom) {
        body.style.overflowY = 'auto'; // Reactiva l'scroll del cos de la pàgina
      } else {
        body.style.overflowY = 'hidden'; // Bloca l'scroll del cos de la pàgina
      }
    });

    // Detecta quan l'iframe entra a la vista i bloca el scroll de la pàgina principal
    window.addEventListener('scroll', () => {
      const rect = iframe.getBoundingClientRect();
      if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
        body.style.overflowY = 'hidden';
      }
    });
  }
});