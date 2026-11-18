// ==============================================================================
// 20_Умное_изменение_размера_панелей_с_фурнитурой.js
// Скрипт для быстрого и точного изменения размеров выбранных панелей
// (как одной, так и группы деталей сразу) с опцией сдвига прилегающего крепежа.
// ==============================================================================

var Prop = Action.Properties;
Prop.Clear();

// --- 1. ГРУППА: ВЫБРАННЫЕ ДЕТАЛИ ---
var grSel = Prop.NewGroup('1. Выбранные детали');
var pSelCount = grSel.NewString('Выбрано деталей', '0 шт.');
pSelCount.ReadOnly = true;
var pCurSize = grSel.NewString('Размер первой детали', '-');
pCurSize.ReadOnly = true;
var btnPick = grSel.NewButton('Выбрать деталь кликом в 3D');

// --- 2. ГРУППА: ПАРАМЕТРЫ ИЗМЕНЕНИЯ ---
var grParam = Prop.NewGroup('2. Параметры изменения');
var pMode = grParam.NewCombo('Режим изменения',
    'Изменить на дельту (+/- мм)\n' +
    'Задать точный размер (мм)'
);
pMode.ItemIndex = 0; // По умолчанию: дельта

var pAxis = grParam.NewCombo('Направление / Ось',
    'По глубине шкафа (ось Z)\n' +
    'По ширине шкафа (ось X)\n' +
    'По высоте шкафа (ось Y)\n' +
    'По большей стороне (Длина L)\n' +
    'По меньшей стороне (Ширина W)'
);
pAxis.ItemIndex = 0; // По умолчанию: Z (глубина)

var pValue = grParam.NewNumber('Значение (мм)', -20);

var pSide = grParam.NewCombo('Откуда изменять (край)',
    'С конца (+: передний / правый / верхний край)\n' +
    'С начала (-: задний / левый / нижний край)\n' +
    'С двух сторон (симметрично от центра)'
);
pSide.ItemIndex = 0;

// --- 3. ГРУППА: ОПЦИИ ---
var grOpt = Prop.NewGroup('3. Опции');
var pMoveFurn = grOpt.NewBool('Двигать прилегающий крепеж', true);

// --- 4. ГРУППА: ДЕЙСТВИЯ ---
var grAct = Prop.NewGroup('4. Действия');
var btnApply = grAct.NewButton('Применить к выбранным');
var btnFinish = grAct.NewButton('Завершить работу');

// Кнопка внизу панели команд
var btnBarFinish = NewButtonInput('Завершить');
btnBarFinish.OnChange = function() {
    Action.Finish();
};

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function extractPanels(obj, list) {
    if (!obj) return;
    if (obj.AsPanel) {
        list.push(obj.AsPanel);
        return;
    }
    if (obj.Count) {
        for (var i = 0; i < obj.Count; i++) {
            var child = obj.Objects ? obj.Objects[i] : obj[i];
            extractPanels(child, list);
        }
    }
}

function getSelectedPanels() {
    var raw = [];
    if (Model.SelectionCount > 0) {
        for (var s = 0; s < Model.SelectionCount; s++) {
            extractPanels(Model.Selections[s], raw);
        }
    }
    var unique = [];
    for (var i = 0; i < raw.length; i++) {
        var p = raw[i];
        if (p && unique.indexOf(p) === -1) {
            unique.push(p);
        }
    }
    return unique;
}

function extractAllFasteners(obj, list) {
    if (!obj) return;
    var isF = false;
    try {
        if (obj.IsFastener) isF = true;
    } catch(e) {}
    if (!isF && obj.Name) {
        var nm = obj.Name.toLowerCase();
        if (nm.indexOf('стяжк') !== -1 || nm.indexOf('rafix') !== -1 || nm.indexOf('vb') !== -1 ||
            nm.indexOf('евро') !== -1 || nm.indexOf('конфир') !== -1 || nm.indexOf('полкодерж') !== -1) {
            isF = true;
        }
    }
    if (isF) {
        list.push(obj);
        return;
    }
    if (obj.Count) {
        for (var i = 0; i < obj.Count; i++) {
            var child = obj.Objects ? obj.Objects[i] : obj[i];
            extractAllFasteners(child, list);
        }
    }
}

function updateInfo() {
    var panels = getSelectedPanels();
    pSelCount.Value = panels.length + ' шт.';
    if (panels.length > 0) {
        var p0 = panels[0];
        var sx = Math.round(p0.GabMax.x - p0.GabMin.x);
        var sy = Math.round(p0.GabMax.y - p0.GabMin.y);
        var sz = Math.round(p0.GabMax.z - p0.GabMin.z);
        var cW = Math.round(p0.Contour.Width);
        var cH = Math.round(p0.Contour.Height);
        pCurSize.Value = p0.Name + ' [' + cW + 'x' + cH + ', 3D: ' + sx + 'x' + sy + 'x' + sz + ']';
    } else {
        pCurSize.Value = 'Ничего не выбрано';
    }
}

