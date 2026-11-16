// =========================================================================
// Скрипт: Умная облицовка шкафа (0.8 перед + 0.4 корпус)
// Базис-Мебельщик 2021-2024 JS (ES5)
// Кодировка: Windows-1251 (CP1251)
//
// НАДЕЖНЫЙ АЛГОРИТМ (КАК В ОРИГИНАЛЬНОМ СКРИПТЕ):
//   1. Выбор деталей: если доски уже выделены заранее — берутся они.
//      Если ничего не выделено — запрос клика (Esc/Enter — весь корпус шкафа).
//   2. Указание переда: клик на переднюю грань шкафа (Esc/Enter — стандартно вперед по Z).
//   3. Кромление:
//      - У каждой детали находится РОВНО ОДИН торец с максимальным Z (лицевой) -> кромка 0.8 мм.
//      - Остальные торцы детали проверяются IsButtVisible:
//        * Если открыт наружу -> кромка 0.4 мм.
//        * Если закрыт стыком с другой панелью -> чистый (без кромки).
//      - Фасады, двери и ДВП/ХДФ полностью пропускаются.
// =========================================================================

// --- 1. Настройка материалов кромки ---
var buttMat08 = NewButtMaterialInput('Кромка 0.8 мм (лицевая сторона)');
var buttMat04 = NewButtMaterialInput('Кромка 0.4 мм (видимый корпус)');

buttMat08.Thickness = 0.8;
buttMat08.ClipPanel = true;
buttMat08.Allowance = 0.8;

buttMat04.Thickness = 0.4;
buttMat04.ClipPanel = true;
buttMat04.Allowance = 0.4;

// Автопоиск кромочных материалов из текущей модели
function findModelMaterialName(targetThick) {
    var foundName = null;
    function scan(cnt) {
        if (!cnt || foundName) return;
        for (var i = 0; i < cnt.Count; i++) {
            var obj = cnt.Objects[i];
            if (obj && obj.AsPanel && obj.Butts) {
                for (var b = 0; b < obj.Butts.Count; b++) {
                    var bt = obj.Butts.Butts[b];
                    if (bt && bt.Material && Math.abs(bt.Thickness - targetThick) < 0.25) {
                        foundName = bt.Material;
                        return;
                    }
                }
            }
            if (obj && obj.Count && obj.Count > 0) scan(obj);
        }
    }
    try { scan(Model); } catch(e) {}
    return foundName;
}

var auto08 = findModelMaterialName(0.8);
if (auto08) buttMat08.Name = auto08; else buttMat08.Name = 'Кромка 0.8 мм';

var auto04 = findModelMaterialName(0.4);
if (auto04) buttMat04.Name = auto04; else buttMat04.Name = 'Кромка 0.4 мм';

// --- 2. Вспомогательные функции фильтрации ---

function isFacadePanel(obj) {
    if (!obj || !obj.AsPanel) return false;
    var nm = (obj.Name || '').toLowerCase();
    if (nm.indexOf('фасад') !== -1 || nm.indexOf('двер') !== -1 || nm.indexOf('створ') !== -1) {
        return true;
    }
    return false;
}

function isBackWall(obj) {
    if (!obj || !obj.AsPanel) return false;
    var nm = (obj.Name || '').toLowerCase();
    if (nm.indexOf('двп') !== -1 || nm.indexOf('хдф') !== -1 || nm.indexOf('задн') !== -1) {
        return true;
    }
    var thX = obj.GabMax.x - obj.GabMin.x;
    var thY = obj.GabMax.y - obj.GabMin.y;
    var thZ = obj.GabMax.z - obj.GabMin.z;
    var minTh = Math.min(thX, Math.min(thY, thZ));
    if (minTh < 8.0) return true;
    return false;
}

function extractPanels(obj, list) {
    if (!obj) return;
    if (obj.AsPanel) {
        list.push(obj.AsPanel);
    } else if (obj.Count && obj.Count > 0) {
        for (var i = 0; i < obj.Count; i++) {
            var child = obj.Objects ? obj.Objects[i] : obj[i];
            extractPanels(child, list);
        }
    }
}

// --- 3. ШАГ 1: ВЫБОР ДЕТАЛЕЙ ДЛЯ КРОМЛЕНИЯ ---
var rawPanels = [];

if (Model.SelectionCount > 0) {
    for (var s = 0; s < Model.SelectionCount; s++) {
        extractPanels(Model.Selections[s], rawPanels);
    }
} else {
    Action.Hint = 'Шаг 1/2: Кликните деталь (Esc - закончить выбор или Esc сразу для ВСЕГО корпуса)';
    while (true) {
        var picked = null;
        try {
            picked = GetPanel('Кликните деталь корпуса (Esc - готово / весь корпус)');
        } catch(ePick) {
            picked = null;
        }
        if (!picked) break;
        extractPanels(picked, rawPanels);
    }
    if (rawPanels.length === 0) {
        extractPanels(Model, rawPanels);
    }
}

var targetPanels = [];
var skippedFacades = 0;
var seenPanels = [];

function isAlreadyInTarget(p) {
    for (var k = 0; k < seenPanels.length; k++) {
        if (seenPanels[k] === p) return true;
    }
    return false;
}

for (var pIdx = 0; pIdx < rawPanels.length; pIdx++) {
    var pObj = rawPanels[pIdx];
    if (!pObj) continue;
    if (isAlreadyInTarget(pObj)) continue;
    seenPanels.push(pObj);

    if (isFacadePanel(pObj)) {
        skippedFacades++;
        continue;
    }
    if (isBackWall(pObj)) {
        continue;
    }
    targetPanels.push(pObj);
}

