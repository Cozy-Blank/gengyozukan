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

// ひらがなをカタカナに変換する便利関数
function hiraToKata(str) {
  return str.replace(/[\u3041-\u3096]/g, function(match) {
    var chr = match.charCodeAt(0) + 0x60;
    return String.fromCharCode(chr);
  });
}

// 1. タグ追加処理（カンマや読点で自動分割！）
function addTag() {
  if (!tagInput) return;
  const rawText = tagInput.value.trim();
  if (!rawText) return;

  // カンマ(,)や読点(、)やスペースで分割
  const splitTags = rawText.split(/[,、\s]+/);

  splitTags.forEach(tagText => {
    const cleanTag = tagText.trim();
    if (cleanTag && !currentTags.includes(cleanTag)) {
      currentTags.push(cleanTag);
    }
  });

  renderInputTags();
  tagInput.value = '';
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

    // フォームのリセット
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
      item.tags.forEach(tag => {
        // カンマが混ざって保存された古いデータも分解して綺麗に表示
        tag.split(/[,、\s]+/).forEach(t => {
          if (t.trim()) allTags.add(t.trim());
        });
      });
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
  const kataKeyword = hiraToKata(keyword);

  const filteredWords = words.filter(item => {
    const wordStr = (item.word || '').toLowerCase();
    const readingStr = (item.reading || '').toLowerCase();
    const meaningStr = (item.meaning || '').toLowerCase();

    // タグの中にマッチするか（カンマ区切りデータも分解して判定）
    const matchesTagKeyword = item.tags && item.tags.some(t => {
      const tStr = t.toLowerCase();
      return tStr.includes(keyword) || tStr.includes(kataKeyword);
    });

    const matchesKeyword = !keyword || 
      wordStr.includes(keyword) || wordStr.includes(kataKeyword) ||
      readingStr.includes(keyword) || readingStr.includes(kataKeyword) ||
      meaningStr.includes(keyword) || meaningStr.includes(kataKeyword) ||
      matchesTagKeyword;
    
    // タグボタンによる絞り込み（古いカンマ結合データにも柔軟に対応）
    const matchesTagFilter = activeFilterTag === 'all' || 
      (item.tags && item.tags.some(t => t.split(/[,、\s]+/).includes(activeFilterTag)));

    return matchesKeyword && matchesTagFilter;
  });

  if (filteredWords.length === 0) {
    wordListContainer.innerHTML = '<p style="text-align:center; opacity:0.6; padding:20px; font-style:italic;">該当する言魚が見つかりません</p>';
    return;
  }

  filteredWords.forEach(item => {
    const card = document.createElement('div');
    card.className = 'input-form';
    card.style.position = 'relative';

    // カンマ区切りのタグも綺麗に個別のタグタグとして展開
    let displayTags = [];
    if (item.tags && item.tags.length > 0) {
      item.tags.forEach(t => {
        t.split(/[,、\s]+/).forEach(subT => {
          if (subT.trim()) displayTags.push(subT.trim());
        });
      });
    }

    const tagsHtml = displayTags.map(t => `<span class="tag">${t}</span>`).join(' ');
      
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