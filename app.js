// 全要素を格納する配列。各要素は { name: string, point: number, comparedWith: string[] } の形式
let elements = [];
let comparisonCounter = 0; // 比較回数カウンター

// DOM要素の取得
const messageEl = document.getElementById('message');
const comparisonButtonsEl = document.getElementById('comparison-buttons');
const rankingListEl = document.getElementById('ranking-list');
const comparisonAreaEl = document.getElementById('comparison-area');
const comparisonStatusMessageEl = document.getElementById('comparison-status-message'); // 新規追加

// 途中経過とJSON入出力のDOM要素
const comparisonCountEl = document.getElementById('comparison-count');
const uniquePointsCountEl = document.getElementById('unique-points-count');
const totalElementsCountEl = document.getElementById('total-elements-count');
const uncomparedPairsCountEl = document.getElementById('uncompared-pairs-count'); // 新規追加
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
    
    // elements配列を初期化 (ポイントは0から、比較履歴も空でスタート)
    elements = namesArray.map(name => ({
        name: name.trim(),
        point: 0,
        comparedWith: [], // 新規フィールド
    }));

    comparisonCounter = 0; // カウンターをリセット
    rankingListEl.innerHTML = '';
    comparisonAreaEl.style.display = 'block';
    jsonIoAreaEl.style.display = 'block';

    messageEl.textContent = `${elements.length}個の要素で比較を開始します。`;
    
    updateStatus(); 
    exportToJSON(); 
    startComparison();
}

/**
 * 2 & 4追加. 比較ペアを選択するメインロジック
 */
function startComparison() {
    // 4. 全要素のポイントがユニークになったら終了
    const isUnique = checkAllPointsUnique();
    const uncomparedPair = findUncomparedPair(); // 新規: 未比較ペアの確認

    if (uncomparedPair === null && isUnique) {
        // 最終完了条件: 全てのペアが比較され、かつ全ポイントがユニーク
        messageEl.textContent = '🏆 最終順位が確定しました！';
        comparisonButtonsEl.innerHTML = ''; 
        comparisonStatusMessageEl.textContent = '';
        displayResult();
        return;
    }
    
    let elementA, elementB;
    let comparisonType = '';

    if (uncomparedPair !== null) {
        // 優先度 1: 未比較ペアが存在する場合、それを比較する
        elementA = uncomparedPair[0];
        elementB = uncomparedPair[1];
        comparisonType = '未比較ペアの解消';
        comparisonStatusMessageEl.textContent = '（優先：このペアはまだ比較されていません）';
    } else {
        // 優先度 2: 未比較ペアがない場合、ポイントが同じ要素の中からペアを選ぶ
        const pointsMap = groupElementsByPoint();
        const comparablePoints = Object.keys(pointsMap).filter(point => pointsMap[point].length >= 2);

        if (comparablePoints.length === 0) {
            // 未比較ペアがなく、かつポイントが同じ要素も存在しない場合
            messageEl.textContent = '比較すべき要素が見つかりません。全ての比較が完了しました。';
            displayResult();
            return;
        }

        const randomPoint = comparablePoints[Math.floor(Math.random() * comparablePoints.length)];
        const listToCompare = pointsMap[randomPoint];

        [elementA, elementB] = getRandomPair(listToCompare);
        comparisonType = '同ポイント対決';
        comparisonStatusMessageEl.textContent = `（同ポイント対決：ポイント ${randomPoint} の要素同士を比較）`;
    }

    // 画面にボタンを表示
    renderComparison(elementA, elementB);
}

/**
 * 3. ユーザーの選択を受け取り、勝者のポイントを加算して次の比較に進む
 * @param {string} winnerName - ユーザーが選択した要素の名前
 * @param {string} loserName - ユーザーが選択しなかった要素の名前
 */
function selectWinner(winnerName, loserName) {
    const winner = elements.find(el => el.name === winnerName);
    const loser = elements.find(el => el.name === loserName);

    if (winner && loser) {
        winner.point += 1;
        comparisonCounter += 1;

        // 比較履歴の更新 (新規ロジック)
        if (!winner.comparedWith.includes(loserName)) {
            winner.comparedWith.push(loserName);
        }
        if (!loser.comparedWith.includes(winnerName)) {
            loser.comparedWith.push(winnerName);
        }

        messageEl.textContent = `「${winnerName}」が勝利し、ポイントが加算されました。`;
    }

    updateStatus();  
    exportToJSON();  
    
    // 次の比較を開始
    startComparison();
}


