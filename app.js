// 全要素を格納する配列。各要素は { name: string, point: number } の形式
let elements = [];
let comparisonCounter = 0; // 比較回数カウンター (新規追加)

// DOM要素の取得
const messageEl = document.getElementById('message');
const comparisonButtonsEl = document.getElementById('comparison-buttons');
const rankingListEl = document.getElementById('ranking-list');
const comparisonAreaEl = document.getElementById('comparison-area');

// 新規追加のDOM要素
const comparisonCountEl = document.getElementById('comparison-count');
const uniquePointsCountEl = document.getElementById('unique-points-count');
const totalElementsCountEl = document.getElementById('total-elements-count');
const outputJsonEl = document.getElementById('output-json');
const inputJsonDataEl = document.getElementById('input-json-data');
const jsonIoAreaEl = document.getElementById('json-io-area');


/**
 * 1. 要素入力からアプリを初期化し、比較を開始する
 */
function initializeApp() {
    const inputNames = document.getElementById('element-names').value.trim();
    if (!inputNames) {
        messageEl.textContent = '要素名を入力してください。';
        return;
    }

    const namesArray = inputNames.split('\n').filter(name => name.trim() !== '');
    if (namesArray.length < 2) {
        messageEl.textContent = '比較には2つ以上の要素が必要です。';
        return;
    }
    
    // elements配列を初期化 (ポイントは0からスタート)
    elements = namesArray.map(name => ({
        name: name.trim(),
        point: 0
    }));

    comparisonCounter = 0; // カウンターをリセット
    rankingListEl.innerHTML = '';
    comparisonAreaEl.style.display = 'block';

    messageEl.textContent = `${elements.length}個の要素で比較を開始します。`;
    
    updateStatus(); // 途中経過を更新 (新規追加)
    exportToJSON(); // JSON出力 (新規追加)
    startComparison();
}

/**
 * 2. 比較が必要な要素リストを特定し、2つランダムに選んで表示する
 */
function startComparison() {
    // 4. 全要素のポイントがユニークになったら終了
    const isUnique = checkAllPointsUnique();
    if (isUnique) {
        messageEl.textContent = '🏆 全ての要素の順位が確定しました！';
        comparisonButtonsEl.innerHTML = ''; 
        displayResult(); // 結果表示
        return;
    }

    // 1. 比較が必要な要素リスト（ポイントが同じ要素のグループ）を見つける
    const pointsMap = groupElementsByPoint();
    
    // 比較対象となるポイント値のリスト (要素数が2つ以上あるポイント)
    const comparablePoints = Object.keys(pointsMap).filter(point => pointsMap[point].length >= 2);

    if (comparablePoints.length === 0) {
        // 全要素がユニークでないのに比較可能な要素がない場合、ロジックエラーまたは特殊な状態
        messageEl.textContent = 'エラー: 比較可能な要素が見つかりません。ランキングを確定します。';
        displayResult();
        return;
    }
    
    // 比較対象となるポイント値からランダムに1つ選ぶ
    const randomPoint = comparablePoints[Math.floor(Math.random() * comparablePoints.length)];
    const listToCompare = pointsMap[randomPoint];

    // 3. そのリストから2つをランダムに選ぶ
    const [elementA, elementB] = getRandomPair(listToCompare);

    // 画面にボタンを表示
    renderComparison(elementA, elementB);
}

/**
 * 3. ユーザーの選択を受け取り、勝者のポイントを加算して次の比較に進む
 * @param {string} winnerName - ユーザーが選択した要素の名前
 */
function selectWinner(winnerName) {
    const winner = elements.find(el => el.name === winnerName);
    if (winner) {
        winner.point += 1;
        comparisonCounter += 1; // 比較回数をカウントアップ (新規追加)
        messageEl.textContent = `「${winnerName}」を選択しました。ポイントが加算されました。`;
    }

    updateStatus();  // 途中経過を更新 (新規追加)
    exportToJSON();  // JSON出力も更新 (新規追加)
    
    // 次の比較を開始
    startComparison();
}

// ------------------------------------
// ユーティリティ関数（改修・新規追加）
// ------------------------------------

/**
 * 6. 途中経過を計算し、画面に表示する (新規追加)
 */
