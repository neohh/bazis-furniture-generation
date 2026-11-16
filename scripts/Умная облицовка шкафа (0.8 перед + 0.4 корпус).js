// =========================================================================
// Скрипт: Умная облицовка шкафа (0.8 перед + 0.4 корпус)
// Базис-Мебельщик 2021-2024 JS (ES5)
// Кодировка: Windows-1251 (CP1251)
//
// ЭКСПРЕСС-ОБЛИЦОВКА ШКАФА:
//   1. Передние лицевые торцы корпуса -> кромка 0.8 мм (0.8мм 16х - ЗЕЛЕНАЯ).
//   2. Открытые наружные торцы корпуса (IsButtVisible) -> кромка 0.4 мм (0.4 - СИНЯЯ).
//   3. Закрытые стыки деталей (полка к стойке и т.д.) -> БЕЗ КРОМКИ (чистые, красные в проверке).
//   4. Фасады и задняя стенка ДВП/ХДФ -> полностью пропускаются.
//   5. Все кромки ставятся с подрезкой детали (ClipPanel = true).
// =========================================================================

// --- 1. Поиск и настройка кромочных материалов ---
var buttMat08 = NewButtMaterialInput('Кромка 0.8 мм (лицевые торцы)');
var buttMat04 = NewButtMaterialInput('Кромка 0.4 мм (открытый корпус)');

buttMat08.Thickness = 0.8;
buttMat08.ClipPanel = true;
buttMat08.Allowance = 0.8;

buttMat04.Thickness = 0.4;
buttMat04.ClipPanel = true;
buttMat04.Allowance = 0.4;

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
buttMat08.Name = auto08 || '0.8мм 16х';

var auto04 = findModelMaterialName(0.4);
buttMat04.Name = auto04 || '0.4';

// --- 2. Вспомогательные функции ---

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

// --- 3. Сбор деталей корпуса ---
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

// --- 4. Определение лицевого (переднего) торца по максимальному Z ---
function getFrontContourIndex(pan) {
    if (!pan || !pan.Contour || pan.Contour.Count === 0) return -1;

    var bestIdx = -1;
    var maxZ = -1e9;

    for (var i = 0; i < pan.Contour.Count; i++) {
        var elem = pan.Contour[i];
        if (elem && elem.Pos1 && elem.Pos2) {
            var p1 = pan.ToGlobal(NewVector(elem.Pos1.x, elem.Pos1.y, 0));
            var p2 = pan.ToGlobal(NewVector(elem.Pos2.x, elem.Pos2.y, 0));
            var midZ = (p1.z + p2.z) / 2;

            if (midZ > maxZ) {
                maxZ = midZ;
                bestIdx = i;
            }
        }
    }
    return bestIdx;
}

// --- 5. Кромление: передние 0.8 мм (зеленая), открытые 0.4 мм (синяя), стыки чистые ---
var countPanels = 0;
var countFrontEdges = 0;
var countOpenEdges = 0;

for (var i = 0; i < targetPanels.length; i++) {
    var pan = targetPanels[i];
    StartEditing(pan);
    pan.Butts.Clear();

    if (pan.Contour && pan.Contour.Count) {
        var fIndex = getFrontContourIndex(pan);

        for (var ce = 0; ce < pan.Contour.Count; ce++) {
            if (ce === fIndex) {
                // ЛИЦЕВОЙ ПЕРЕДНИЙ ТОРЕЦ -> КРОМКА 0.8 ММ (ЗЕЛЕНАЯ)
                var bFront = pan.AddButt(buttMat08, ce);
                if (bFront) {
                    bFront.ClipPanel = true;
                    bFront.Thickness = 0.8;
                }
                countFrontEdges++;
            } else if (pan.IsButtVisible(ce, 5)) {
                // ОТКРЫТЫЙ НАРУЖНЫЙ ТОРЕЦ КОРПУСА -> КРОМКА 0.4 ММ (СИНЯЯ)
                var bOpen = pan.AddButt(buttMat04, ce);
                if (bOpen) {
                    bOpen.ClipPanel = true;
                    bOpen.Thickness = 0.4;
                }
                countOpenEdges++;
            }
            // ЗАКРЫТЫЕ СТЫКИ ДЕТАЛЕЙ ОСТАЮТСЯ БЕЗ КРОМКИ (ЧИСТЫЕ)
        }
    }
    pan.Build();
    countPanels++;
}

// --- 6. Завершение и отчет ---
Action.Commit();

var summaryHint = 'Готово! Деталей: ' + countPanels + ' | Перед (0.8 мм зеленая): ' + countFrontEdges + ' | Открытые (0.4 мм синяя): ' + countOpenEdges + (skippedFacades > 0 ? ' | Фасады пропущены: ' + skippedFacades : '');
Action.Hint = summaryHint;

var msg = 'Умная облицовка корпуса завершена!\n' +
    '-----------------------------------------\n' +
    'Обработано деталей корпуса: ' + countPanels + ' шт.\n' +
    '  - Лицевые торцы (0.8 мм, зеленая): ' + countFrontEdges + ' шт.\n' +
    '  - Открытые торцы (0.4 мм, синяя): ' + countOpenEdges + ' шт.\n' +
    '  - Закрытые стыки деталей: без кромки (чистые)\n' +
    (skippedFacades > 0 ? '  - Фасады и двери: не кромятся (пропущено ' + skippedFacades + ' шт.)\n' : '') +
    '-----------------------------------------\n' +
    'Материалы: ' + buttMat08.Name + ' (0.8 мм) и ' + buttMat04.Name + ' (0.4 мм).';

alert(msg);
