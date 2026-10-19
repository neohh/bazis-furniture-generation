// =========================================================================
// Скрипт: Умная облицовка шкафа (0.8 мм лицевые + 0.4 мм корпус)
// Базис-Мебельщик 2021-2024 JS (ES5)
//
// Назначение:
//   1. Очищает все старые наслоившиеся и задвоенные кромки.
//   2. Фасады (двери, ящики) облицовывает ПО КРУГУ кромкой 0.8 мм.
//   3. Лицевые (передние) торцы корпуса облицовывает кромкой 0.8 мм.
//   4. Все остальные ОТКРЫТЫЕ торцы корпуса облицовывает кромкой 0.4 мм.
//   5. Закрытые торцы (стыки полок со стойками) оставляет ЧИСТЫМИ (без кромки).
//   6. Все кромки ставятся с признаком «С подрезкой» (ClipPanel = true).
// =========================================================================

// --- 1. Определение параметров материалов ---
var buttMat08 = NewButtMaterialInput('Кромка 0.8 мм (фасады и лицевые торцы)');
var buttMat04 = NewButtMaterialInput('Кромка 0.4 мм (открытые торцы корпуса)');

buttMat08.Thickness = 0.8;
buttMat08.ClipPanel = true;
buttMat08.Allowance = 0.8;

buttMat04.Thickness = 0.4;
buttMat04.ClipPanel = true;
buttMat04.Allowance = 0.4;

// Автопоиск существующих названий кромок в открытой модели
function autoDetectModelEdgeNames() {
    var detected08 = null;
    var detected04 = null;

    function scanButts(container) {
        if (!container) return;
        for (var i = 0; i < container.Count; i++) {
            var obj = container.Objects[i];
            if (obj.AsPanel && obj.Butts) {
                for (var b = 0; b < obj.Butts.Count; b++) {
                    var bt = obj.Butts.Butts[b];
                    if (bt && bt.Material) {
                        var th = bt.Thickness;
                        if (!detected08 && Math.abs(th - 0.8) < 0.15) {
                            detected08 = bt.Material;
                        }
                        if (!detected04 && Math.abs(th - 0.4) < 0.15) {
                            detected04 = bt.Material;
                        }
                    }
                }
            }
            if (obj.Count && obj.Count > 0) scanButts(obj);
        }
    }

    scanButts(Model);

    if (detected08) {
        buttMat08.Name = detected08;
    } else {
        buttMat08.Name = 'кромка 0.8';
    }

    if (detected04) {
        buttMat04.Name = detected04;
    } else {
        buttMat04.Name = 'кромка 0.4';
    }
}

autoDetectModelEdgeNames();

// --- 2. Шаг 1: Определение лицевой стороны (где перед) ---
var modelMaxZ = -999999;
function scanModelBounds(container) {
    if (!container) return;
    for (var i = 0; i < container.Count; i++) {
        var obj = container.Objects[i];
        if (obj.AsPanel) {
            if (obj.GabMax.z > modelMaxZ) modelMaxZ = obj.GabMax.z;
        }
        if (obj.Count && obj.Count > 0) scanModelBounds(obj);
    }
}
scanModelBounds(Model);

var frontZ = modelMaxZ;
try {
    var pickPt = GetPoint('Шаг 1/2: Кликните точку/ребро на ЛИЦЕВОЙ стороне шкафа (Esc для направления Z+)');
    if (pickPt) {
        frontZ = pickPt.z;
    }
} catch (ePt) {}

// --- 3. Шаг 2: Выбор фасадов (двери, накладки ящиков) ---
var facadePanels = [];

// Автоматически включаем заранее выделенные фасады (если есть)
function scanSelected(container) {
    if (!container) return;
    for (var i = 0; i < container.Count; i++) {
        var obj = container.Objects[i];
        if (obj.AsPanel && obj.Selected) {
            var nm = (obj.Name || '').toLowerCase();
            if (nm.indexOf('фасад') !== -1 || nm.indexOf('двер') !== -1 || nm.indexOf('ящик') !== -1) {
                facadePanels.push(obj);
            }
        }
        if (obj.Count && obj.Count > 0) scanSelected(obj);
    }
}
scanSelected(Model);

