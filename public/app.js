// ✅ 안전한 문자열 변환
const safe = (v) => (v == null ? '' : String(v));

// ✅ 서버에서 온 문서에서 _id 문자열 뽑기 (여러 형식 대응)
const getId = (e) => {
  if (!e) return '';
  const id = e._id ?? e.id;
  if (!id) return '';
  if (typeof id === 'string') return id;           // 보통 이 케이스
  if (typeof id === 'object') {
    if (id.$oid) return id.$oid;                   // 일부 직렬화 형식
    if (typeof id.toString === 'function') return id.toString(); // ObjectId인 경우
  }
  return String(id);
};

// 🔄 목록 불러오기
async function loadEntries() {
  const box = document.querySelector('#entries');
  const res = await fetch('/api/entries', { cache: 'no-store' }); // ← 캐시 끄기
  if (!res.ok) {
    box.innerHTML = '<p>목록을 불러오지 못했습니다.</p>';
    return;
  }
  const list = await res.json();
  console.log('entries(list):', list); // ← _id 확인용 로그

  box.innerHTML = list.map((e) => `
    <article class="entry" data-id="${e._id}">
      <h3 class="title"></h3>
      <p class="content"></p>
      <small>${e.date ?? ''}</small><br>
      <button class="btn-delete">삭제</button>
      <button class="btn-edit">수정</button>
    </article>
  `).join('');

  const articles = box.querySelectorAll('article.entry');
  list.forEach((e, i) => {
    const a = articles[i];
    a.querySelector('.title').textContent = e.title ?? '';
    a.querySelector('.content').textContent = e.content ?? '';
    // 각 카드에 박힌 id 확인
    console.log('rendered data-id:', a.dataset.id);
  });
}


// 📝 등록
async function handleSubmit(e) {
  e.preventDefault();
  const titleEl = document.querySelector('#title');
  const contentEl = document.querySelector('#content');
  const title = titleEl.value.trim();
  const content = contentEl.value.trim();

  if (!title || !content) {
    alert('제목과 내용을 입력해 주세요!');
    return;
  }

  const res = await fetch('/api/entries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content })
  });

  if (!res.ok) {
    const msg = await res.text();
    alert('등록 실패: ' + msg);
    return;
  }

  titleEl.value = '';
  contentEl.value = '';
  await loadEntries();
}

// 🗑️/✏️ 버튼(이벤트 위임)
document.addEventListener('click', async (e) => {
  const delBtn = e.target.closest('.btn-delete');
  const editBtn = e.target.closest('.btn-edit');

  // 삭제
  if (delBtn) {
    const article = delBtn.closest('article.entry');
    const id = article?.dataset?.id;
    if (!id) {
      alert('삭제 실패: id를 찾지 못했습니다.');
      return;
    }
    if (!confirm('정말 삭제할까요?')) return;

    const res = await fetch(`/api/entries/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (res.ok) {
      await loadEntries();
    } else {
      const msg = await res.text();
      alert('삭제 실패: ' + msg);
    }
  }

  // 수정
  if (editBtn) {
    const article = editBtn.closest('article.entry');
    const id = article?.dataset?.id;
    if (!id) {
      alert('수정 실패: id를 찾지 못했습니다.');
      return;
    }

    const oldTitle = article.querySelector('.title').textContent;
    const oldContent = article.querySelector('.content').textContent;

    const newTitle = prompt('새 제목을 입력하세요', oldTitle);
    if (newTitle === null) return;

    const newContent = prompt('새 내용을 입력하세요', oldContent);
    if (newContent === null) return;

    const res = await fetch(`/api/entries/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, content: newContent })
    });

    if (res.ok) {
      await loadEntries();
    } else {
      const msg = await res.text();
      alert('수정 실패: ' + msg);
    }
  }
});

// 폼 이벤트 + 초기 로드
document.querySelector('#write-form').addEventListener('submit', handleSubmit);
loadEntries();
