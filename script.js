// Navbar scroll
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 30);
});

// Mobile menu
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

// Reveal on scroll
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Contact form -> WhatsApp
function sendWhats(form){
  const data = new FormData(form);
  const text = `مرحبا زياد للطباعة 👋%0A` +
               `الاسم: ${data.get('name')}%0A` +
               `الهاتف: ${data.get('phone')}%0A` +
               `الرسالة: ${data.get('msg')}`;
  window.open(`https://wa.me/963984871101?text=${text}`, '_blank');
}
