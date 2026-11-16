// =========================================================================
// Скрипт: Умная облицовка шкафа (0.8 перед + 0.4 корпус)
// Базис-Мебельщик 2021-2024 JS (ES5)
// Кодировка: Windows-1251 (CP1251)
//
// ИНТЕРАКТИВНЫЙ РЕЖИМ С РАСЧЕТОМ 3D-НОРМАЛЕЙ:
//   Шаг 1: Выбор деталей (если уже выделены в Базисе - берутся они;
//          иначе запрос клика деталей, либо Esc/Enter - все детали корпуса).
//   Шаг 2: Указание направления лица (клик точки/ребра на передней стороне,
//          либо Esc/Enter - направление вперед по оси Z+).
//   Шаг 3: Расчет 3D-нормалей каждого торца в глобальных координатах:
//          - Торцы с нормалью вперед (N * Front > 0.6) -> кромка 0.8 мм (ClipPanel=true).
//          - Открытые торцы корпуса (IsButtVisible)    -> кромка 0.4 мм (ClipPanel=true).
//          - Закрытые стыки деталей                   -> чистые (без кромки).
//          - Фасады и двери                          -> пропускаются (не кромятся).
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

// Автопоиск названий кромочных материалов из текущей модели
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
    // Если пользователь заранее выделил детали в Базисе - берем их
    for (var s = 0; s < Model.SelectionCount; s++) {
        extractPanels(Model.Selections[s], rawPanels);
    }
} else {
    // Иначе интерактивный запрос: кликайте детали или Esc для всех деталей
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
        // Esc был нажат сразу -> берем весь корпус модели
        extractPanels(Model, rawPanels);
    }
}

// Фильтруем: исключаем фасады и тонкое ДВП
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

// --- 4. ШАГ 2: ОПРЕДЕЛЕНИЕ ЛИЦЕВОЙ СТОРОНЫ (НАПРАВЛЕНИЯ ПЕРЕДА) ---
var frontDir = { x: 0, y: 0, z: 1 }; // По умолчанию в Базисе лицо смотрит по оси +Z

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

// --- 5. РАСЧЕТ 3D-НОРМАЛЕЙ И КРОМЛЕНИЕ ---

function getButtNormalGlobal(pan, ce) {
    if (!pan || !pan.Contour) return null;
    var elem = pan.Contour[ce] || (pan.Contour.Objects ? pan.Contour.Objects[ce] : null);
    if (!elem || !elem.Pos1 || !elem.Pos2) return null;

    // Точки торца в глобальных координатах
    var p1_glob = pan.ToGlobal(NewVector(elem.Pos1.x, elem.Pos1.y, 0));
    var p2_glob = pan.ToGlobal(NewVector(elem.Pos2.x, elem.Pos2.y, 0));

    // Касательный вектор ребра
    var tx = p2_glob.x - p1_glob.x;
    var ty = p2_glob.y - p1_glob.y;
    var tz = p2_glob.z - p1_glob.z;
    var tLen = Math.sqrt(tx*tx + ty*ty + tz*tz);
    if (tLen < 1e-4) return null;
    tx /= tLen; ty /= tLen; tz /= tLen;

    // Середина ребра
    var midX = (elem.Pos1.x + elem.Pos2.x) / 2;
    var midY = (elem.Pos1.y + elem.Pos2.y) / 2;
    var midGlob = pan.ToGlobal(NewVector(midX, midY, 0));

    // Нормаль к пласти детали (смещение по локальному Z=1)
    var facePt = pan.ToGlobal(NewVector(midX, midY, 1));
    var wx = facePt.x - midGlob.x;
    var wy = facePt.y - midGlob.y;
    var wz = facePt.z - midGlob.z;
    var wLen = Math.sqrt(wx*wx + wy*wy + wz*wz);
    if (wLen < 1e-4) return null;
    wx /= wLen; wy /= wLen; wz /= wLen;

    // Векторное произведение: касательная x нормаль к пласти = внешняя нормаль к торцу
    var nx = ty * wz - tz * wy;
    var ny = tz * wx - tx * wz;
    var nz = tx * wy - ty * wx;
    var nLen = Math.sqrt(nx*nx + ny*ny + nz*nz);
    if (nLen < 1e-4) return null;
    nx /= nLen; ny /= nLen; nz /= nLen;

    // Ориентация наружу от центра контура детали
    var cLocalX = 0, cLocalY = 0, cCount = 0;
    for (var k = 0; k < pan.Contour.Count; k++) {
        var el = pan.Contour[k] || (pan.Contour.Objects ? pan.Contour.Objects[k] : null);
        if (el && el.Pos1) {
            cLocalX += el.Pos1.x;
            cLocalY += el.Pos1.y;
            cCount++;
        }
    }
    if (cCount > 0) {
        cLocalX /= cCount;
        cLocalY /= cCount;
    }
    var cGlob = pan.ToGlobal(NewVector(cLocalX, cLocalY, 0));

    var awayX = midGlob.x - cGlob.x;
    var awayY = midGlob.y - cGlob.y;
    var awayZ = midGlob.z - cGlob.z;
    if (nx * awayX + ny * awayY + nz * awayZ < 0) {
        nx = -nx;
        ny = -ny;
        nz = -nz;
    }

    return { x: nx, y: ny, z: nz };
}

var countPanels = 0;
var countFrontEdges = 0;
var countOpenEdges = 0;

for (var i = 0; i < targetPanels.length; i++) {
    var pan = targetPanels[i];
    StartEditing(pan);
    pan.Butts.Clear();

    if (pan.Contour && pan.Contour.Count) {
        for (var ce = 0; ce < pan.Contour.Count; ce++) {
            var norm = getButtNormalGlobal(pan, ce);
            if (!norm) continue;

            // Скалярное произведение вектора нормали с направлением переда
            var dotFront = norm.x * frontDir.x + norm.y * frontDir.y + norm.z * frontDir.z;

            if (dotFront > 0.6) {
                // ПЕРЕДНИЙ ЛИЦЕВОЙ ТОРЕЦ -> КРОМКА 0.8 ММ
                var bFront = pan.AddButt(buttMat08, ce);
                if (bFront) {
                    bFront.ClipPanel = true;
                    bFront.Thickness = 0.8;
                    bFront.Material = buttMat08.Name;
                }
                countFrontEdges++;
            } else {
                // Проверяем, открыт ли торец (не примыкает ли к другой детали)
                var isOpen = pan.IsButtVisible(ce, 2);
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
