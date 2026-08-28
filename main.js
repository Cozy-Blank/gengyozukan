// データ保持用の配列（ブラウザのLocalStorageから読み込む）
let words = JSON.parse(localStorage.getItem('gengyo_words')) || [];
let currentTags = [];
let activeFilterTag = 'all';

// DOM要素の取得
const wordInput = document.getElementById('word-input');
const readingInput = document.getElementById('reading-input');
const meaningInput = document.getElementById('meaning-input');
const linkInput = document.getElementById('link-input');
const tagInput = document.getElementById('tag-input');
const selectedTagsContainer = document.getElementById('selected-tags');
const saveBtn = document.getElementById('save-btn');
const searchInput = document.getElementById('search-input');
const filterTagsContainer = document.getElementById('filter-tags');

// 表示領域（index.htmlに存在しない場合は動的に作成）
let wordListContainer = document.getElementById('word-list');
if (!wordListContainer) {
  wordListContainer = document.createElement('section');
  wordListContainer.id = 'word-list';
  wordListContainer.className = 'word-list-section';
  document.body.appendChild(wordListContainer);
}

// 1. タグ入力の処理
if (tagInput) {
  tagInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const tagText = tagInput.value.trim();
      if (tagText && !currentTags.includes(tagText)) {
        currentTags.push(tagText);
        renderInputTags();
        tagInput.value = '';
      }
    }
  });
}

function renderInputTags() {
  selectedTagsContainer.innerHTML = '';
  currentTags.forEach((tag, index) => {
    const tagEl = document.createElement('span');
    tagEl.className = 'tag';
    tagEl.innerHTML = `${tag} <span class="tag-remove" onclick="removeTag(${index})">×</span>`;
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
    const link = linkInput.value.trim();

    if (!word) {
      alert('釣った言葉を入力してください！');
      return;
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

    // フォームのリセット
    wordInput.value = '';
    readingInput.value = '';
    meaningInput.value = '';
    linkInput.value = '';
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
  // 登録されている全タグを抽出
  const allTags = new Set();
  words.forEach(item => {
    if (item.tags) item.tags.forEach(tag => allTags.add(tag));
  });

  filterTagsContainer.innerHTML = `<span class="tag filter-tag ${activeFilterTag === 'all' ? 'active' : ''}" data-tag="all">すべて</span>`;

  allTags.forEach(tag => {
    const tagEl = document.createElement('span');
    tagEl.className = `tag filter-tag ${activeFilterTag === tag ? 'active' : ''}`;
    tagEl.dataset.tag = tag;
    tagEl.textContent = tag;
    filterTagsContainer.appendChild(tagEl);
  });

  // フィルタータグのクリックイベント設定
  document.querySelectorAll('.filter-tag').forEach(el => {
    el.addEventListener('click', (e) => {
      activeFilterTag = e.target.dataset.tag;
      updateFilterTags();
      renderWords();
    });
  });
}

// 4. 保存した言葉カードの描画処理
function renderWords() {
  wordListContainer.innerHTML = '';
  const keyword = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filteredWords = words.filter(item => {
    const matchesKeyword = item.word.toLowerCase().includes(keyword) || 
                           item.reading.toLowerCase().includes(keyword) ||
                           item.meaning.toLowerCase().includes(keyword);
    
    const matchesTag = activeFilterTag === 'all' || (item.tags && item.tags.includes(activeFilterTag));

    return matchesKeyword && matchesTag;
  });

  if (filteredWords.length === 0) {
    wordListContainer.innerHTML = '<p style="text-align:center; opacity:0.6; padding:20px;">言魚が見つかりません</p>';
    return;
  }

  filteredWords.forEach(item => {
    const card = document.createElement('div');
    card.className = 'input-form'; // 既存の深海カードスタイルを流用
    card.style.position = 'relative';

    const tagsHtml = item.tags ? item.tags.map(t => `<span class="tag">${t}</span>`).join(' ') : '';
    const linkHtml = item.link ? `<p><a href="${item.link}" target="_blank" style="color:var(--accent-gold);">参照リンクを見る</a></p>` : '';

    card.innerHTML = `
      <div style="font-size:0.8rem; opacity:0.7;">${item.reading}</div>
      <h3 style="color:var(--accent-gold); margin:4px 0 8px 0; font-size:1.4rem;">${item.word}</h3>
      <p style="margin-bottom:8px; line-height:1.4;">${item.meaning}</p>
      ${linkHtml}
      <div class="tag-container" style="margin-top:8px;">${tagsHtml}</div>
      <button onclick="deleteWord(${item.id})" style="background:#e63946; color:#fff; font-size:0.75rem; padding:4px 8px; border-radius:4px; margin-top:8px; width:auto;">削除</button>
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

// 初回読み込み時の描画
updateFilterTags();
renderWords();