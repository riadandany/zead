// ============ Supabase Config ============
const SUPABASE_URL = 'https://xzegwsfligtxkbudjdwg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZWd3c2ZsaWd0eGtidWRqZHdnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NDMyNDUsImV4cCI6MjA5NzUxOTI0NX0.2wcExs47kgecab6GoP-4cF1lAuRWj6-Dbd-gVq2CT4o';
const ADMIN_EMAIL = 'ziad@ziad.local'; // اسم المستخدم admin يُحوَّل لهذا الإيميل
const BUCKET = 'works';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============ UI Basics ============
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => nav.classList.toggle('scrolled', window.scrollY > 30));

const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
}, { threshold: 0.12 });
function observeReveals(){ document.querySelectorAll('.reveal:not(.visible)').forEach(el => io.observe(el)); }
observeReveals();

document.getElementById('year').textContent = new Date().getFullYear();

function sendWhats(form){
  const data = new FormData(form);
  const text = `مرحبا زياد للطباعة 👋%0A` +
               `الاسم: ${data.get('name')}%0A` +
               `الهاتف: ${data.get('phone')}%0A` +
               `الرسالة: ${data.get('msg')}` +
               `نشكرك على التواصل معنا%0A`;
  window.open(`https://wa.me/963984871101?text=${text}`, '_blank');
}
window.sendWhats = sendWhats;

// ============ Modals ============
function openModal(id){ const m = document.getElementById(id); m.classList.add('open'); m.setAttribute('aria-hidden','false'); }
function closeModal(id){ const m = document.getElementById(id); m.classList.remove('open'); m.setAttribute('aria-hidden','true'); }
document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.dataset.close)));
document.querySelectorAll('.modal').forEach(m => m.addEventListener('click', (e) => { if (e.target === m) closeModal(m.id); }));

// ============ Lightbox ============
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCap = document.getElementById('lightboxCap');
document.getElementById('lightboxClose').addEventListener('click', () => lightbox.classList.remove('open'));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('open'); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') lightbox.classList.remove('open'); });

function openLightbox(src, cap){
  lightboxImg.src = src;
  lightboxCap.textContent = cap || '';
  lightbox.classList.add('open');
}

// ============ Gallery (Public) ============
const galleryGrid = document.getElementById('galleryGrid');
const galleryEmpty = document.getElementById('galleryEmpty');

async function loadGallery(){
  galleryEmpty.style.display = 'block';
  galleryEmpty.textContent = 'جارٍ تحميل الأعمال...';
  const { data, error } = await sb.from('works').select('*').order('created_at', { ascending: false });
  if (error) {
    galleryEmpty.textContent = 'تعذّر تحميل الأعمال.';
    console.error(error);
    return;
  }
  renderGallery(data || []);
  renderAdminList(data || []);
}

function renderGallery(items){
  galleryGrid.innerHTML = '';
  if (!items.length){
    galleryGrid.innerHTML = '<p class="gallery-empty">لا توجد أعمال بعد. سيتم إضافتها قريباً.</p>';
    return;
  }
  items.forEach(it => {
    const fig = document.createElement('figure');
    fig.className = 'reveal visible';
    fig.innerHTML = `<img src="${it.image_url}" alt="${escapeHtml(it.title)}" loading="lazy"><figcaption>${escapeHtml(it.title)}</figcaption>`;
    fig.querySelector('img').addEventListener('click', () => openLightbox(it.image_url, it.title + (it.description ? ' — ' + it.description : '')));
    galleryGrid.appendChild(fig);
  });
}

function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ============ Auth ============
document.getElementById('magicLoginBtn').addEventListener('click', async (e) => {
  e.preventDefault();
  const { data } = await sb.auth.getSession();
  if (data.session) openModal('adminModal'); else openModal('loginModal');
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target;
  const username = f.username.value.trim();
  const password = f.password.value;
  const errBox = document.getElementById('loginError');
  errBox.textContent = '';
  // accept "admin" or full email
  const email = username.includes('@') ? username : (username === 'admin' ? ADMIN_EMAIL : username + '@ziad.local');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error){ errBox.textContent = 'بيانات الدخول غير صحيحة.'; return; }
  closeModal('loginModal');
  openModal('adminModal');
  f.reset();
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await sb.auth.signOut();
  closeModal('adminModal');
});