btnPick.OnClick = function() {
    Action.Hint = 'Кликните деталь в 3D для выбора';
    try {
        var p = GetPanel('Кликните деталь для изменения размера');
        if (p) {
            p.Selected = true;
            updateInfo();
            Action.Hint = 'Выбрана деталь: ' + p.Name;
        }
    } catch(ePick) {}
};

// --- ОСНОВНАЯ ЛОГИКА ИЗМЕНЕНИЯ РАЗМЕРА ---
function executeResize() {
    var panels = getSelectedPanels();
    if (panels.length === 0) {
        alert('Не выбрано ни одной детали! Выделите панели в 3D или кликните "Выбрать деталь кликом в 3D".');
        return;
    }

    var mode = pMode.ItemIndex; // 0 - дельта, 1 - точный
    var axisMode = pAxis.ItemIndex; // 0: Z, 1: X, 2: Y, 3: L, 4: W
    var val = pValue.Value;
    var side = pSide.ItemIndex; // 0: конец (+), 1: начало (-), 2: симметрично
    var doMoveFurn = pMoveFurn.Value;

    if (mode === 1 && val <= 5) {
        alert('Точный размер должен быть больше 5 мм!');
        return;
    }
    if (mode === 0 && Math.abs(val) < 0.001) {
        alert('Дельта изменения равна 0! Укажите, на сколько мм изменить размер.');
        return;
    }

    // Собираем все крепежи модели для возможного сдвига
    var allFasteners = [];
    if (doMoveFurn) {
        extractAllFasteners(Model, allFasteners);
    }
    var movedFasteners = [];

    var countModified = 0;
    var countFurnMoved = 0;

    for (var i = 0; i < panels.length; i++) {
        var pan = panels[i];
        if (!pan || !pan.Contour || pan.Contour.Count === 0) continue;

        var cMin = pan.Contour.Min;
        var cMax = pan.Contour.Max;
        var curW = cMax.x - cMin.x;
        var curH = cMax.y - cMin.y;

        var vLocalX = pan.NToGlobal(NewVector(1, 0, 0));
        var vLocalY = pan.NToGlobal(NewVector(0, 1, 0));
        var vLocalZ = pan.NToGlobal(NewVector(0, 0, 1)); // толщина

        var targetLocalAxis = 'X'; // 'X' или 'Y'
        var dot = 1.0;
        var globalAxisKey = 'z';
        var gDirUnit = NewVector(0, 0, 1);

        if (axisMode === 0) { // Z (глубина)
            globalAxisKey = 'z';
            gDirUnit = NewVector(0, 0, 1);
            var dotX = vLocalX.z;
            var dotY = vLocalY.z;
            if (Math.abs(dotX) >= Math.abs(dotY)) {
                targetLocalAxis = 'X';
                dot = dotX;
            } else {
                targetLocalAxis = 'Y';
                dot = dotY;
            }
        } else if (axisMode === 1) { // X (ширина)
            globalAxisKey = 'x';
            gDirUnit = NewVector(1, 0, 0);
            var dotX = vLocalX.x;
            var dotY = vLocalY.x;
            if (Math.abs(dotX) >= Math.abs(dotY)) {
                targetLocalAxis = 'X';
                dot = dotX;
            } else {
                targetLocalAxis = 'Y';
                dot = dotY;
            }
        } else if (axisMode === 2) { // Y (высота)
            globalAxisKey = 'y';
            gDirUnit = NewVector(0, 1, 0);
            var dotX = vLocalX.y;
            var dotY = vLocalY.y;
            if (Math.abs(dotX) >= Math.abs(dotY)) {
                targetLocalAxis = 'X';
                dot = dotX;
            } else {
                targetLocalAxis = 'Y';
                dot = dotY;
            }
        } else if (axisMode === 3) { // По большей стороне (Длина)
            if (curW >= curH) {
                targetLocalAxis = 'X';
                dot = 1.0;
            } else {
                targetLocalAxis = 'Y';
                dot = 1.0;
            }
        } else if (axisMode === 4) { // По меньшей стороне (Ширина)
            if (curW <= curH) {
                targetLocalAxis = 'X';
                dot = 1.0;
            } else {
                targetLocalAxis = 'Y';
                dot = 1.0;
            }
        }

        var oldSpan = (targetLocalAxis === 'X') ? curW : curH;
        var delta = 0;
        if (mode === 0) {
            delta = val; // дельта в мм (+ или -)
        } else {
            delta = val - oldSpan; // точный размер
        }

        if (oldSpan + delta <= 5) {
            continue; // защита от схлопывания в 0
        }

        // Запоминаем старые габариты панели для поиска крепежа
        var oldGabMin = NewVector(pan.GabMin.x, pan.GabMin.y, pan.GabMin.z);
        var oldGabMax = NewVector(pan.GabMax.x, pan.GabMax.y, pan.GabMax.z);

        // Рассчитываем новые границы контура
        var newMinX = cMin.x;
        var newMaxX = cMax.x;
        var newMinY = cMin.y;
        var newMaxY = cMax.y;

        if (targetLocalAxis === 'X') {
            if (side === 2) { // Симметрично
                var half = delta / 2.0;
                newMinX = cMin.x - half;
                newMaxX = cMax.x + half;
            } else if (side === 0) { // С конца (+)
                if (dot > 0) {
                    newMaxX = cMax.x + delta;
                } else {
                    newMinX = cMin.x - delta;
                }
            } else if (side === 1) { // С начала (-)
                if (dot > 0) {
                    newMinX = cMin.x - delta;
                } else {
                    newMaxX = cMax.x + delta;
                }
            }
        } else {
            if (side === 2) { // Симметрично
                var half = delta / 2.0;
                newMinY = cMin.y - half;
                newMaxY = cMax.y + half;
            } else if (side === 0) { // С конца (+)
                if (dot > 0) {
                    newMaxY = cMax.y + delta;
                } else {
                    newMinY = cMin.y - delta;
                }
            } else if (side === 1) { // С начала (-)
                if (dot > 0) {
                    newMinY = cMin.y - delta;
                } else {
                    newMaxY = cMax.y + delta;
                }
            }
        }

        // Применяем изменение контура
        StartEditing(pan);
        pan.Contour.Fit(newMinX, newMinY, newMaxX, newMaxY);
        pan.Build();
        countModified++;

        // Сдвиг прилегающего крепежа
        if (doMoveFurn && allFasteners.length > 0) {
            for (var f = 0; f < allFasteners.length; f++) {
                var fObj = allFasteners[f];
                if (!fObj || movedFasteners.indexOf(fObj) !== -1) continue;

                var fPos = fObj.Position;
                if (!fPos && fObj.GabMin && fObj.GabMax) {
                    fPos = NewVector(
                        (fObj.GabMin.x + fObj.GabMax.x) / 2,
                        (fObj.GabMin.y + fObj.GabMax.y) / 2,
                        (fObj.GabMin.z + fObj.GabMax.z) / 2
                    );
                }
                if (!fPos) continue;

                // Проверяем, прилегает ли крепеж к этой детали (с допуском 30 мм)
                var nearPanel = (
                    fPos.x >= (oldGabMin.x - 30) && fPos.x <= (oldGabMax.x + 30) &&
                    fPos.y >= (oldGabMin.y - 30) && fPos.y <= (oldGabMax.y + 30) &&
                    fPos.z >= (oldGabMin.z - 30) && fPos.z <= (oldGabMax.z + 30)
                );
                if (!nearPanel) continue;

                // Определяем, относится ли крепеж к подвижному краю
                var shiftVec = null;
                if (side === 0) { // Подвижный край - конец (+)
                    var dMax = Math.abs(fPos[globalAxisKey] - oldGabMax[globalAxisKey]);
                    var dMin = Math.abs(fPos[globalAxisKey] - oldGabMin[globalAxisKey]);
                    if (dMax <= 120 && dMax < dMin) {
                        shiftVec = NewVector(
                            gDirUnit.x * delta,
                            gDirUnit.y * delta,
                            gDirUnit.z * delta
                        );
                    }
                } else if (side === 1) { // Подвижный край - начало (-)
                    var dMax = Math.abs(fPos[globalAxisKey] - oldGabMax[globalAxisKey]);
                    var dMin = Math.abs(fPos[globalAxisKey] - oldGabMin[globalAxisKey]);
                    if (dMin <= 120 && dMin < dMax) {
                        shiftVec = NewVector(
                            gDirUnit.x * (-delta),
                            gDirUnit.y * (-delta),
                            gDirUnit.z * (-delta)
                        );
                    }
                } else if (side === 2) { // Симметрично
                    var dMax = Math.abs(fPos[globalAxisKey] - oldGabMax[globalAxisKey]);
                    var dMin = Math.abs(fPos[globalAxisKey] - oldGabMin[globalAxisKey]);
                    if (dMax <= 120 && dMax < dMin) {
                        shiftVec = NewVector(
                            gDirUnit.x * (delta / 2.0),
                            gDirUnit.y * (delta / 2.0),
                            gDirUnit.z * (delta / 2.0)
                        );
                    } else if (dMin <= 120 && dMin < dMax) {
                        shiftVec = NewVector(
                            gDirUnit.x * (-delta / 2.0),
                            gDirUnit.y * (-delta / 2.0),
                            gDirUnit.z * (-delta / 2.0)
                        );
                    }
                }

                if (shiftVec) {
                    try {
                        fObj.Translate(shiftVec);
                        if (fObj.Build) fObj.Build();
                        movedFasteners.push(fObj);
                        countFurnMoved++;
                    } catch(eTr) {}
                }
            }
        }
    }

    Action.Commit();
    updateInfo();

    var msg = 'Успешно изменено деталей: ' + countModified + ' шт.';
    if (doMoveFurn && countFurnMoved > 0) {
        msg += ' | Сдвинуто крепежей: ' + countFurnMoved + ' шт.';
    }
    Action.Hint = msg;
}

btnApply.OnClick = function() {
    executeResize();
};

btnFinish.OnClick = function() {
    Action.Finish();
};

// При старте скрипта сразу считываем выделение
updateInfo();
Action.Continue();