if (targetPanels.length === 0) {
    alert('Не выбрано ни одной детали корпуса для кромления!');
    Action.Finish();
}

// --- 4. ШАГ 2: ОПРЕДЕЛЕНИЕ НАПРАВЛЕНИЯ ПЕРЕДА ---
var frontDir = { x: 0, y: 0, z: 1 }; // По умолчанию лицо шкафа смотрит по оси +Z

try {
    Action.Hint = 'Шаг 2/2: Кликните точку на ЛИЦЕВОЙ стороне шкафа (Enter/Esc - направление вперед Z+)';
    var pFace = GetPoint('Кликните точку на лицевой стороне шкафа (Esc - вперед по Z)');
    if (pFace) {
        var midZ = (Model.GabMax.z + Model.GabMin.z) / 2;
        var midX = (Model.GabMax.x + Model.GabMin.x) / 2;
        var midY = (Model.GabMax.y + Model.GabMin.y) / 2;

        var dx = pFace.x - midX;
        var dy = pFace.y - midY;
        var dz = pFace.z - midZ;

        if (Math.abs(dz) >= Math.abs(dx) && Math.abs(dz) >= Math.abs(dy)) {
            frontDir = { x: 0, y: 0, z: (dz >= 0 ? 1 : -1) };
        } else if (Math.abs(dx) >= Math.abs(dz) && Math.abs(dx) >= Math.abs(dy)) {
            frontDir = { x: (dx >= 0 ? 1 : -1), y: 0, z: 0 };
        } else {
            frontDir = { x: 0, y: (dy >= 0 ? 1 : -1), z: 0 };
        }
    }
} catch(eFace) {
    frontDir = { x: 0, y: 0, z: 1 };
}

// Поиск ровно одного лицевого (переднего) торца на детали
function getFrontContourIndex(pan, fDir) {
    if (!pan || !pan.Contour || pan.Contour.Count === 0) return -1;

    var bestIdx = -1;
    var maxProj = -1e9;

    for (var i = 0; i < pan.Contour.Count; i++) {
        var elem = pan.Contour[i];
        if (elem && elem.Pos1 && elem.Pos2) {
            var p1 = pan.ToGlobal(NewVector(elem.Pos1.x, elem.Pos1.y, 0));
            var p2 = pan.ToGlobal(NewVector(elem.Pos2.x, elem.Pos2.y, 0));
            var midX = (p1.x + p2.x) / 2;
            var midY = (p1.y + p2.y) / 2;
            var midZ = (p1.z + p2.z) / 2;

            // Проекция середины ребра на вектор лица
            var proj = midX * fDir.x + midY * fDir.y + midZ * fDir.z;
            if (proj > maxProj) {
                maxProj = proj;
                bestIdx = i;
            }
        }
    }
    return bestIdx;
}

// --- 5. НАНЕСЕНИЕ КРОМКИ ---
var countPanels = 0;
var countFrontEdges = 0;
var countOpenEdges = 0;

for (var i = 0; i < targetPanels.length; i++) {
    var pan = targetPanels[i];
    StartEditing(pan);
    pan.Butts.Clear();

    if (pan.Contour && pan.Contour.Count) {
        var fIndex = getFrontContourIndex(pan, frontDir);

        for (var ce = 0; ce < pan.Contour.Count; ce++) {
            if (ce === fIndex) {
                // РОВНО ОДИН ЛИЦЕВОЙ ПЕРЕДНИЙ ТОРЕЦ -> КРОМКА 0.8 ММ
                var bFront = pan.AddButt(buttMat08, ce);
                if (bFront) {
                    bFront.ClipPanel = true;
                    bFront.Thickness = 0.8;
                    bFront.Material = buttMat08.Name;
                }
                countFrontEdges++;
            } else {
                // Проверяем, открыт ли торец наружу
                var isOpen = pan.IsButtVisible(ce, 5);
                if (isOpen) {
                    // ОТКРЫТЫЙ ТОРЕЦ КОРПУСА -> КРОМКА 0.4 ММ
                    var bOpen = pan.AddButt(buttMat04, ce);
                    if (bOpen) {
                        bOpen.ClipPanel = true;
                        bOpen.Thickness = 0.4;
                        bOpen.Material = buttMat04.Name;
                    }
                    countOpenEdges++;
                }
                // Закрытые стыки деталей остаются чистыми (без кромки)
            }
        }
    }
    pan.Build();
    countPanels++;
}

// --- 6. ЗАВЕРШЕНИЕ И ОТЧЕТ ---
Action.Commit();

var summaryHint = 'Готово! Деталей: ' + countPanels + ' | Перед 0.8 мм: ' + countFrontEdges + ' | Открытые 0.4 мм: ' + countOpenEdges + (skippedFacades > 0 ? ' | Фасады пропущены: ' + skippedFacades : '');
Action.Hint = summaryHint;

var msg = 'Умная облицовка корпуса завершена!\n' +
    '-----------------------------------------\n' +
    'Обработано деталей корпуса: ' + countPanels + ' шт.\n' +
    '  - Лицевые передние торцы (0.8 мм): ' + countFrontEdges + ' шт.\n' +
    '  - Открытые наружные торцы (0.4 мм): ' + countOpenEdges + ' шт.\n' +
    '  - Стыки деталей корпуса: чистые (без кромки)\n' +
    (skippedFacades > 0 ? 'Фасады и двери: не кромятся (пропущено ' + skippedFacades + ' шт.)\n' : '') +
    '-----------------------------------------\n' +
    'Все детали подрезаны (ClipPanel), наслоения удалены.';

alert(msg);
