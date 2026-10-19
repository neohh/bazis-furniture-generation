// ===================================================================
// Скрипт: Умная облицовка торцов (выделение досок + выбор торцов рамкой)
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
var OverwriteProp = grMat.NewBool('Заменять старую кромку', true);
var OnlyVisibleInFrameProp = grMat.NewBool('В рамке: только лицевые/открытые', true);

// 2. Действия с торцами
var grAct = prop.NewGroup('2. Нанесение кромки');
var btnFrame = grAct.NewButton('Выбрать торцы РАМКОЙ (2 точки)');
var btnFront = grAct.NewButton('Только ЛИЦЕВЫЕ (передние торцы)');
var btnPerim = grAct.NewButton('По ПЕРИМЕТРУ (фасады, все 4 стороны)');
var btnOpen  = grAct.NewButton('Все ОТКРЫТЫЕ торцы (IsButtVisible)');
var btnClick = grAct.NewButton('Указать торец КЛИКОМ мыши');

// 3. Быстрая авто-облицовка всего шкафа
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

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function getTargetPanels() {
    var list = [];
    if (Model.SelectionCount > 0) {
        for (var i = 0; i < Model.SelectionCount; i++) {
            var obj = Model.Selections[i];
            if (obj && obj.AsPanel) {
                list.push(obj.AsPanel);
            }
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

// Определение 3D-координат центра торца (элемента контура) панели
function getButtMidPoint3D(pan, elemIdx) {
    if (!pan || !pan.Contour || elemIdx < 0 || elemIdx >= pan.Contour.Count) {
        return null;
    }
    var elem = pan.Contour[elemIdx];
    if (!elem) return null;

    var mid2D_x = (elem.Pos1.x + elem.Pos2.x) / 2;
    var mid2D_y = (elem.Pos1.y + elem.Pos2.y) / 2;

    var gMin = pan.GabMin;
    var gMax = pan.GabMax;
    var cMin = pan.Contour.Min;
    var cMax = pan.Contour.Max;

    var thX = gMax.x - gMin.x;
    var thY = gMax.y - gMin.y;
    var thZ = gMax.z - gMin.z;

    var cW = cMax.x - cMin.x;
    var cH = cMax.y - cMin.y;
    var rX = (cW > 0.001) ? (mid2D_x - cMin.x) / cW : 0.5;
    var rY = (cH > 0.001) ? (mid2D_y - cMin.y) / cH : 0.5;

    // Вертикальная панель (стойка, перегородка: толщина по X)
    // local X -> Depth (Z), local Y -> Height (Y)
    if (thX <= 35 && thX < thY && thX < thZ) {
        return {
            x: (gMin.x + gMax.x) / 2,
            y: gMin.y + rY * (gMax.y - gMin.y),
            z: gMin.z + rX * (gMax.z - gMin.z)
        };
    }

    // Горизонтальная панель (полка, крышка, дно: толщина по Y)
    // local X -> Width (X), local Y -> Depth (Z)
    if (thY <= 35 && thY < thX && thY < thZ) {
        return {
            x: gMin.x + rX * (gMax.x - gMin.x),
            y: (gMin.y + gMax.y) / 2,
            z: gMin.z + rY * (gMax.z - gMin.z)
        };
    }

    // Фронтальная панель (фасад, задняя стенка: толщина по Z)
    // local X -> Width (X), local Y -> Height (Y)
    if (thZ <= 35) {
        return {
            x: gMin.x + rX * (gMax.x - gMin.x),
            y: gMin.y + rY * (gMax.y - gMin.y),
            z: (gMin.z + gMax.z) / 2
        };
    }

    return {
        x: (gMin.x + gMax.x) / 2,
        y: (gMin.y + gMax.y) / 2,
        z: (gMin.z + gMax.z) / 2
    };
}

// Определение индекса переднего (лицевого) торца на корпусной детали
function getFrontContourIndex(pan) {
    if (!pan || !pan.Contour || pan.Contour.Count === 0) return -1;

    var gMin = pan.GabMin;
    var gMax = pan.GabMax;
    var thX = gMax.x - gMin.x;
    var thY = gMax.y - gMin.y;
    var thZ = gMax.z - gMin.z;

    // Вертикальная панель: передний торец имеет максимальный local X
    if (thX <= 35 && thX < thY && thX < thZ) {
        var bestV = -1;
        var maxLocalX = -1e9;
        for (var i = 0; i < pan.Contour.Count; i++) {
            var elV = pan.Contour[i];
            var mX = (elV.Pos1.x + elV.Pos2.x) / 2;
            if (mX > maxLocalX) {
                maxLocalX = mX;
                bestV = i;
            }
        }
        return bestV;
    }

    // Горизонтальная панель: передний торец имеет максимальный local Y
    if (thY <= 35 && thY < thX && thY < thZ) {
        var bestH = -1;
        var maxLocalY = -1e9;
        for (var j = 0; j < pan.Contour.Count; j++) {
            var elH = pan.Contour[j];
            var mY = (elH.Pos1.y + elH.Pos2.y) / 2;
            if (mY > maxLocalY) {
                maxLocalY = mY;
                bestH = j;
            }
        }
        return bestH;
    }

    return -1;
}

// Проверка попадания 3D точки в прямоугольную рамку (проекция на экран)
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

    // Запасной расчет по координатам X-Y
    var minX = Math.min(p1.x, p2.x) - 15;
    var maxX = Math.max(p1.x, p2.x) + 15;
    var minY = Math.min(p1.y, p2.y) - 15;
    var maxY = Math.max(p1.y, p2.y) + 15;

    return (pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY);
}

// Надежное нанесение кромки на торец панели
function applyButtToPanel(pan, elemIndex, buttMaterial, clip, overwrite) {
    if (!pan || !buttMaterial) return false;

    var existingIdx = -1;
    if (pan.Butts) {
        for (var b = 0; b < pan.Butts.Count; b++) {
            if (pan.Butts.Butts[b].ElemIndex === elemIndex) {
                existingIdx = b;
                break;
            }
        }
    }

    if (existingIdx >= 0) {
        if (!overwrite) {
            return false;
        }
        // Чтобы избежать наслоения или дублирования кромок:
        var savedButts = [];
        for (var k = 0; k < pan.Butts.Count; k++) {
            var bt = pan.Butts.Butts[k];
            if (bt.ElemIndex !== elemIndex) {
                savedButts.push({
                    elem: bt.ElemIndex,
                    mat: bt.Material,
                    thick: bt.Thickness,
                    width: bt.Width,
                    clip: bt.ClipPanel,
                    sign: bt.Sign,
                    over: bt.Overhung,
                    allow: bt.Allowance
                });
            }
        }

        StartEditing(pan);
        pan.Butts.Clear();

        for (var s = 0; s < savedButts.length; s++) {
            var sb = savedButts[s];
            var restored = pan.AddButt(sb.mat, sb.elem);
            if (restored) {
                restored.Thickness = sb.thick;
                restored.Width = sb.width;
                restored.ClipPanel = sb.clip;
                restored.Sign = sb.sign;
                restored.Overhung = sb.over;
                restored.Allowance = sb.allow;
            }
        }

        var newB = pan.AddButt(buttMaterial, elemIndex);
        if (newB) {
            newB.ClipPanel = clip;
        }
        pan.Build();
        return true;
    } else {
        StartEditing(pan);
        var newB2 = pan.AddButt(buttMaterial, elemIndex);
        if (newB2) {
            newB2.ClipPanel = clip;
        }
        pan.Build();
        return true;
    }
}

// --- ОБРАБОТЧИКИ НАЖАТИЯ КНОПОК ---

// 1. ВЫБОР ТОРЦОВ РАМКОЙ
btnFrame.OnClick = function() {
    Action.AsyncExec(function() {
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
        var overwrite = OverwriteProp.Value;
        var onlyVis = OnlyVisibleInFrameProp.Value;
        var totalButts = 0;
        var panelsMod = 0;

        for (var p = 0; p < targets.length; p++) {
            var pan = targets[p];
            var panChanged = false;
            var frontIdx = getFrontContourIndex(pan);

            for (var c = 0; c < pan.Contour.Count; c++) {
                var midPt = getButtMidPoint3D(pan, c);
                if (midPt && isPointInScreenFrame(midPt, p1, p2)) {
                    // Если включен фильтр только видимых/лицевых:
                    if (onlyVis) {
                        var isFront = (c === frontIdx);
                        var isVis = pan.IsButtVisible(c, 5);
                        var isFacade = (pan.GabMax.z - pan.GabMin.z <= 35);
                        if (!isFront && !isVis && !isFacade) {
                            continue; // пропускаем невидимый задний торец
                        }
                    }

                    if (applyButtToPanel(pan, c, ButtProp, clip, overwrite)) {
                        totalButts++;
                        panChanged = true;
                    }
                }
            }
            if (panChanged) panelsMod++;
        }

        Action.Commit();
        Action.Hint = 'Успешно! Облицовано торцов рамкой: ' + totalButts + ' (на ' + panelsMod + ' панелях)';
    });
};

// 2. ТОЛЬКО ЛИЦЕВЫЕ ТОРЦЫ
btnFront.OnClick = function() {
    Action.AsyncExec(function() {
        var targets = getPanelsToProcess();
        if (targets.length === 0) {
            alert('Нет панелей для обработки!');
            return;
        }

        var clip = ClipProp.Value;
        var overwrite = OverwriteProp.Value;
        var total = 0;
        var panelsMod = 0;

        for (var i = 0; i < targets.length; i++) {
            var pan = targets[i];
            var fIdx = getFrontContourIndex(pan);
            if (fIdx >= 0) {
                if (applyButtToPanel(pan, fIdx, ButtProp, clip, overwrite)) {
                    total++;
                    panelsMod++;
                }
            }
        }

        Action.Commit();
        Action.Hint = 'Успешно! Облицовано передних торцов: ' + total + ' (на ' + panelsMod + ' панелях)';
    });
};

// 3. ПО ПЕРИМЕТРУ (ВСЕ 4 СТОРОНЫ)
btnPerim.OnClick = function() {
    Action.AsyncExec(function() {
        var targets = getTargetPanels();
        if (targets.length === 0) {
            alert('Сначала выделите нужные панели (например, фасады) в Базисе!');
            return;
        }

        var clip = ClipProp.Value;
        var overwrite = OverwriteProp.Value;
        var total = 0;

        for (var i = 0; i < targets.length; i++) {
            var pan = targets[i];
            for (var c = 0; c < pan.Contour.Count; c++) {
                if (applyButtToPanel(pan, c, ButtProp, clip, overwrite)) {
                    total++;
                }
            }
        }

        Action.Commit();
        Action.Hint = 'Успешно! Облицовано по периметру: ' + targets.length + ' панелей (' + total + ' торцов)';
    });
};

// 4. ВСЕ ОТКРЫТЫЕ ТОРЦЫ
btnOpen.OnClick = function() {
    Action.AsyncExec(function() {
        var targets = getPanelsToProcess();
        if (targets.length === 0) {
            alert('Нет панелей для обработки!');
            return;
        }

        var clip = ClipProp.Value;
        var overwrite = OverwriteProp.Value;
        var total = 0;
        var panelsMod = 0;

        for (var i = 0; i < targets.length; i++) {
            var pan = targets[i];
            var panChanged = false;
            for (var c = 0; c < pan.Contour.Count; c++) {
                if (pan.IsButtVisible(c, 5)) {
                    if (applyButtToPanel(pan, c, ButtProp, clip, overwrite)) {
                        total++;
                        panChanged = true;
                    }
                }
            }
            if (panChanged) panelsMod++;
        }

        Action.Commit();
        Action.Hint = 'Успешно! Облицовано открытых торцов: ' + total + ' (на ' + panelsMod + ' панелях)';
    });
};

// 5. УКАЗАТЬ ТОРИЦ КЛИКОМ
btnClick.OnClick = function() {
    Action.AsyncExec(function() {
        Action.Hint = 'Кликните ребро детали (нажмите Esc для завершения)';
        var clip = ClipProp.Value;
        var overwrite = OverwriteProp.Value;
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
                    var cMid = getButtMidPoint3D(pan, c);
                    if (cMid) {
                        var dist = Math.sqrt(
                            Math.pow(cMid.x - edgeMid.x, 2) +
                            Math.pow(cMid.y - edgeMid.y, 2) +
                            Math.pow(cMid.z - edgeMid.z, 2)
                        );
                        if (dist < 20) {
                            applyButtToPanel(pan, c, ButtProp, clip, overwrite);
                            Action.Commit();
                            Action.Hint = 'Облицован торец панели: ' + pan.Name;
                            found = true;
                            break;
                        }
                    }
                }
                if (found) break;
            }
        }
    });
};

