// public/app.js (브라우저)
const $ = (sel) => document.querySelector(sel);
const entriesBox = $('#entries');
const form = $('#entry-form');

function formatDate(isoOrYMD = '') {
  try {
    const d = isoOrYMD.includes('T') ? new Date(isoOrYMD) : new Date(isoOrYMD + 'T00:00:00');
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}.${m}.${day}`;
  } catch {
    return isoOrYMD;
  }
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function renderItem(e) {
  return `
    <article class="entry" data-id="${e.id}">
      <div class="row">
        <h3 style="margin:0;">${escapeHtml(e.title)}</h3>
        <span class="meta">· ${formatDate(e.date || e.createdAt)}</span>
        <button class="delete-btn">삭제</button>
      </div>
      <p style="white-space:pre-wrap; margin:8px 0 0;">${escapeHtml(e.content)}</p>
    </article>
  `;
}

function renderList(list) {
  if (!Array.isArray(list) || list.length === 0) {
    entriesBox.innerHTML = `<p>아직 작성한 일기가 없어요. 첫 글을 써볼까요? ✨</p>`;
    return;
  }
  entriesBox.innerHTML = list.map(renderItem).join('');
}

async function loadEntries() {
  entriesBox.innerHTML = `<p>불러오는 중...</p>`;
  try {
    const res = await fetch('/api/entries');
    if (!res.ok) throw new Error('목록 조회 실패');
    const list = await res.json();
    renderList(list);
  } catch (e) {
    console.error(e);
    entriesBox.innerHTML = `<p>목록을 불러오지 못했습니다. 새로고침 해주세요.</p>`;
  }
}

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const fd = new FormData(form);
  const data = {
    title: String(fd.get('title') || '').trim(),
    content: String(fd.get('content') || '').trim(),
    date: fd.get('date') || new Date().toISOString().slice(0, 10)
  };
  if (!data.title || !data.content) {
    alert('제목과 내용을 입력해주세요.');
    return;
  }
  try {
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(await res.text());
    form.reset();
    loadEntries();
  } catch (e) {
    console.error(e);
    alert('저장에 실패했습니다.');
  }
});

entriesBox.addEventListener('click', async (e) => {
  const btn = e.target.closest('.delete-btn');
  if (!btn) return;
  const article = btn.closest('.entry');
  const id = article?.dataset?.id;
  if (!id) return;
  if (!confirm('정말 삭제할까요?')) return;

  try {
    const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text());
    loadEntries();
  } catch (err) {
    console.error(err);
    alert('삭제에 실패했습니다.');
  }
});

// 첫 진입 시 목록 불러오기
loadEntries();
