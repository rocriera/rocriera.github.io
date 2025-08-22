const y=document.getElementById('year');
if(y)y.textContent=new Date().getFullYear();

const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('show');
      io.unobserve(e.target);
    }
  });
},{threshold:.15});

document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

const openCalendar=document.getElementById('openCalendar');
openCalendar?.addEventListener('click', ev=>{
  ev.preventDefault();
  const src=document.querySelector('#reserva iframe')?.src;
  if(src)window.open(src,'_blank');
});