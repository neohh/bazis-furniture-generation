// =========================================================================
// Скрипт: Умная облицовка шкафа (0.8 мм лицевые + 0.4 мм корпус)
// Базис-Мебельщик 2021-2024 JS (ES5)
//
// Возможности:
//   1. Очищает все старые наслоения через StartEditing и Butts.Clear().
//   2. Фасады (двери, ящики) облицовывает ПО КРУГУ кромкой 0.8 мм.
//   3. Передние лицевые торцы корпуса облицовывает кромкой 0.8 мм.
//   4. Все остальные ОТКРЫТЫЕ торцы облицовывает кромкой 0.4 мм (штатный IsButtVisible).
//   5. Закрытые торцы (стыки полок со стойками) оставляет ЧИСТЫМИ (без кромки).
//   6. Вся кромка наносится С ПОДРЕЗКОЙ (ClipPanel = true).
// =========================================================================

// --- 1. Настройка материалов кромки ---
var buttMat08 = NewButtMaterialInput('Кромка 0.8 мм (фасады и лицевые торцы)');
var buttMat04 = NewButtMaterialInput('Кромка 0.4 мм (открытые торцы корпуса)');

buttMat08.Thickness = 0.8;
buttMat08.ClipPanel = true;
buttMat08.Allowance = 0.8;

buttMat04.Thickness = 0.4;
buttMat04.ClipPanel = true;
buttMat04.Allowance = 0.4;

// Автопоиск существующих названий кромок в открытой модели
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
    scan(Model);
    return foundName;
}

var auto08 = findModelMaterialName(0.8);
if (auto08) buttMat08.Name = auto08; else buttMat08.Name = 'кромка 0.8';

var auto04 = findModelMaterialName(0.4);
if (auto04) buttMat04.Name = auto04; else buttMat04.Name = 'кромка 0.4';

// --- 2. Шаг 1: Определение лицевой стороны (где перед) ---
var frontZ = null;
try {
    var pickPt = GetPoint('Шаг 1/2: Кликните точку/ребро на ЛИЦЕВОЙ стороне шкафа (Esc для направления Z+)');
    if (pickPt) {
        frontZ = pickPt.z;
    }
} catch (ePt) {}

// --- 3. Шаг 2: Выбор фасадов (двери, накладки ящиков) ---
var facadePanels = [];

// Автоматически включаем заранее выделенные фасады (если были выделены)
function checkSelectedFacades(cnt) {
    if (!cnt) return;
    for (var i = 0; i < cnt.Count; i++) {
        var obj = cnt.Objects[i];
        if (obj.AsPanel && obj.Selected) {
            var nm = (obj.Name || '').toLowerCase();
            if (nm.indexOf('фасад') !== -1 || nm.indexOf('двер') !== -1 || nm.indexOf('ящик') !== -1) {
                facadePanels.push(obj);
            }
        }
        if (obj.Count && obj.Count > 0) checkSelectedFacades(obj);
    }
}
checkSelectedFacades(Model);

alert(
    'Шаг 2/2: ВЫБОР ФАСАДОВ\n' +
    'Кликайте по очереди на все двери и фасады шкафа (они облицуются 0.8 мм по кругу).\n' +
    'Когда укажете все фасады — нажмите Esc.'
);

while (true) {
    var pickedFacade = null;
    try {
        pickedFacade = GetPanel('Кликните фасад (или Esc для перехода к корпусу)');
    } catch (eF) { pickedFacade = null; }
    if (!pickedFacade) break;

    var exists = false;
    for (var f = 0; f < facadePanels.length; f++) {
        if (facadePanels[f] === pickedFacade) {
            exists = true;
            break;
        }
    }
    if (!exists) {
        facadePanels.push(pickedFacade);
    }
}

// --- 4. Сбор деталей корпуса (исключая фасады и задние стенки ДВП) ---
var carcassPanels = [];

