// DOMの読み込み完了後に実行
document.addEventListener('DOMContentLoaded', () => {
  const wordForm = document.getElementById('word-form');
  const wordInput = document.getElementById('word-input');
  const readingInput = document.getElementById('reading-input');
  const meaningInput = document.getElementById('meaning-input');
  const urlInput = document.getElementById('url-input');
  const tagInput = document.getElementById('tag-input');
  const searchInput = document.getElementById('search-input');
  const wordList = document.getElementById('word-list');

  // ローカルストレージからデータを取得（なければ空配列）
  let words = JSON.parse(localStorage.getItem('gyogyo_words')) || [];

  // 初期表示
  renderWords(words);

  // 1. フォーム送信（保存処理）
  wordForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newWord = {
      id: Date.now(),
      word: wordInput.value.trim(),
      reading: readingInput.value.trim(),
      meaning: meaningInput.value.trim(),
      url: urlInput.value.trim(),
      tags: tagInput.value.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      createdAt: new Date().toLocaleDateString('ja-JP')
    };

    words.unshift(newWord); // 新しいものを先頭に追加
    saveAndRender();

    // フォームリセット＆最初の入力欄へフォーカス移動
    wordForm.reset();
    wordInput.focus();
  });

  // 2. リアルタイム検索処理（言葉・読み・メモ・タグから一括検索）
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase().trim();

      if (!keyword) {
        renderWords(words);
        return;
      }

      // 言葉・読み・意味メモ・タグのいずれかにマッチするか判定
      const filteredWords = words.filter(item => {
        const matchWord = item.word && item.word.toLowerCase().includes(keyword);
        const matchReading = item.reading && item.reading.toLowerCase().includes(keyword);
        const matchMeaning = item.meaning && item.meaning.toLowerCase().includes(keyword);
        const matchTags = item.tags && item.tags.some(tag => tag.toLowerCase().includes(keyword));

        return matchWord || matchReading || matchMeaning || matchTags;
      });

      renderWords(filteredWords);
    });
  }

  // データを保存して描画更新
  function saveAndRender() {
    localStorage.setItem('gyogyo_words', JSON.stringify(words));
    renderWords(words);
  }

  // 一覧の描画処理
  function renderWords(list) {
    if (!wordList) return;
    wordList.innerHTML = '';

    if (list.length === 0) {
      wordList.innerHTML = '<p style="text-align: center; color: var(--accent-sage); padding: 20px;">該当する言葉が見つかりませんでした 🎣</p>';
      return;
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'word-card';
      card.style.cssText = `
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      `;

      // タグのHTML作成
      const tagsHtml = item.tags && item.tags.length > 0
        ? `<div style="margin-top: 8px;">${item.tags.map(t => `<span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 12px; font-size: 0.8rem; margin-right: 4px; color: var(--accent-green);">#${t}</span>`).join('')}</div>`
        : '';

      // URLリンクのHTML作成
      const urlHtml = item.url
        ? `<div style="margin-top: 6px;"><a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-green); font-size: 0.85rem; text-decoration: underline;">🔗 参照リンクを開く</a></div>`
        : '';

      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <h3 style="margin: 0; font-size: 1.2rem; color: var(--text-main);">${item.word}</h3>
          <span style="font-size: 0.75rem; color: var(--accent-sage);">${item.createdAt}</span>
        </div>
        ${item.reading ? `<p style="margin: 4px 0 8px 0; font-size: 0.85rem; color: var(--accent-sage);">${item.reading}</p>` : ''}
        ${item.meaning ? `<p style="margin: 8px 0; font-size: 0.95rem; white-space: pre-wrap;">${item.meaning}</p>` : ''}
        ${urlHtml}
        ${tagsHtml}
        <button onclick="deleteWord(${item.id})" style="margin-top: 10px; background: transparent; border: none; color: #FF6B6B; font-size: 0.8rem; cursor: pointer; padding: 0;">🗑 削除する</button>
      `;

      wordList.appendChild(card);
    });
  }

  // 削除機能をグローバルに登録
  window.deleteWord = function(id) {
    if (confirm('この釣果を削除してもよろしいですか？')) {
      words = words.filter(item => item.id !== id);
      saveAndRender();
    }
  };
});