// ============ Admin CRUD ============
const workForm = document.getElementById('workForm');
const workIdEl = document.getElementById('workId');
const workOldImageEl = document.getElementById('workOldImage');
const workTitleInput = document.getElementById('workTitleInput');
const workDescInput = document.getElementById('workDescInput');
const workImageInput = document.getElementById('workImageInput');
const workSubmit = document.getElementById('workSubmit');
const workReset = document.getElementById('workReset');
const formTitle = document.getElementById('formTitle');
const adminList = document.getElementById('adminList');
const workError = document.getElementById('workError');

function resetWorkForm(){
  workForm.reset();
  workIdEl.value = '';
  workOldImageEl.value = '';
  formTitle.textContent = '➕ إضافة عمل جديد';
  workSubmit.textContent = 'حفظ';
  workReset.style.display = 'none';
  workError.textContent = '';
}
workReset.addEventListener('click', resetWorkForm);
resetWorkForm();

workForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  workError.textContent = '';
  workSubmit.disabled = true; workSubmit.textContent = 'جارٍ الحفظ...';
  try {
    const id = workIdEl.value;
    const title = workTitleInput.value.trim();
    const description = workDescInput.value.trim();
    const file = workImageInput.files[0];
    let image_url = null;
    let image_path = null;

    if (file){
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error: upErr } = await sb.storage.from(BUCKET).upload(path, file, { cacheControl: '3600', upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
      image_url = pub.publicUrl;
      image_path = path;
    }

    if (id){
      const update = { title, description };
      if (image_url){ update.image_url = image_url; update.image_path = image_path; }
      const { error } = await sb.from('works').update(update).eq('id', id);
      if (error) throw error;
      // delete old image if replaced
      if (image_url && workOldImageEl.value){
        await sb.storage.from(BUCKET).remove([workOldImageEl.value]).catch(()=>{});
      }
    } else {
      if (!image_url){ workError.textContent = 'الرجاء اختيار صورة.'; workSubmit.disabled=false; workSubmit.textContent='حفظ'; return; }
      const { error } = await sb.from('works').insert({ title, description, image_url, image_path });
      if (error) throw error;
    }
    resetWorkForm();
    await loadGallery();
  } catch (err){
    console.error(err);
    workError.textContent = 'حدث خطأ: ' + (err.message || err);
  } finally {
    workSubmit.disabled = false; workSubmit.textContent = 'حفظ';
  }
});

function renderAdminList(items){
  adminList.innerHTML = '';
  if (!items.length){ adminList.innerHTML = '<p class="muted">لا يوجد أعمال بعد.</p>'; return; }
  items.forEach(it => {
    const row = document.createElement('div');
    row.className = 'admin-item';
    row.innerHTML = `
      <img src="${it.image_url}" alt="">
      <div class="admin-item-info">
        <strong>${escapeHtml(it.title)}</strong>
        <span>${escapeHtml(it.description || '')}</span>
      </div>
      <div class="admin-item-actions">
        <button class="btn btn-sm btn-ghost" data-act="edit">تعديل</button>
        <button class="btn btn-sm btn-danger" data-act="del">حذف</button>
      </div>`;
    row.querySelector('[data-act=edit]').addEventListener('click', () => {
      workIdEl.value = it.id;
      workOldImageEl.value = it.image_path || '';
      workTitleInput.value = it.title;
      workDescInput.value = it.description || '';
      workImageInput.value = '';
      formTitle.textContent = '✏️ تعديل العمل';
      workSubmit.textContent = 'تحديث';
      workReset.style.display = 'inline-flex';
      document.querySelector('#adminModal .modal-box').scrollTo({ top:0, behavior:'smooth' });
    });
    row.querySelector('[data-act=del]').addEventListener('click', async () => {
      if (!confirm('حذف هذا العمل نهائياً؟')) return;
      const { error } = await sb.from('works').delete().eq('id', it.id);
      if (error){ alert('فشل الحذف: ' + error.message); return; }
      if (it.image_path) await sb.storage.from(BUCKET).remove([it.image_path]).catch(()=>{});
      await loadGallery();
    });
    adminList.appendChild(row);
  });
}

// ============ Init ============
loadGallery();
