// ===================================================================
// Скрипт: Умная облицовка торцов (выделение досок + выбор торцов)
// Для САПР Базис-Мебельщик
// Кодировка: Windows-1251 (CP1251)
// ===================================================================

Action.Hint = 'Умная облицовка: выберите кромку слева и нажмите нужное действие';

// --- ПАНЕЛЬ СВОЙСТВ СЛЕВА ---
var prop = Action.Properties;

// 1. Материал кромки
var grMat = prop.NewGroup('1. Кромочный материал');
var ButtProp = grMat.NewButt('Кромка');
var ClipProp = grMat.NewBool('Подрезать деталь (ClipPanel)', true);

// 2. Действия на выделенных панелях
var grAct = prop.NewGroup('2. Нанесение на выделенные панели');
var btnFront = grAct.NewButton('Только ЛИЦЕВЫЕ (передние торцы)');
var btnPerim = grAct.NewButton('По ПЕРИМЕТРУ (все 4 стороны / фасады)');
var btnOpen  = grAct.NewButton('Все ОТКРЫТЫЕ торцы (видимые)');
var btnFrame = grAct.NewButton('Выбрать торцы РАМКОЙ (2 точки)');
var btnClick = grAct.NewButton('Указать торец КЛИКОМ мыши');

// 3. Экспресс-облицовка всего шкафа
var grAuto = prop.NewGroup('3. Экспресс-облицовка шкафа');
var btnAutoCabinet = grAuto.NewButton('Облицевать весь шкаф (фасады+перед 0.8, корпус 0.4)');

// 4. Очистка и выделение
var grSel = prop.NewGroup('4. Выделение и очистка');
var btnClearButts = grSel.NewButton('Очистить кромки на выбранных');
var btnSelectAll = grSel.NewButton('Выделить ВСЕ панели модели');
var btnUnselectAll = grSel.NewButton('Снять выделение');

// Кнопка завершения внизу командной строки
var btnFinish = NewButtonInput('Завершить работу');
btnFinish.OnChange = function() {
    Action.Finish();
};

// --- ФУНКЦИИ ГЕОМЕТРИИ И 3D ---

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

function getTargetPanels() {
    var list = [];
    if (Model.SelectionCount > 0) {
        for (var i = 0; i < Model.SelectionCount; i++) {
            extractPanels(Model.Selections[i], list);
        }
    }
    return list;
}

function getAllPanels() {
    var list = [];
    Model.forEachPanel(function(p) {
        if (p && p.AsPanel) {
            list.push(p.AsPanel);
        }
    });
    return list;
}

function getPanelsToProcess() {
    var list = getTargetPanels();
    if (list.length === 0) {
        list = getAllPanels();
    }
    return list;
}

function getEdge3D(pan, elemIdx) {
    if (!pan || !pan.Contour || elemIdx < 0 || elemIdx >= pan.Contour.Count) {
        return null;
    }
    var elem = pan.Contour[elemIdx];
    if (!elem) return null;

    var p1 = pan.ToGlobal(NewVector(elem.Pos1.x, elem.Pos1.y, 0));
    var p2 = pan.ToGlobal(NewVector(elem.Pos2.x, elem.Pos2.y, 0));

    return {
        x: (p1.x + p2.x) / 2,
        y: (p1.y + p2.y) / 2,
        z: (p1.z + p2.z) / 2,
        p1: p1,
        p2: p2
    };
}