// 6. ОЧИСТИТЬ КРОМКИ
btnClearButts.OnClick = function() {
    Action.AsyncExec(function() {
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
    });
};

// 7. ЭКСПРЕСС-ОБЛИЦОВКА ВСЕГО ШКАФА
btnAutoCabinet.OnClick = function() {
    Action.AsyncExec(function() {
        var allPanels = getAllPanels();
        if (allPanels.length === 0) {
            alert('В модели нет панелей!');
            return;
        }

        // Запрос кромки 0.8 и 0.4
        Action.Hint = 'Выберите кромку 0.8 мм (для фасадов и переда)';
        var mat08 = NewButtMaterialInput('Кромка 0.8 мм (фасады и лицевые)');
        if (!mat08) return;

        Action.Hint = 'Выберите кромку 0.4 мм (для открытых торцов корпуса)';
        var mat04 = NewButtMaterialInput('Кромка 0.4 мм (корпус)');
        if (!mat04) return;

        var selectedFacades = getTargetPanels();
        var facadeCount = 0;
        var frontCount = 0;
        var openCount = 0;

        // Помечаем фасады (если были выделены пользователем, либо фронтальные по геометрии)
        for (var f = 0; f < selectedFacades.length; f++) {
            var fac = selectedFacades[f];
            StartEditing(fac);
            fac.Butts.Clear();
            for (var fe = 0; fe < fac.Contour.Count; fe++) {
                var b1 = fac.AddButt(mat08, fe);
                if (b1) b1.ClipPanel = true;
            }
            fac.Build();
            facadeCount++;
        }

        // Корпус: лицевые 0.8, открытые 0.4
        for (var i = 0; i < allPanels.length; i++) {
            var p = allPanels[i];
            // Пропускаем фасады, которые уже обработали
            var alreadyDone = false;
            for (var sf = 0; sf < selectedFacades.length; sf++) {
                if (selectedFacades[sf] === p) {
                    alreadyDone = true;
                    break;
                }
            }
            if (alreadyDone) continue;

            var fIndex = getFrontContourIndex(p);
            StartEditing(p);
            p.Butts.Clear();

            for (var e = 0; e < p.Contour.Count; e++) {
                if (e === fIndex) {
                    var bF = p.AddButt(mat08, e);
                    if (bF) bF.ClipPanel = true;
                    frontCount++;
                } else if (p.IsButtVisible(e, 5)) {
                    var bO = p.AddButt(mat04, e);
                    if (bO) bO.ClipPanel = true;
                    openCount++;
                }
            }
            p.Build();
        }

        Action.Commit();
        Action.Hint = 'Экспресс-облицовка завершена! Фасадов: ' + facadeCount + ', переда: ' + frontCount + ', корпуса 0.4: ' + openCount;
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