// ------------------------------------
// ユーティリティ関数
// ------------------------------------

/**
 * 4追加. まだ比較されていない要素ペアをランダムに一つ見つける
 * @returns {Array<Object, Object> | null} 未比較ペア、または全て比較済みなら null
 */
function findUncomparedPair() {
    const totalElements = elements.length;
    if (totalElements < 2) return null;

    const uncomparedPairs = [];

    // すべての要素の組み合わせをチェック
    for (let i = 0; i < totalElements; i++) {
        for (let j = i + 1; j < totalElements; j++) {
            const el1 = elements[i];
            const el2 = elements[j];

            // el1の履歴にel2が含まれていないかチェック
            if (!el1.comparedWith.includes(el2.name)) {
                uncomparedPairs.push([el1, el2]);
            }
        }
    }
    
    // 未比較ペアが存在すれば、その中からランダムに一つ選ぶ
    if (uncomparedPairs.length > 0) {
        return uncomparedPairs[Math.floor(Math.random() * uncomparedPairs.length)];
    }

    return null;
}

/**
 * 6. 途中経過を計算し、画面に表示する
 */
function updateStatus() {
    const uniquePoints = new Set(elements.map(el => el.point));
    const uncomparedPairCount = countUncomparedPairs();
    
    comparisonCountEl.textContent = comparisonCounter;
    uniquePointsCountEl.textContent = uniquePoints.size;
    totalElementsCountEl.textContent = elements.length;
    uncomparedPairsCountEl.textContent = uncomparedPairCount; // 新規追加

    // 暫定ランキング表示
    const sortedElements = [...elements].sort((a, b) => b.point - a.point);
    rankingListEl.innerHTML = '<h3>🏆 暫定ランキング 🏆</h3>';
    
    sortedElements.forEach((el, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `暫定順位: ${el.name} (${el.point}ポイント)`;
        rankingListEl.appendChild(listItem);
    });
}

/**
 * 4追加. 未比較ペアの総数を数える
 */
function countUncomparedPairs() {
    const totalElements = elements.length;
    let count = 0;
    
    for (let i = 0; i < totalElements; i++) {
        for (let j = i + 1; j < totalElements; j++) {
            const el1 = elements[i];
            const el2 = elements[j];
            if (!el1.comparedWith.includes(el2.name)) {
                count++;
            }
        }
    }
    return count;
}


/**
 * 6. elements配列の状態をJSONとして出力する
 */
function exportToJSON() {
    const dataToSave = {
        elements: elements,
        counter: comparisonCounter,
    };
    outputJsonEl.value = JSON.stringify(dataToSave, null, 2);
}

/**
 * 6. JSONを入力し、elements配列の状態を復元する
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
        
        // comparedWithフィールドのチェックと補完
        elements = loadedData.elements.map(el => ({
            name: el.name,
            point: el.point,
            comparedWith: el.comparedWith || [] // 履歴がない場合は空配列
        }));
        comparisonCounter = loadedData.counter || 0;
        
        messageEl.textContent = `JSONデータから${elements.length}個の要素を読み込み、比較を再開します。`;
        
        updateStatus();
        exportToJSON(); 
        startComparison();

    } catch (e) {
        alert('JSONデータの読み込みに失敗しました。形式を確認してください。エラー: ' + e.message);
    }
}


// --- その他のユーティリティ ---

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

/**
 * リストからランダムに2つの異なる要素を選ぶ (ポイント比較用)
 */
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
    buttonA.onclick = () => selectWinner(elA.name, elB.name); // 敗者の名前も渡す

    const buttonB = document.createElement('button');
    buttonB.textContent = elB.name;
    buttonB.onclick = () => selectWinner(elB.name, elA.name); // 敗者の名前も渡す

    comparisonButtonsEl.appendChild(buttonA);
    comparisonButtonsEl.appendChild(document.createTextNode(' vs '));
    comparisonButtonsEl.appendChild(buttonB);
}

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
    jsonIoAreaEl.style.display = 'none';
}

function copyToClipboard() {
    outputJsonEl.select();
    document.execCommand('copy');
    alert('JSONデータをクリップボードにコピーしました！');
}