function updateStatus() {
    const uniquePoints = new Set(elements.map(el => el.point));
    
    comparisonCountEl.textContent = comparisonCounter;
    uniquePointsCountEl.textContent = uniquePoints.size;
    totalElementsCountEl.textContent = elements.length;

    // 途中経過でのポイント順位も表示
    const sortedElements = [...elements].sort((a, b) => b.point - a.point);
    rankingListEl.innerHTML = '';
    sortedElements.forEach((el, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `暫定順位: ${el.name} (${el.point}ポイント)`;
        rankingListEl.appendChild(listItem);
    });
}


/**
 * 6. elements配列の状態をJSONとして出力する (新規追加)
 */
function exportToJSON() {
    const dataToSave = {
        elements: elements,
        counter: comparisonCounter,
    };
    // JSON.stringify(データ, null, 2)で、整形されたJSON文字列を生成
    outputJsonEl.value = JSON.stringify(dataToSave, null, 2);
}

/**
 * 6. JSONを入力し、elements配列の状態を復元する (新規追加)
 */
function loadFromJSON() {
    const jsonString = inputJsonDataEl.value.trim();
    if (!jsonString) {
        alert('JSONデータをテキストエリアに貼り付けてください。');
        return;
    }

    try {
        const loadedData = JSON.parse(jsonString);

        if (!Array.isArray(loadedData.elements)) {
             throw new Error('JSONデータが無効です。elements配列が見つかりません。');
        }
        
        elements = loadedData.elements;
        comparisonCounter = loadedData.counter || 0; // カウンターも復元
        
        messageEl.textContent = `JSONデータから${elements.length}個の要素を読み込み、比較を再開します。`;
        
        // 状態を更新して、JSONを再出力し、比較を再開
        updateStatus();
        exportToJSON(); 
        startComparison();

    } catch (e) {
        alert('JSONデータの読み込みに失敗しました。形式を確認してください。エラー: ' + e.message);
    }
}

/**
 * JSONコピーボタンの処理 (新規追加)
 */
function copyToClipboard() {
    outputJsonEl.select();
    document.execCommand('copy');
    alert('JSONデータをクリップボードにコピーしました！');
}


// --- 既存のユーティリティ関数（変更なし） ---

function checkAllPointsUnique() {
    const uniquePoints = new Set(elements.map(el => el.point));
    return uniquePoints.size === elements.length;
}

function groupElementsByPoint() {
    const map = {};
    elements.forEach(el => {
        if (!map[el.point]) {
            map[el.point] = [];
        }
        map[el.point].push(el);
    });
    return map;
}

function getRandomPair(list) {
    if (list.length < 2) return [];

    let index1 = Math.floor(Math.random() * list.length);
    let index2;
    do {
        index2 = Math.floor(Math.random() * list.length);
    } while (index1 === index2);

    return [list[index1], list[index2]];
}

function renderComparison(elA, elB) {
    comparisonButtonsEl.innerHTML = '';
    
    const buttonA = document.createElement('button');
    buttonA.textContent = elA.name;
    buttonA.onclick = () => selectWinner(elA.name);

    const buttonB = document.createElement('button');
    buttonB.textContent = elB.name;
    buttonB.onclick = () => selectWinner(elB.name);

    comparisonButtonsEl.appendChild(buttonA);
    comparisonButtonsEl.appendChild(document.createTextNode(' vs '));
    comparisonButtonsEl.appendChild(buttonB);
}

/**
 * 5. 最終ランキングを降順で表示する
 */
function displayResult() {
    const sortedElements = [...elements].sort((a, b) => {
        if (b.point !== a.point) {
            return b.point - a.point;
        }
        return a.name.localeCompare(b.name);
    });

    rankingListEl.innerHTML = '<h3>🎉 最終ランキング 🎉</h3>';
    
    sortedElements.forEach((el, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `第${index + 1}位: ${el.name} (${el.point}ポイント)`;
        rankingListEl.appendChild(listItem);
    });

    comparisonAreaEl.style.display = 'none';
    jsonIoAreaEl.style.display = 'none'; // 最終結果表示後はJSONエリアも非表示にするなど、必要に応じて
}