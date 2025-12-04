// 全要素を格納する配列。各要素は { name: string, point: number } の形式
let elements = [];
const messageEl = document.getElementById('message');
const comparisonButtonsEl = document.getElementById('comparison-buttons');
const rankingListEl = document.getElementById('ranking-list');
const comparisonAreaEl = document.getElementById('comparison-area');

/**
 * 1. 要素入力からアプリを初期化し、比較を開始する
 */
function initializeApp() {
    const inputNames = document.getElementById('element-names').value.trim();
    if (!inputNames) {
        messageEl.textContent = '要素名を入力してください。';
        return;
    }

    // 入力を改行で区切り、要素配列を初期化 (ポイントは0からスタート)
    const namesArray = inputNames.split('\n').filter(name => name.trim() !== '');
    if (namesArray.length < 2) {
        messageEl.textContent = '比較には2つ以上の要素が必要です。';
        return;
    }
    
    elements = namesArray.map(name => ({
        name: name.trim(),
        point: 0
    }));

    // 初期化メッセージ
    messageEl.textContent = `${elements.length}個の要素で比較を開始します。`;
    
    // 結果エリアとボタンエリアをリセット
    rankingListEl.innerHTML = '';
    comparisonAreaEl.style.display = 'block';

    // 最初の比較を開始
    startComparison();
}

/**
 * 2. 比較が必要な要素リストを特定し、2つランダムに選んで表示する
 */
function startComparison() {
    // 4. 全要素のポイントがユニークになったら終了
    const isUnique = checkAllPointsUnique();
    if (isUnique) {
        messageEl.textContent = '全ての要素の順位が確定しました！';
        comparisonButtonsEl.innerHTML = ''; // 比較ボタンを非表示
        displayResult(); // 結果表示
        return;
    }

    // 1. 比較が必要な要素リスト（ポイントが同じ要素のグループ）を見つける
    const pointsMap = groupElementsByPoint();
    
    // 比較対象となるポイント値のリスト (要素数が2つ以上あるポイント)
    const comparablePoints = Object.keys(pointsMap).filter(point => pointsMap[point].length >= 2);

    if (comparablePoints.length === 0) {
        // 理論上は checkAllPointsUnique で捕まるが、念のため
        messageEl.textContent = '比較可能な要素が見つかりません。ランキングを確定します。';
        displayResult();
        return;
    }
    
    // 比較対象となるポイント値からランダムに1つ選ぶ
    const randomPoint = comparablePoints[Math.floor(Math.random() * comparablePoints.length)];
    
    // 選ばれたポイントを持つ要素リスト
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
    // 勝者のポイントを1加算
    const winner = elements.find(el => el.name === winnerName);
    if (winner) {
        winner.point += 1;
        messageEl.textContent = `「${winnerName}」を選択しました。ポイントが加算されました。`;
    }

    // 次の比較を開始
    startComparison();
}


// --- ユーティリティ関数 ---

/**
 * 4. 全要素のポイントがユニークかどうかを確認する
 */
function checkAllPointsUnique() {
    const uniquePoints = new Set(elements.map(el => el.point));
    return uniquePoints.size === elements.length;
}

/**
 * 1. ポイントごとに要素をグループ化する
 */
function groupElementsByPoint() {
    const map = {};
    elements.forEach(el => {
        if (!map[el.point]) {
            map[el.point] = [];
        }
        map[el.point].push(el);
    });
    return map; // 例: { '0': [{name:'A', point:0}, {name:'B', point:0}], '1': [...] }
}

/**
 * 2. リストからランダムに2つの異なる要素を選ぶ
 * @param {Array<Object>} list - 比較する要素のリスト
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

/**
 * 画面に比較ボタンを表示する
 */
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
 * 5. ランキングを降順で表示する
 */
function displayResult() {
    // ポイントの降順でソート (ポイントが同じ場合は名前でソート)
    const sortedElements = [...elements].sort((a, b) => {
        if (b.point !== a.point) {
            return b.point - a.point; // 降順
        }
        return a.name.localeCompare(b.name); // 名前で昇順
    });

    rankingListEl.innerHTML = ''; // リストをクリア
    
    sortedElements.forEach((el, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `第${index + 1}位: ${el.name} (${el.point}ポイント)`;
        rankingListEl.appendChild(listItem);
    });

    comparisonAreaEl.style.display = 'none'; // 比較エリアを非表示
}