// データ保持用の配列（LocalStorageから読み込む）
let words = JSON.parse(localStorage.getItem('gengyo_words')) || [];
let currentTags = [];
let activeFilterTag = 'all';

// DOM要素の取得
const wordInput = document.getElementById('word-input');
const readingInput = document.getElementById('reading-input');
const meaningInput = document.getElementById('meaning-input');
const linkInput = document.getElementById('link-input');
const tagInput = document.getElementById('tag-input');
const addTagBtn = document.getElementById('add-tag-btn');
const selectedTagsContainer = document.getElementById('selected-tags');
const saveBtn = document.getElementById('save-btn');
const searchInput = document.getElementById('search-input');
const filterTagsContainer = document.getElementById('filter-tags');
const wordListContainer = document.getElementById('word-list');

// 1. タグ追加処理
function addTag() {
  if (!tagInput) return;
  const tagText = tagInput.value.trim();
  if (tagText && !currentTags.includes(tagText)) {
    currentTags.push(tagText);
    renderInputTags();
    tagInput.value = '';
  }
}

if (addTagBtn) {
  addTagBtn.addEventListener('click', addTag);
}

if (tagInput) {
  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  });
}

function renderInputTags() {
  if (!selectedTagsContainer) return;
  selectedTagsContainer.innerHTML = '';
  currentTags.forEach((tag, index) => {
    const tagEl = document.createElement('span');
    tagEl.className = 'tag';
    tagEl.style.cursor = 'pointer';
    tagEl.innerHTML = `${tag} <span style="margin-left:6px; font-weight:bold;">×</span>`;
    tagEl.addEventListener('click', () => removeTag(index));
    selectedTagsContainer.appendChild(tagEl);
  });
}

function removeTag(index) {
  currentTags.splice(index, 1);
  renderInputTags();
}

// 2. 言葉の保存処理
if (saveBtn) {
  saveBtn.addEventListener('click', () => {
    const word = wordInput.value.trim();
    const reading = readingInput.value.trim();
    const meaning = meaningInput.value.trim();
    let link = linkInput ? linkInput.value.trim() : '';

    if (!word) {
      alert('釣った言葉を入力してください！');
      return;
    }

    if (link && !link.startsWith('http://') && !link.startsWith('https://')) {
      link = 'https://' + link;
    }

    const newWord = {
      id: Date.now(),
      word,
      reading,
      meaning,
      link,
      tags: [...currentTags]
    };

    words.unshift(newWord);
    localStorage.setItem('gengyo_words', JSON.stringify(words));

    // フォームのリセット（入力文字と選択中タグをクリア）
    wordInput.value = '';
    readingInput.value = '';
    meaningInput.value = '';
    if (linkInput) linkInput.value = '';
    if (tagInput) tagInput.value = '';
    currentTags = [];
    renderInputTags();

    // 画面とフィルターの更新
    updateFilterTags();
    renderWords();
  });
}

// 3. 検索＆フィルター処理
if (searchInput) {
  searchInput.addEventListener('input', () => {
    renderWords();
  });
}

function updateFilterTags() {
  if (!filterTagsContainer) return;

  const allTags = new Set();
  words.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach(tag => allTags.add(tag));
    }
  });

  filterTagsContainer.innerHTML = '';

  const allBtn = document.createElement('span');
  allBtn.className = `tag filter-tag ${activeFilterTag === 'all' ? 'active' : ''}`;
  allBtn.textContent = 'すべて';
  allBtn.style.cursor = 'pointer';
  allBtn.addEventListener('click', () => {
    activeFilterTag = 'all';
    updateFilterTags();
    renderWords();
  });
  filterTagsContainer.appendChild(allBtn);

  allTags.forEach(tag => {
    const tagEl = document.createElement('span');
    tagEl.className = `tag filter-tag ${activeFilterTag === tag ? 'active' : ''}`;
    tagEl.textContent = tag;
    tagEl.style.cursor = 'pointer';
    tagEl.addEventListener('click', () => {
      activeFilterTag = tag;
      updateFilterTags();
      renderWords();
    });
    filterTagsContainer.appendChild(tagEl);
  });
}

// 4. 言葉カードの描画
function renderWords() {
  if (!wordListContainer) return;
  wordListContainer.innerHTML = '';
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filteredWords = words.filter(item => {
    const matchesKeyword = !keyword || 
      (item.word && item.word.toLowerCase().includes(keyword)) ||
      (item.reading && item.reading.toLowerCase().includes(keyword)) ||
      (item.meaning && item.meaning.toLowerCase().includes(keyword));
    
    const matchesTag = activeFilterTag === 'all' || (item.tags && item.tags.includes(activeFilterTag));

    return matchesKeyword && matchesTag;
  });

  if (filteredWords.length === 0) {
    wordListContainer.innerHTML = '<p style="text-align:center; opacity:0.6; padding:20px; font-style:italic;">該当する言魚が見つかりません</p>';
    return;
  }

  filteredWords.forEach(item => {
    const card = document.createElement('div');
    card.className = 'input-form';
    card.style.position = 'relative';

    const tagsHtml = (item.tags && item.tags.length > 0)
      ? item.tags.map(t => `<span class="tag">${t}</span>`).join(' ')
      : '';
      
    const linkHtml = item.link 
      ? `<p style="margin:6px 0;"><a href="${item.link}" target="_blank" rel="noopener noreferrer" style="color:var(--accent-terra); font-weight:bold; text-decoration:underline;">🔗 参照リンクを見る</a></p>` 
      : '';

    card.innerHTML = `
      <div style="font-size:0.8rem; opacity:0.7;">${item.reading || ''}</div>
      <h3 style="color:var(--accent-green); margin:4px 0 8px 0; font-size:1.4rem;">${item.word}</h3>
      <p style="margin-bottom:8px; line-height:1.4;">${item.meaning || ''}</p>
      ${linkHtml}
      <div class="tag-container" style="margin-top:8px;">${tagsHtml}</div>
      <button onclick="deleteWord(${item.id})" style="background:var(--accent-terra); color:#FFF; font-size:0.75rem; padding:4px 8px; border-radius:4px; margin-top:8px; width:auto; border:none; cursor:pointer;">言魚を逃がす</button>
    `;

    wordListContainer.appendChild(card);
  });
}

// 5. 削除機能
window.deleteWord = function(id) {
  if (confirm('この言魚を逃がしますか？（削除します）')) {
    words = words.filter(item => item.id !== id);
    localStorage.setItem('gengyo_words', JSON.stringify(words));
    updateFilterTags();
    renderWords();
  }
};

// 初回実行
updateFilterTags();
renderWords();