// =========================================================================
// Скрипт: Умная облицовка шкафа (0.8 перед + 0.4 корпус)
// Базис-Мебельщик 2021-2024 JS (ES5)
// Кодировка: Windows-1251 (CP1251)
//
// ИНТЕРАКТИВНЫЙ РЕЖИМ С УКАЗАНИЕМ ЛИЦЕВОЙ СТОРОНЫ:
//   Шаг 1: Выбор деталей (если выделены заранее - берутся они,
//          иначе клик по деталям или Esc для всего шкафа).
//   Шаг 2: Запрос передней (лицевой) стороны шкафа:
//          кликните переднее ребро или точку (Esc - стандартно вперед по Z).
//   Шаг 3: Нанесение кромки:
//          - Лицевой передний торец -> '0.8мм 16х' (0.8 мм, ЗЕЛЕНАЯ).
//          - Открытые торцы корпуса (IsButtVisible) -> '0.4' (0.4 мм, СИНЯЯ).
//          - Стыки деталей (полка к стойке) -> БЕЗ КРОМКИ (чистые, красные в проверке).
//          - Фасады и задняя стенка ДВП -> пропускаются.
// =========================================================================

// --- 1. Определение названий материалов кромки ---
var mat08Name = '0.8мм 16х';
var mat04Name = '0.4';

function detectEdgeNames() {
    function scan(cnt) {
        if (!cnt) return;
        for (var i = 0; i < cnt.Count; i++) {
            var obj = cnt.Objects[i];
            if (obj && obj.AsPanel && obj.Butts) {
                for (var b = 0; b < obj.Butts.Count; b++) {
                    var bt = obj.Butts.Butts[b];
                    if (bt && bt.Material) {
                        if (Math.abs(bt.Thickness - 0.8) < 0.25) {
                            mat08Name = bt.Material;
                        }
                        if (Math.abs(bt.Thickness - 0.4) < 0.25) {
                            mat04Name = bt.Material;
                        }
                    }
                }
            }
            if (obj && obj.Count && obj.Count > 0) scan(obj);
        }
    }
    try { scan(Model); } catch(e) {}
}
detectEdgeNames();

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

// --- 3. ШАГ 1: ВЫБОР ДЕТАЛЕЙ ДЛЯ КРОМЛЕНИЯ ---
var rawPanels = [];

if (Model.SelectionCount > 0) {
    for (var s = 0; s < Model.SelectionCount; s++) {
        extractPanels(Model.Selections[s], rawPanels);
    }
} else {
    Action.Hint = 'Шаг 1/2: Кликните деталь корпуса (Esc когда выбрали все, или Esc сразу для ВСЕГО шкафа)';
    while (true) {
        var picked = null;
        try {
            picked = GetPanel('Кликните деталь корпуса (Esc - готово / весь шкаф)');
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

// --- 4. ШАГ 2: УКАЗАНИЕ ЛИЦЕВОЙ (ПЕРЕДНЕЙ) СТОРОНЫ ШКАФА ---
var frontDir = { x: 0, y: 0, z: 1 }; // По умолчанию в Базисе шкаф смотрит по оси +Z

try {
    Action.Hint = 'Шаг 2/2: Кликните ПЕРЕДНЕЕ (лицевое) ребро шкафа (Esc/Enter - направление вперед Z+)';
    var eFront = GetEdge('Шаг 2/2: Кликните ПЕРЕДНЕЕ ребро шкафа (Esc - вперед по Z)', AxisY);
    if (eFront && eFront.First && eFront.Second) {
        var edgeMidZ = (eFront.First.z + eFront.Second.z) / 2;
        var modelMidZ = (Model.GabMax.z + Model.GabMin.z) / 2;
        if (edgeMidZ < modelMidZ) {
            frontDir = { x: 0, y: 0, z: -1 };
        } else {
            frontDir = { x: 0, y: 0, z: 1 };
        }
    }
} catch(eEdge) {
    frontDir = { x: 0, y: 0, z: 1 };
}

// Определение индекса переднего торца детали
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

            var proj = midX * fDir.x + midY * fDir.y + midZ * fDir.z;
            if (proj > maxProj) {
                maxProj = proj;
                bestIdx = i;
            }
        }
    }
    return bestIdx;
}

// --- 5. НАНЕСЕНИЕ КРОМКИ (ПРЯМОЙ ВЫЗОВ BUTTS.ADD ДЛЯ НАДЕЖНОСТИ) ---
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
                // ЛИЦЕВОЙ ПЕРЕДНИЙ ТОРЕЦ -> 0.8 ММ (ЗЕЛЕНАЯ)
                var b08 = pan.Butts.Add();
                if (b08) {
                    b08.ElemIndex = ce;
                    b08.Material = mat08Name;
                    b08.Thickness = 0.8;
                    b08.ClipPanel = true;
                    countFrontEdges++;
                }
            } else if (pan.IsButtVisible(ce, 5)) {
                // ОТКРЫТЫЙ НАРУЖНЫЙ ТОРЕЦ КОРПУСА -> 0.4 ММ (СИНЯЯ / ГОЛУБАЯ)
                var b04 = pan.Butts.Add();
                if (b04) {
                    b04.ElemIndex = ce;
                    b04.Material = mat04Name;
                    b04.Thickness = 0.4;
                    b04.ClipPanel = true;
                    countOpenEdges++;
                }
            }
            // ЗАКРЫТЫЕ СТЫКИ ДЕТАЛЕЙ ОСТАЮТСЯ БЕЗ КРОМКИ (ЧИСТЫЕ)
        }
    }
    pan.Build();
    countPanels++;
}

// --- 6. ЗАВЕРШЕНИЕ И ОТЧЕТ ---
Action.Commit();

var summaryHint = 'Готово! Деталей: ' + countPanels + ' | Лицо 0.8 мм (зеленая): ' + countFrontEdges + ' | Корпус 0.4 мм (синяя): ' + countOpenEdges + (skippedFacades > 0 ? ' | Фасады пропущены: ' + skippedFacades : '');
Action.Hint = summaryHint;

var msg = 'Умная облицовка корпуса завершена!\n' +
    '-----------------------------------------\n' +
    'Обработано деталей корпуса: ' + countPanels + ' шт.\n' +
    '  - Лицевые торцы (0.8 мм, зеленая "' + mat08Name + '"): ' + countFrontEdges + ' шт.\n' +
    '  - Открытые торцы корпуса (0.4 мм, синяя "' + mat04Name + '"): ' + countOpenEdges + ' шт.\n' +
    '  - Закрытые стыки деталей: без кромки (чистые)\n' +
    (skippedFacades > 0 ? '  - Фасады и двери: не кромятся (пропущено ' + skippedFacades + ' шт.)\n' : '') +
    '-----------------------------------------\n' +
    'Все кромки нанесены с подрезкой (ClipPanel = true).';

alert(msg);