alert(
    'Шаг 2/2: ВЫБОР ФАСАДОВ\n' +
    'Кликайте по очереди на все двери и фасады шкафа (они облицуются 0.8 мм по кругу).\n' +
    'Когда укажете все фасады — нажмите Esc.'
);

while (true) {
    var pickedFacade = null;
    try {
        pickedFacade = GetPanel('Кликните фасад (или Esc для перехода к облицовке корпуса)');
    } catch (eF) { pickedFacade = null; }
    if (!pickedFacade) break;

    var alreadyInList = false;
    for (var f = 0; f < facadePanels.length; f++) {
        if (facadePanels[f] === pickedFacade) {
            alreadyInList = true;
            break;
        }
    }
    if (!alreadyInList) {
        facadePanels.push(pickedFacade);
    }
}

// --- 4. Сбор деталей корпуса шкафа ---
var carcassPanels = [];

function collectCarcassPanels(container) {
    if (!container) return;
    for (var i = 0; i < container.Count; i++) {
        var obj = container.Objects[i];
        if (obj.AsPanel) {
            // Проверка, является ли фасадной деталью
            var isFac = false;
            for (var k = 0; k < facadePanels.length; k++) {
                if (facadePanels[k] === obj) {
                    isFac = true;
                    break;
                }
            }

            if (!isFac) {
                // Исключаем задние стенки ДВП/ХДФ тоньше 6 мм
                var thickX = obj.GabMax.x - obj.GabMin.x;
                var thickY = obj.GabMax.y - obj.GabMin.y;
                var thickZ = obj.GabMax.z - obj.GabMin.z;
                var minThick = Math.min(thickX, Math.min(thickY, thickZ));
                var nameLower = (obj.Name || '').toLowerCase();

                if (minThick >= 8 && nameLower.indexOf('двп') === -1 && nameLower.indexOf('хдф') === -1 && nameLower.indexOf('задн') === -1) {
                    carcassPanels.push(obj);
                }
            }
        }
        if (obj.Count && obj.Count > 0) collectCarcassPanels(obj);
    }
}
collectCarcassPanels(Model);

// --- 5. Вспомогательные функции очистки и нанесения кромки ---

// Очистка всех старых/задвоенных кромок
function clearOldButts(panel) {
    if (!panel || !panel.Butts) return;
    try {
        if (typeof panel.Butts.Clear === 'function') {
            panel.Butts.Clear();
            return;
        }
    } catch (eC) {}

    try {
        while (panel.Butts.Count > 0) {
            if (typeof panel.Butts.Delete === 'function') {
                panel.Butts.Delete(0);
            } else {
                break;
            }
        }
    } catch (eD) {}
}

// Нанесение кромки на элемент контура с гарантированной подрезкой
function applyCleanButt(panel, elemIndex, buttMaterial, targetThick) {
    var b = panel.AddButt(buttMaterial, elemIndex);
    if (b) {
        b.Material = buttMaterial.Name || ('кромка ' + targetThick);
        b.Thickness = targetThick;
        b.ClipPanel = true; // С подрезкой для ЧПУ/Раскроя
        b.Allowance = targetThick;
        b.Sign = targetThick.toString();
    }
}

// Проверка: примыкает ли торец детали к пласти другой детали (закрытый торец)
function isEdgeClosedByOtherPanel(midWorld, selfPanel, allPanels) {
    var tol = 1.5; // Допуск на касание 1.5 мм
    for (var i = 0; i < allPanels.length; i++) {
        var other = allPanels[i];
        if (other === selfPanel) continue;

        var insideX = (midWorld.x >= other.GabMin.x - tol && midWorld.x <= other.GabMax.x + tol);
        var insideY = (midWorld.y >= other.GabMin.y - tol && midWorld.y <= other.GabMax.y + tol);
        var insideZ = (midWorld.z >= other.GabMin.z - tol && midWorld.z <= other.GabMax.z + tol);

        if (insideX && insideY && insideZ) {
            return true;
        }
    }
    return false;
}

