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
});