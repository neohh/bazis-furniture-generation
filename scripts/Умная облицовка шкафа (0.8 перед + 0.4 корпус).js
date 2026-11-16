// =========================================================================
// Скрипт: Умная авто-облицовка шкафа (только передние торцы 0.8 мм + корпус 0.4 мм)
// Базис-Мебельщик 2021-2024 JS (ES5)
// Кодировка: Windows-1251 (CP1251)
//
// ПРАВИЛА КРОМЛЕНИЯ:
//   1. ФАСАДЫ И ДВЕРИ НЕ КРОМЯТСЯ (полностью пропускаются).
//   2. Лицевые передние торцы корпуса (стойки, полки, крышка, дно) -> кромка 0.8 мм.
//   3. Открытые наружные/задние торцы корпуса -> кромка 0.4 мм.
//   4. Закрытые стыки (полки к боковинам, перегородки) -> ЧИСТЫЕ (без кромки).
//   5. Скрипт работает автоматически в 1 клик без лишних запросов.
// =========================================================================

// --- 1. Настройка материалов кромки ---
var buttMat08 = NewButtMaterialInput('Кромка 0.8 мм (передние торцы)');
var buttMat04 = NewButtMaterialInput('Кромка 0.4 мм (открытые торцы корпуса)');

buttMat08.Thickness = 0.8;
buttMat08.ClipPanel = true;
buttMat08.Allowance = 0.8;

buttMat04.Thickness = 0.4;
buttMat04.ClipPanel = true;
buttMat04.Allowance = 0.4;

// Автопоиск названий кромок в открытой модели
function findModelMaterialName(targetThick) {
    var foundName = null;
    function scan(cnt) {
        if (!cnt || foundName) return;
        for (var i = 0; i < cnt.Count; i++) {
            var obj = cnt.Objects[i];
            if (obj.AsPanel && obj.Butts) {
                for (var b = 0; b < obj.Butts.Count; b++) {
                    var bt = obj.Butts.Butts[b];
                    if (bt && bt.Material && Math.abs(bt.Thickness - targetThick) < 0.15) {
                        foundName = bt.Material;
                        return;
                    }
                }
            }
            if (obj.Count && obj.Count > 0) scan(obj);
        }
    }
    try { scan(Model); } catch(e) {}
    return foundName;
}

var auto08 = findModelMaterialName(0.8);
if (auto08) buttMat08.Name = auto08; else buttMat08.Name = 'Кромка 0.8 мм';

var auto04 = findModelMaterialName(0.4);
if (auto04) buttMat04.Name = auto04; else buttMat04.Name = 'Кромка 0.4 мм';

// --- 2. Сбор деталей корпуса (фасады и ДВП исключаются) ---
var carcassPanels = [];
var skippedFacadesCount = 0;

function isFacadePanel(obj) {
    if (!obj || !obj.AsPanel) return false;
    var nm = (obj.Name || '').toLowerCase();
    if (nm.indexOf('фасад') !== -1 || nm.indexOf('двер') !== -1 || nm.indexOf('створк') !== -1 || nm.indexOf('накладка') !== -1) {
        return true;
    }
    return false;
}

function collectCarcass(cnt) {
    if (!cnt) return;
    for (var i = 0; i < cnt.Count; i++) {
        var obj = cnt.Objects[i];
        if (obj.AsPanel) {
            if (isFacadePanel(obj)) {
                // Фасады не кромятся — пропускаем!
                skippedFacadesCount++;
            } else {
                var thX = obj.GabMax.x - obj.GabMin.x;
                var thY = obj.GabMax.y - obj.GabMin.y;
                var thZ = obj.GabMax.z - obj.GabMin.z;
                var minTh = Math.min(thX, Math.min(thY, thZ));
                var nm = (obj.Name || '').toLowerCase();

                // Исключаем тонкие задние стенки ДВП/ХДФ
                if (minTh >= 8 && nm.indexOf('двп') === -1 && nm.indexOf('хдф') === -1 && nm.indexOf('задн') === -1) {
                    carcassPanels.push(obj);
                }
            }
        }
        if (obj.Count && obj.Count > 0) collectCarcass(obj);
    }
}
collectCarcass(Model);

if (carcassPanels.length === 0) {
    alert('В модели не найдено деталей корпуса для кромления!');
    Action.Finish();
}

// --- 3. Выполнение облицовки деталей корпуса ---
var countCarcass = 0;
var countFrontEdges = 0;
var countOpenEdges = 0;

for (var c = 0; c < carcassPanels.length; c++) {
    var pan = carcassPanels[c];
    StartEditing(pan);
    pan.Butts.Clear();

    if (pan.Contour && pan.Contour.Count) {
        for (var ce = 0; ce < pan.Contour.Count; ce++) {
            var elem = pan.Contour.Objects[ce];
            if (!elem || !elem.Pos1 || !elem.Pos2) continue;

            // Находим глобальные координаты середины ребра
            var midX = (elem.Pos1.x + elem.Pos2.x) / 2;
            var midY = (elem.Pos1.y + elem.Pos2.y) / 2;
            var midGlobal = pan.ToGlobal(NewVector(midX, midY, 0));

            // Проверка на ЛИЦЕВОЙ передний торец детали (Z максимальный для этой детали)
            var isFront = (Math.abs(midGlobal.z - pan.GabMax.z) < 2.0);

            if (isFront) {
                // Передний торец корпуса -> строго 0.8 мм
                var bFront = pan.AddButt(buttMat08, ce);
                if (bFront) {
                    bFront.ClipPanel = true;
                    bFront.Thickness = 0.8;
                    bFront.Material = buttMat08.Name;
                }
                countFrontEdges++;
            } else {
                // Проверяем, открыт ли торец (дистанция проверки 2 мм)
                var isOpen = pan.IsButtVisible(ce, 2);
                if (isOpen) {
                    // Открытый торец корпуса (задний у стены, открытый низ/верх) -> 0.4 мм
                    var bOpen = pan.AddButt(buttMat04, ce);
                    if (bOpen) {
                        bOpen.ClipPanel = true;
                        bOpen.Thickness = 0.4;
                        bOpen.Material = buttMat04.Name;
                    }
                    countOpenEdges++;
                }
                // Закрытые стыки со стойками остаются чистыми без кромки!
            }
        }
    }
    pan.Build();
    countCarcass++;
}

// --- 4. Завершение ---
Action.Commit();

var summaryHint = 'ГОТОВО: Облицовано передних торцов (0.8 мм): ' + countFrontEdges + ', открытых торцов (0.4 мм): ' + countOpenEdges + '. Фасады пропущены (' + skippedFacadesCount + ' шт.).';
Action.Hint = summaryHint;

var msg = 'Умная облицовка корпуса успешно выполнена!\n' +
    '-----------------------------------------\n' +
    '• Деталей корпуса обработано: ' + countCarcass + ' шт.\n' +
    '  - Лицевых передних торцов (0.8 мм): ' + countFrontEdges + ' шт.\n' +
    '  - Открытых торцов корпуса (0.4 мм): ' + countOpenEdges + ' шт.\n' +
    '  - Закрытые стыки полок со стойками: БЕЗ КРОМКИ\n' +
    '• Фасады и двери: НЕ КРОМИЛИСЬ (' + skippedFacadesCount + ' шт.)\n' +
    '-----------------------------------------\n' +
    'Все старые наслоения очищены, подрезка деталей включена.';

alert(msg);