function collectCarcass(cnt) {
    if (!cnt) return;
    for (var i = 0; i < cnt.Count; i++) {
        var obj = cnt.Objects[i];
        if (obj.AsPanel) {
            var isFac = false;
            for (var k = 0; k < facadePanels.length; k++) {
                if (facadePanels[k] === obj) {
                    isFac = true;
                    break;
                }
            }

            if (!isFac) {
                var thX = obj.GabMax.x - obj.GabMin.x;
                var thY = obj.GabMax.y - obj.GabMin.y;
                var thZ = obj.GabMax.z - obj.GabMin.z;
                var minTh = Math.min(thX, Math.min(thY, thZ));
                var nm = (obj.Name || '').toLowerCase();

                if (minTh >= 8 && nm.indexOf('двп') === -1 && nm.indexOf('хдф') === -1 && nm.indexOf('задн') === -1) {
                    carcassPanels.push(obj);
                }
            }
        }
        if (obj.Count && obj.Count > 0) collectCarcass(obj);
    }
}
collectCarcass(Model);

// --- 5. Выполнение облицовки ---
var countFacades = 0;
var countCarcass = 0;
var countFrontEdges = 0;
var countOpenEdges = 0;

// А. Обработка фасадов (по кругу 0.8 мм)
for (var f = 0; f < facadePanels.length; f++) {
    var fac = facadePanels[f];
    StartEditing(fac);
    fac.Butts.Clear();

    if (fac.Contour && fac.Contour.Count) {
        for (var fe = 0; fe < fac.Contour.Count; fe++) {
            var bF = fac.AddButt(buttMat08, fe);
            if (bF) {
                bF.ClipPanel = true;
                bF.Thickness = 0.8;
                bF.Material = buttMat08.Name;
            }
        }
    }
    fac.Build();
    countFacades++;
}

// Б. Обработка корпуса (лицевые 0.8 мм, открытые 0.4 мм, закрытые без кромки)
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

            // Проверка на ЛИЦЕВОЙ (передний) торец детали:
            // Координата Z середины ребра совпадает с максимальным Z этой детали
            var isFront = (Math.abs(midGlobal.z - pan.GabMax.z) < 2.0);

            if (isFront) {
                // Передний торец корпуса -> 0.8 мм
                var bFront = pan.AddButt(buttMat08, ce);
                if (bFront) {
                    bFront.ClipPanel = true;
                    bFront.Thickness = 0.8;
                    bFront.Material = buttMat08.Name;
                }
                countFrontEdges++;
            } else {
                // Штатная функция Базиса: проверяем, открыт ли торец (дистанция проверки 2 мм)
                var isOpen = pan.IsButtVisible(ce, 2);
                if (isOpen) {
                    // Открытый торец корпуса (задний у стены, открытый верх/низ) -> 0.4 мм
                    var bOpen = pan.AddButt(buttMat04, ce);
                    if (bOpen) {
                        bOpen.ClipPanel = true;
                        bOpen.Thickness = 0.4;
                        bOpen.Material = buttMat04.Name;
                    }
                    countOpenEdges++;
                }
                // Если закрыт другой панелью (полка упирается в боковину) — торец чистый!
            }
        }
    }
    pan.Build();
    countCarcass++;
}

// --- 6. Завершение транзакции ---
Action.Commit();

alert(
    'Умная облицовка успешно завершена!\n' +
    '-----------------------------------------\n' +
    '• Фасадов облицовано (0.8 мм по кругу): ' + countFacades + '\n' +
    '• Деталей корпуса обработано: ' + countCarcass + '\n' +
    '  - Лицевых передних торцов (0.8 мм): ' + countFrontEdges + '\n' +
    '  - Открытых торцов корпуса (0.4 мм): ' + countOpenEdges + '\n' +
    '  - Закрытые стыки полок со стойками: БЕЗ КРОМКИ\n' +
    '-----------------------------------------\n' +
    'Все старые наслоения очищены через Butts.Clear(). Подрезка включена.'
);