// --- 6. Выполнение облицовки ---
var countFacadesEdged = 0;
var countCarcassEdged = 0;
var countFrontEdges = 0;
var countOpenEdges = 0;

// А. Обработка фасадов (по кругу 0.8 мм)
for (var f = 0; f < facadePanels.length; f++) {
    var fac = facadePanels[f];
    clearOldButts(fac);

    if (fac.Contour && fac.Contour.Count) {
        for (var fe = 0; fe < fac.Contour.Count; fe++) {
            applyCleanButt(fac, fe, buttMat08, 0.8);
        }
    }
    fac.Build();
    countFacadesEdged++;
}

// Б. Обработка деталей корпуса (0.8 лицевой торец, 0.4 открытые, закрытые без кромки)
for (var c = 0; c < carcassPanels.length; c++) {
    var pan = carcassPanels[c];
    clearOldButts(pan);

    if (pan.Contour && pan.Contour.Count) {
        for (var ce = 0; ce < pan.Contour.Count; ce++) {
            var elem = pan.Contour.Objects[ce];
            if (!elem || !elem.Pos1 || !elem.Pos2) continue;

            var p1 = elem.Pos1;
            var p2 = elem.Pos2;
            var midLocal = NewVector((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 0);
            var midWorld = pan.ToGlobal(midLocal);

            // Вычисляем нормаль ребра в 3D (направление торца)
            var dx = p2.x - p1.x;
            var dy = p2.y - p1.y;
            var len = Math.sqrt(dx * dx + dy * dy);
            var normWorld = NewVector(0, 0, 0);
            if (len > 0.001) {
                var nx = dy / len;
                var ny = -dx / len;
                normWorld = pan.NToGlobal(NewVector(nx, ny, 0));
            }

            // 1. Проверка на ЛИЦЕВОЙ (передний) торец:
            // Нормаль смотрит в сторону Z+ (normWorld.z > 0.5)
            // Либо координата Z середины ребра находится на максимальной глубине детали
            var isFront = false;
            if (normWorld.z > 0.5) {
                isFront = true;
            } else if (Math.abs(midWorld.z - pan.GabMax.z) < 2.0 && normWorld.z > -0.2) {
                isFront = true;
            }

            if (isFront) {
                // Передний торец корпуса -> 0.8 мм
                applyCleanButt(pan, ce, buttMat08, 0.8);
                countFrontEdges++;
            } else {
                // 2. Проверка на закрытый торец (примыкает к другой плите):
                var isClosed = isEdgeClosedByOtherPanel(midWorld, pan, carcassPanels);
                if (!isClosed) {
                    // Открытый торец корпуса (задний, открытый верх/низ) -> 0.4 мм
                    applyCleanButt(pan, ce, buttMat04, 0.4);
                    countOpenEdges++;
                }
                // Если закрытый — торец остаётся чистым (без кромки)
            }
        }
    }
    pan.Build();
    countCarcassEdged++;
}

// --- 7. Завершение и отчёт ---
Action.Commit();

alert(
    'Умная облицовка успешно завершена!\n' +
    '-----------------------------------------\n' +
    '• Фасадов облицовано (0.8 мм по кругу): ' + countFacadesEdged + '\n' +
    '• Деталей корпуса обработано: ' + countCarcassEdged + '\n' +
    '  - Лицевых передних торцов (0.8 мм): ' + countFrontEdges + '\n' +
    '  - Открытых торцов корпуса (0.4 мм): ' + countOpenEdges + '\n' +
    '  - Закрытые торцы стыков: без кромки\n' +
    '-----------------------------------------\n' +
    'Все старые наслоения очищены. Подрезка включена.'
);
