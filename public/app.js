// public/app.js
const $ = (sel) => document.querySelector(sel);

function formatDate(isoOrYMD) {
  // YYYY-MM-DD 또는 ISO -> YYYY.MM.DD
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

//일기 불러오기 
async function loadEntries() {
  const box = $('#entries');
  box.innerHTML = '불러오는 중...';
  try {
    const res = await fetch('/api/entries');
    const list = await res.json();

    if (!Array.isArray(list) || list.length === 0) {
      box.innerHTML = '<p class="empty">아직 작성된 일기가 없습니다.</p>';
      return;
    }

    box.innerHTML = '';
    list.forEach(item => {
      const el = document.createElement('article');
      el.className = 'entry';

      el.innerHTML = `
        <div class="entry-head">
          <h3>${item.title}</h3>
          <div class="meta">
            <span>${formatDate(item.date)} • ${item.petName}</span>
            <span class="mood">${item.mood || 'normal'}</span>
          </div>
        </div>
        <p class="content">${item.content.replace(/\n/g, '<br>')}</p>
        <div class="meta2">
          <small>작성: ${formatDate(item.createdAt)}</small>
          <button class="del" data-id="${item.id}">삭제</button>
        </div>
      `;
      box.appendChild(el);
    });

    // 삭제 버튼 이벤트
    box.querySelectorAll('.del').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!confirm('정말 삭제할까요?')) return;
        const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' });
        if (res.ok) {
          await loadEntries();
        } else {
          alert('삭제 중 오류가 발생했습니다.');
        }
      });
    });

  } catch (e) {
    console.error(e);
    box.innerHTML = '<p class="error">목록을 불러오지 못했습니다.</p>';
  }
}

//일기 저장 
async function submitEntry(e) {
  e.preventDefault();
  const payload = {
    date: $('#date').value,
    petName: $('#petName').value.trim(),
    title: $('#title').value.trim(),
    mood: $('#mood').value,
    content: $('#content').value.trim()
  };

  if (!payload.date || !payload.petName || !payload.title || !payload.content) {
    alert('필수 항목을 모두 입력하세요.');
    return;
  }

  try {
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || '저장 실패');
    }
    // 폼 비우고 목록 새로고침
    $('#title').value = '';
    $('#content').value = '';
    await loadEntries();
  } catch (e) {
    alert(e.message);
  }
}

//페이지 로드 시 초기화 
document.addEventListener('DOMContentLoaded', () => {
  // 기본 날짜를 오늘로
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  $('#date').value = `${y}-${m}-${d}`;

  $('#entry-form').addEventListener('submit', submitEntry);
  loadEntries();
});
// 테마 토글 버튼
document.querySelector('#theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  document.querySelector('#theme-toggle').textContent = dark ? '☀️ 라이트모드' : '🌙 다크모드';
});