// Определение индекса переднего (лицевого) торца на детали
function getFrontContourIndex(pan) {
    if (!pan || !pan.Contour || pan.Contour.Count === 0) return -1;

    var dz = pan.GabMax.z - pan.GabMin.z;
    var dx = pan.GabMax.x - pan.GabMin.x;
    var dy = pan.GabMax.y - pan.GabMin.y;

    // Фронтальные детали (фасады, двери, задняя стенка):
    // Толщина по Z <= 35, ширина и высота большие -> у них нет переднего торца, спереди пласть
    if (dz <= 35 && dx > 50 && dy > 50) {
        return -1;
    }

    var bestIdx = -1;
    var maxZ = -1e9;

    for (var i = 0; i < pan.Contour.Count; i++) {
        var elem = pan.Contour[i];
        if (elem) {
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

function isPointInScreenFrame(pt, p1, p2) {
    if (Action.RightDir && Action.UpDir) {
        var r = Action.RightDir;
        var u = Action.UpDir;

        var u1 = p1.x * r.x + p1.y * r.y + p1.z * r.z;
        var v1 = p1.x * u.x + p1.y * u.y + p1.z * u.z;

        var u2 = p2.x * r.x + p2.y * r.y + p2.z * r.z;
        var v2 = p2.x * u.x + p2.y * u.y + p2.z * u.z;

        var minU = Math.min(u1, u2) - 15;
        var maxU = Math.max(u1, u2) + 15;
        var minV = Math.min(v1, v2) - 15;
        var maxV = Math.max(v1, v2) + 15;

        var uPt = pt.x * r.x + pt.y * r.y + pt.z * r.z;
        var vPt = pt.x * u.x + pt.y * u.y + pt.z * u.z;

        if (uPt >= minU && uPt <= maxU && vPt >= minV && vPt <= maxV) {
            return true;
        }
        return false;
    }

    var minX = Math.min(p1.x, p2.x) - 15;
    var maxX = Math.max(p1.x, p2.x) + 15;
    var minY = Math.min(p1.y, p2.y) - 15;
    var maxY = Math.max(p1.y, p2.y) + 15;

    return (pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY);
}

// ПРЯМОЕ И БЕЗОПАСНОЕ НАНЕСЕНИЕ КРОМКИ ИЗ БАЗЫ:
// Назначает реальный материал ButtProp со всеми его цветами, знаками и текстурами!
// Заменяет только торец elemIndex, НЕ ТРОГАЯ остальные 3 стороны!
function applyButtToPanel(pan, elemIndex, buttMaterial, clip) {
    if (!pan || !buttMaterial || elemIndex < 0 || elemIndex >= pan.Contour.Count) {
        return false;
    }
    StartEditing(pan);
    var b = pan.AddButt(buttMaterial, elemIndex);
    if (b) {
        b.ClipPanel = clip;
    }
    pan.Build();
    return true;
}

// --- ОБРАБОТЧИКИ НАЖАТИЯ КНОПОК ---

// 1. ТОЛЬКО ЛИЦЕВЫЕ (ПЕРЕДНИЕ) ТОРЦЫ
btnFront.OnClick = function() {
    Action.AsyncExec(function() {
        try {
            var targets = getPanelsToProcess();
            if (targets.length === 0) {
                alert('Нет панелей для обработки!');
                return;
            }

            var clip = ClipProp.Value;
            var count = 0;
            var panelsMod = 0;

            for (var i = 0; i < targets.length; i++) {
                var pan = targets[i];
                var fIdx = getFrontContourIndex(pan);
                if (fIdx >= 0) {
                    if (applyButtToPanel(pan, fIdx, ButtProp, clip)) {
                        count++;
                        panelsMod++;
                    }
                }
            }

            Action.Commit();
            Action.Hint = 'Успешно! Облицовано передних торцов: ' + count + ' (на ' + panelsMod + ' панелях). Зеленая кромка нанесена!';
        } catch (err) {
            alert('Ошибка в обработке: ' + err.message);
        }
    });
};

// 2. ПО ПЕРИМЕТРУ (ВСЕ 4 СТОРОНЫ)
btnPerim.OnClick = function() {
    Action.AsyncExec(function() {
        try {
            var targets = getTargetPanels();
            if (targets.length === 0) {
                alert('Сначала выделите нужные панели (например, фасады) в Базисе!');
                return;
            }

            var clip = ClipProp.Value;
            var count = 0;

            for (var i = 0; i < targets.length; i++) {
                var pan = targets[i];
                for (var c = 0; c < pan.Contour.Count; c++) {
                    if (applyButtToPanel(pan, c, ButtProp, clip)) {
                        count++;
                    }
                }
            }

            Action.Commit();
            Action.Hint = 'Успешно! Облицовано по периметру: ' + targets.length + ' панелей (' + count + ' торцов)';
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    });
};

// 3. ВСЕ ОТКРЫТЫЕ ТОРЦЫ
btnOpen.OnClick = function() {
    Action.AsyncExec(function() {
        try {
            var targets = getPanelsToProcess();
            if (targets.length === 0) {
                alert('Нет панелей для обработки!');
                return;
            }

            var clip = ClipProp.Value;
            var count = 0;
            var panelsMod = 0;

            for (var i = 0; i < targets.length; i++) {
                var pan = targets[i];
                var panMod = false;
                for (var c = 0; c < pan.Contour.Count; c++) {
                    if (pan.IsButtVisible(c, 5)) {
                        if (applyButtToPanel(pan, c, ButtProp, clip)) {
                            count++;
                            panMod = true;
                        }
                    }
                }
                if (panMod) panelsMod++;
            }

            Action.Commit();
            Action.Hint = 'Успешно! Облицовано открытых торцов: ' + count + ' (на ' + panelsMod + ' панелях)';
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    });
};

// 4. ВЫБОР ТОРЦОВ РАМКОЙ (2 ТОЧКИ)
btnFrame.OnClick = function() {
    Action.AsyncExec(function() {
        try {
            var targets = getPanelsToProcess();
            if (targets.length === 0) {
                alert('В модели нет панелей!');
                return;
            }

            Action.Hint = 'Шаг 1/2: Кликните 1-й угол рамки в окне модели';
            var p1 = GetPoint('Укажите первый угол рамки');
            if (!p1) return;

            Action.Hint = 'Шаг 2/2: Кликните 2-й угол рамки (по диагонали)';
            var p2 = GetPoint('Укажите противоположный угол рамки');
            if (!p2) return;

            var clip = ClipProp.Value;
            var count = 0;
            var panelsMod = 0;

            for (var p = 0; p < targets.length; p++) {
                var pan = targets[p];
                var panMod = false;

                for (var c = 0; c < pan.Contour.Count; c++) {
                    var mid = getEdge3D(pan, c);
                    if (mid && isPointInScreenFrame(mid, p1, p2)) {
                        if (applyButtToPanel(pan, c, ButtProp, clip)) {
                            count++;
                            panMod = true;
                        }
                    }
                }
                if (panMod) panelsMod++;
            }

            Action.Commit();
            Action.Hint = 'Облицовано торцов рамкой: ' + count + ' (на ' + panelsMod + ' панелях)';
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    });
};

// 5. УКАЗАТЬ ТОРИЦ КЛИКОМ
btnClick.OnClick = function() {
    Action.AsyncExec(function() {
        try {
            Action.Hint = 'Кликните ребро детали (Esc - завершить)';
            var clip = ClipProp.Value;
            var allPanels = getAllPanels();

            while (true) {
                var edge = GetEdge('Кликните ребро/торец детали (Esc - выход)');
                if (!edge) break;

                var edgeMid = {
                    x: (edge.GFirst.x + edge.GLast.x) / 2,
                    y: (edge.GFirst.y + edge.GLast.y) / 2,
                    z: (edge.GFirst.z + edge.GLast.z) / 2
                };

                var found = false;
                for (var p = 0; p < allPanels.length; p++) {
                    var pan = allPanels[p];
                    for (var c = 0; c < pan.Contour.Count; c++) {
                        var cMid = getEdge3D(pan, c);
                        if (cMid) {
                            var dist = Math.sqrt(
                                Math.pow(cMid.x - edgeMid.x, 2) +
                                Math.pow(cMid.y - edgeMid.y, 2) +
                                Math.pow(cMid.z - edgeMid.z, 2)
                            );
                            if (dist < 15) {
                                applyButtToPanel(pan, c, ButtProp, clip);
                                Action.Commit();
                                Action.Hint = 'Облицован торец детали: ' + pan.Name;
                                found = true;
                                break;
                            }
                        }
                    }
                    if (found) break;
                }
            }
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    });
};

// 6. ОЧИСТИТЬ КРОМКИ
btnClearButts.OnClick = function() {
    Action.AsyncExec(function() {
        try {
            var targets = getTargetPanels();
            if (targets.length === 0) {
                alert('Сначала выделите панели, с которых нужно снять кромку!');
                return;
            }

            for (var i = 0; i < targets.length; i++) {
                var pan = targets[i];
                if (pan.Butts && pan.Butts.Count > 0) {
                    StartEditing(pan);
                    pan.Butts.Clear();
                    pan.Build();
                }
            }

            Action.Commit();
            Action.Hint = 'Кромки удалены с ' + targets.length + ' выбранных панелей';
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    });
};

// 7. ЭКСПРЕСС-ОБЛИЦОВКА ВСЕГО ШКАФА
btnAutoCabinet.OnClick = function() {
    Action.AsyncExec(function() {
        try {
            var allPanels = getAllPanels();
            if (allPanels.length === 0) {
                alert('В модели нет панелей!');
                return;
            }

            Action.Hint = 'Выберите кромку 0.8 мм (для фасадов и передних торцов)';
            var mat08 = NewButtMaterialInput('Кромка 0.8 мм (фасады и перед)');
            if (!mat08) return;

            Action.Hint = 'Выберите кромку 0.4 мм (для открытых торцов корпуса)';
            var mat04 = NewButtMaterialInput('Кромка 0.4 мм (корпус)');
            if (!mat04) return;

            var selectedFacades = getTargetPanels();
            var facadeCount = 0;
            var frontCount = 0;
            var openCount = 0;

            // Если были выделены фасады — кромим их 0.8 по кругу
            for (var f = 0; f < selectedFacades.length; f++) {
                var fac = selectedFacades[f];
                for (var fe = 0; fe < fac.Contour.Count; fe++) {
                    if (applyButtToPanel(fac, fe, mat08, true)) {
                        facadeCount++;
                    }
                }
            }

            // Корпус: передние торцы 0.8, открытые 0.4
            for (var i = 0; i < allPanels.length; i++) {
                var p = allPanels[i];

                var isFac = false;
                for (var sf = 0; sf < selectedFacades.length; sf++) {
                    if (selectedFacades[sf] === p) {
                        isFac = true;
                        break;
                    }
                }
                if (isFac) continue;

                var fIndex = getFrontContourIndex(p);
                for (var e = 0; e < p.Contour.Count; e++) {
                    if (e === fIndex) {
                        if (applyButtToPanel(p, e, mat08, true)) {
                            frontCount++;
                        }
                    } else if (p.IsButtVisible(e, 5)) {
                        if (applyButtToPanel(p, e, mat04, true)) {
                            openCount++;
                        }
                    }
                }
            }

            Action.Commit();
            Action.Hint = 'Экспресс-облицовка завершена! Фасадов: ' + selectedFacades.length + ', передних: ' + frontCount + ', корпуса 0.4: ' + openCount;
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    });
};

// 8. УПРАВЛЕНИЕ ВЫДЕЛЕНИЕМ
btnSelectAll.OnClick = function() {
    SelectAll();
    Action.Hint = 'Выделены все объекты модели';
};

btnUnselectAll.OnClick = function() {
    UnSelectAll();
    Action.Hint = 'Выделение снято';
};

// Запуск интерактивного режима
Action.Continue();
