// script.js
// Globals
let files = [];
const MAX_FILES = 4;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const STORAGE_KEY = "comments-widget";

// DOM refs
const dropzone = document.getElementById("dropzone");
const browseBtn = document.getElementById("browseBtn");
const fileInput = document.getElementById("fileInput");
const thumbs = document.getElementById("thumbs");
const submitBtn = document.getElementById("submitBtn");
const clearAllBtn = document.getElementById("clearAll");
const commentText = document.getElementById("commentText");
const commentsList = document.getElementById("commentsList");
const statusArea = document.getElementById("statusArea");


function showStatus(msg, isError = true) {
    statusArea.textContent = msg;
    statusArea.style.color = isError ? "#c33" : "green";
    setTimeout(() => { statusArea.textContent = ""; }, 3000);
  }


['dragenter','dragover'].forEach(ev => dropzone.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); dropzone.classList.add('dragover'); }));
['dragleave','drop'].forEach(ev => dropzone.addEventListener(ev, e=>{ e.preventDefault(); e.stopPropagation(); dropzone.classList.remove('dragover'); }));
dropzone.addEventListener('drop', e => { if(e.dataTransfer?.files) readFiles(e.dataTransfer.files); });
browseBtn.addEventListener('click', ()=> fileInput.click());
fileInput.addEventListener('change', e => { if(e.target.files) readFiles(e.target.files); fileInput.value = ''; });

function sanitizeText(text) {
    // Simple HTML escaping to prevent XSS
    return text.replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[c]));
  }

submitBtn.addEventListener('click', ()=>{
const text = commentText.value.trim();
if(!text){ showStatus('Comment cannot be empty.'); return; }
const payload = {
id: Date.now().toString(36),
text: sanitizeText(text),
images: files.map(f=>({name:f.name, dataUrl:f.dataUrl})),
createdAt: new Date().toISOString()
};
const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
existing.unshift(payload);
localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
files = []; renderThumbs(); commentText.value = '';
renderComments();
showStatus('Comment saved locally.', false);
});


clearAllBtn.addEventListener('click', ()=>{
if(confirm('Clear all comments and attachments from this page?')){
localStorage.removeItem(STORAGE_KEY); files=[]; renderThumbs(); commentText.value=''; renderComments(); showStatus('Cleared.', false);
}
});


function timeAgo(iso){
const then = new Date(iso); const diff = Math.floor((Date.now()-then)/1000);
if(diff < 60) return `${diff}s ago`;
if(diff < 3600) return `${Math.floor(diff/60)}m ago`;
if(diff < 86400) return `${Math.floor(diff/3600)}h ago`;
return then.toLocaleString();
}

function renderThumbs() {
    thumbs.innerHTML = "";
    files.forEach((f, idx) => {
      const el = document.createElement("div");
      el.className = "thumb";
  
      const img = document.createElement("img");
      img.src = f.dataUrl;
      img.alt = f.name;
  
      const meta = document.createElement("div");
      meta.className = "meta";
      const btn = document.createElement('button');
btn.textContent = '✖';
btn.addEventListener('click', () => removeFile(idx));
meta.appendChild(btn);

      el.appendChild(img);
      el.appendChild(meta);
      thumbs.appendChild(el);
    });
  }
  
  function removeFile(index) {
    files.splice(index, 1);
    renderThumbs();
  }
  

function renderComments(){
const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
commentsList.innerHTML = '';
if(!data.length){ commentsList.innerHTML = '<div style="color:var(--muted)">No comments yet.</div>'; return; }
data.forEach(item=>{
const c = document.createElement('article'); c.className='comment';
const avatar = document.createElement('div'); avatar.className='avatar'; avatar.textContent = item.text.replace(/<[^>]*>/g,'').trim().slice(0,1).toUpperCase();
const body = document.createElement('div'); body.className='body';
const meta = document.createElement('div'); meta.className='meta'; meta.innerHTML = `<strong>Anonymous</strong> · <span>${timeAgo(item.createdAt)}</span>`;
const txt = document.createElement('div'); txt.style.marginTop='6px'; txt.innerHTML = item.text;
body.appendChild(meta); body.appendChild(txt);
if(item.images && item.images.length){
const gallery = document.createElement('div'); gallery.style.display='flex'; gallery.style.gap='8px'; gallery.style.marginTop='8px';
item.images.forEach(img=>{
const im = document.createElement('img'); im.src = img.dataUrl; im.alt = img.name; im.style.width='90px'; im.style.height='64px'; im.style.objectFit='cover'; im.style.borderRadius='6px'; im.loading='lazy';
gallery.appendChild(im);
})
body.appendChild(gallery);
}
c.appendChild(avatar); c.appendChild(body);
commentsList.appendChild(c);
})
}

renderComments();                                             

dropzone.addEventListener('keydown', e=>{ if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
                                                                                                                                  