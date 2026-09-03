// DOMの読み込み完了後に実行
document.addEventListener('DOMContentLoaded', () => {
  const wordForm = document.getElementById('word-form');
  const wordInput = document.getElementById('word-input');
  const readingInput = document.getElementById('reading-input');
  const meaningInput = document.getElementById('meaning-input');
  const urlInput = document.getElementById('url-input');
  const searchInput = document.getElementById('search-input');
  const wordList = document.getElementById('word-list');

  // ローカルストレージからデータを取得（なければ空配列）
  let words = JSON.parse(localStorage.getItem('gyogyo_words')) || [];

  // 初期表示
  renderWords(words);

  // 1. フォーム送信（保存処理）
  if (wordForm) {
    wordForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const newWord = {
        id: Date.now(),
        word: wordInput.value.trim(),
        reading: readingInput ? readingInput.value.trim() : '',
        meaning: meaningInput ? meaningInput.value.trim() : '',
        url: urlInput ? urlInput.value.trim() : '',
        createdAt: new Date().toLocaleDateString('ja-JP')
      };

      words.unshift(newWord); // 新しいものを先頭に追加
      saveAndRender();

      // フォームリセット＆最初の入力欄へフォーカス移動
      wordForm.reset();
      if (wordInput) wordInput.focus();
    });
  }

  // 2. リアルタイム検索処理（言葉・読み・メモから一括検索）
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const keyword = e.target.value.toLowerCase().trim();

      if (!keyword) {
        renderWords(words);
        return;
      }

      // 言葉・読み・意味メモのいずれかにマッチするか判定
      const filteredWords = words.filter(item => {
        const matchWord = item.word && item.word.toLowerCase().includes(keyword);
        const matchReading = item.reading && item.reading.toLowerCase().includes(keyword);
        const matchMeaning = item.meaning && item.meaning.toLowerCase().includes(keyword);

        return matchWord || matchReading || matchMeaning;
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
      wordList.innerHTML = '<p style="text-align: center; color: var(--accent-sage); padding: 20px;">言葉が見つかりませんでした 🐠</p>';
      return;
    }

    list.forEach(item => {
      const card = document.createElement('div');
      card.className = 'word-card';
      card.style.cssText = `
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 12px 16px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        transition: transform 0.2s ease, border-color 0.2s ease;
      `;

      // URLリンクのHTML作成
      const urlHtml = item.url
        ? `<div style="margin-top: 4px;"><a href="${item.url}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-green); font-size: 0.8rem; text-decoration: underline;" onclick="event.stopPropagation();">🔗 参照リンクを開く</a></div>`
        : '';

      // 削除ボタンを削り、パディングやマージンも詰めてすっきりコンパクトに！
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: baseline;">
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--text-main);">${item.word}</h3>
          <span style="font-size: 0.75rem; color: var(--accent-sage);">${item.createdAt}</span>
        </div>
        ${item.reading ? `<p style="margin: 2px 0 6px 0; font-size: 0.8rem; color: var(--accent-sage);">${item.reading}</p>` : ''}
        ${item.meaning ? `<p style="margin: 4px 0; font-size: 0.9rem; white-space: pre-wrap;">${item.meaning}</p>` : ''}
        ${urlHtml}
      `;

      // --- 長押し（ロングタップ）判定処理 ---
      let pressTimer = null;

      const startPress = () => {
        card.style.transform = 'scale(0.98)';
        pressTimer = setTimeout(() => {
          if (confirm(`「${item.word}」を水槽から削除してもよろしいですか？`)) {
            deleteWord(item.id);
          }
          card.style.transform = 'scale(1)';
        }, 600); // 0.6秒間長押しで発動
      };

      const cancelPress = () => {
        clearTimeout(pressTimer);
        card.style.transform = 'scale(1)';
      };

      // スマホ（タッチイベント）
      card.addEventListener('touchstart', startPress, { passive: true });
      card.addEventListener('touchend', cancelPress);
      card.addEventListener('touchmove', cancelPress);

      // パソコン（マウスイベント）
      card.addEventListener('mousedown', startPress);
      card.addEventListener('mouseup', cancelPress);
      card.addEventListener('mouseleave', cancelPress);

      wordList.appendChild(card);
    });
  }

  // 削除機能
  function deleteWord(id) {
    words = words.filter(item => item.id !== id);
    saveAndRender();
  }
});