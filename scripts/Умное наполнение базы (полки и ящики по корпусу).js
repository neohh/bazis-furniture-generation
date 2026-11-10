/**
 * Умное наполнение базы (полки и ящики из фрагмента 'Ящик Базовый.fr3d')
 * Для БАЗИС-Мебельщик (8, 9, 10, 11, 2021-2024)
 * 
 * 1. Выделяешь шкаф/модуль (или кликаешь по корпусу).
 * 2. Скрипт САМ находит внутренние границы ниши:
 *    - Ширина: строго между внутренними плоскостями боковин.
 *    - Высота: от верхней пласти дна (над ножками!) до низа верхней крышки.
 *    - Глубина: от задней стенки (задника) до переднего края боковин.
 * 3. Ящики берутся напрямую из фрагмента 'Ящик Базовый.fr3d' и эластично растягиваются
 *    и в ширину, и в высоту строго ОДИН РАЗ (детали не слетают, геометрия идеальна)!
 * 4. Сопряжение строго по РАМКЕ ящика: металл направляющих прилегает встык к боковинам (зазор 0 мм),
 *    а вычитающие цилиндры крепежа заходят внутрь боковин на 10 мм!
 * 5. Задавать ящики можно РАВНОМЕРНО или КАЖДЫЙ ОТДЕЛЬНО по высотам!
 * 6. Нижний ящик никогда не врезается в дно или ножки корпуса!
 */

// -----------------------------------------------------------------------------
// 1. Поиск пути к фрагменту 'Ящик Базовый.fr3d'
// -----------------------------------------------------------------------------
function getDrawerFragmentPath() {
    var paths = [
        'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Ящики\\Ящик Базовый.fr3d',
        'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Мои ящики\\Ящик Базовый.fr3d',
        'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\08_ЯЩИКИ_И_ВЫДВИЖНЫЕ_СИСТЕМЫ\\Ящик Базовый.fr3d',
        'z:\\Work\\генерация мебели\\Модели\\Ящики\\Ящик Базовый.fr3d'
    ];
    for (var i = 0; i < paths.length; i++) {
        if (system.fileExists(paths[i])) {
            return paths[i];
        }
    }
    return paths[0];
}

var drawerFragmentFile = getDrawerFragmentPath();
var hasDrawerFragment = system.fileExists(drawerFragmentFile);

// -----------------------------------------------------------------------------
// 2. Поиск и выбор базы (шкафа / модуля)
// -----------------------------------------------------------------------------
var baseObj = null;

if (Model.Selected) {
    baseObj = Model.Selected;
} else if (Model.SelectionCount > 0) {
    baseObj = Model.Selections[0];
}

if (!baseObj) {
    Action.Hint = 'Укажите корпус базы (шкаф / модуль / любую деталь корпуса)';
    baseObj = GetObject('Укажите корпус базы (шкаф или деталь корпуса)');
}

if (!baseObj) {
    Action.Finish();
}

// Если кликнули на деталь внутри блока, поднимаемся на 1 уровень к блоку модуля
if (baseObj && baseObj.Owner && baseObj.Owner !== Model) {
    var ownerObj = baseObj.Owner;
    if (ownerObj && ownerObj !== Model) {
        baseObj = ownerObj;
    }
}

// Сбор всех панелей базы
var cabinetPanels = [];

function getPanelBox(o) {
    if (!o) return null;
    var minX = Infinity, maxX = -Infinity;
    var minY = Infinity, maxY = -Infinity;
    var minZ = Infinity, maxZ = -Infinity;
    var found = false;

    function checkObj(item) {
        if (!item) return;
        var bMin = item.GabMin || item.GMin;
        var bMax = item.GabMax || item.GMax;
        if (bMin && bMax && !isNaN(bMin.x) && !isNaN(bMax.x)) {
            if (bMin.x < minX) minX = bMin.x;
            if (bMax.x > maxX) maxX = bMax.x;
            if (bMin.y < minY) minY = bMin.y;
            if (bMax.y > maxY) maxY = bMax.y;
            if (bMin.z < minZ) minZ = bMin.z;
            if (bMax.z > maxZ) maxZ = bMax.z;
            found = true;
        }
        var count = (typeof item.Count === 'number') ? item.Count : 0;
        if (count > 0) {
            for (var c = 0; c < count; c++) {
                var ch = (item.Objects && typeof item.Objects[c] !== 'undefined') ? item.Objects[c] : item[c];
                checkObj(ch);
            }
        }
    }

    checkObj(o);
    if (!found) return null;
    return {
        minX: minX, maxX: maxX,
        minY: minY, maxY: maxY,
        minZ: minZ, maxZ: maxZ,
        sx: Math.round(maxX - minX),
        sy: Math.round(maxY - minY),
        sz: Math.round(maxZ - minZ)
    };
}

function collectPanels(obj) {
    if (!obj) return;
    
    var isPan = false;
    if (obj.Contour && typeof obj.Contour.Count === 'number' && obj.Contour.Count >= 3) {
        isPan = true;
    } else if (typeof obj.Thickness === 'number' && obj.Thickness > 0) {
        isPan = true;
    }
    
    if (isPan) {
        var box = getPanelBox(obj);
        if (box && box.sx > 50 && box.sz > 50) {
            cabinetPanels.push(box);
        }
    }
    
    var count = (typeof obj.Count === 'number') ? obj.Count : 0;
    if (count > 0) {
        for (var i = 0; i < count; i++) {
            var child = (obj.Objects && typeof obj.Objects[i] !== 'undefined') ? obj.Objects[i] : obj[i];
            if (child) {
                collectPanels(child);
            }
        }
    }
}

collectPanels(baseObj);
if (cabinetPanels.length === 0 && baseObj !== Model) {
    collectPanels(Model);
}

// -----------------------------------------------------------------------------
// 3. Анализ корпуса: боковины, дно, крышка, задняя стенка
// -----------------------------------------------------------------------------
var sides = [];
var horiz = [];
var backs = [];

for (var i = 0; i < cabinetPanels.length; i++) {
    var b = cabinetPanels[i];
    if (!b) continue;

    // Боковины и вертикальные перегородки (толщина по X <= 35 мм, высота и глубина > 100 мм)
    if (b.sx <= 35 && b.sy > 150 && b.sz > 100) {
        sides.push(b);
    }
    // Горизонтальные щиты: дно, крышка, полки (толщина по Y <= 35 мм, ширина >= 180 мм, глубина >= 150 мм)
    else if (b.sy <= 35 && b.sx >= 180 && b.sz >= 150) {
        horiz.push(b);
    }
    // Задняя стенка (толщина по Z <= 25 мм, ширина и высота > 150 мм)
    else if (b.sz <= 25 && b.sx > 150 && b.sy > 150) {
        backs.push(b);
    }
}

sides.sort(function(a, b) { return a.minX - b.minX; });
horiz.sort(function(a, b) { return a.minY - b.minY; });
backs.sort(function(a, b) { return a.minZ - b.minZ; });

var detectedX1, detectedX2, detectedY1, detectedY2, detectedZBack, detectedZFront;
var hasBackWall = (backs.length > 0);

if (sides.length >= 2) {
    detectedX1 = sides[0].maxX;
    detectedX2 = sides[sides.length - 1].minX;
}

// Низ боковин корпуса
var minSidesY = (sides.length > 0) ? sides[0].minY : -Infinity;
var maxSidesY = (sides.length > 0) ? sides[0].maxY : Infinity;
for (var sIdx = 1; sIdx < sides.length; sIdx++) {
    if (sides[sIdx].minY < minSidesY) minSidesY = sides[sIdx].minY;
    if (sides[sIdx].maxY > maxSidesY) maxSidesY = sides[sIdx].maxY;
}

// Фильтруем горизонтальные щиты, чтобы исключить ножки ниже корпуса
var validHoriz = [];
for (var hIdx = 0; hIdx < horiz.length; hIdx++) {
    var hp = horiz[hIdx];
    if (hp.maxY >= minSidesY - 30) {
        validHoriz.push(hp);
    }
}

if (validHoriz.length > 0) {
    // Верхняя пласть дна базы
    detectedY1 = validHoriz[0].maxY;
    if (minSidesY > validHoriz[0].minY && minSidesY <= validHoriz[0].maxY + 5) {
        detectedY1 = validHoriz[0].maxY;
    }
} else if (sides.length > 0) {
    detectedY1 = minSidesY + 16;
}

if (validHoriz.length > 1) {
    var maxHorizY = validHoriz[validHoriz.length - 1].maxY;
    var topPanels = [];
    for (var h = 0; h < validHoriz.length; h++) {
        if (validHoriz[h].maxY >= maxHorizY - 40) {
            topPanels.push(validHoriz[h]);
        }
    }
    detectedY2 = topPanels[0].minY;
    for (var tp = 1; tp < topPanels.length; tp++) {
        if (topPanels[tp].minY < detectedY2) {
            detectedY2 = topPanels[tp].minY;
        }
    }
} else if (sides.length > 0) {
    detectedY2 = maxSidesY;
}

if (sides.length > 0) {
    detectedZFront = Math.max(sides[0].maxZ, sides[sides.length - 1].maxZ);
}

if (hasBackWall) {
    detectedZBack = backs[0].maxZ;
} else if (sides.length > 0) {
    detectedZBack = Math.min(sides[0].minZ, sides[sides.length - 1].minZ);
}

var blockBox = getPanelBox(baseObj);
if ((isNaN(detectedX1) || isNaN(detectedX2) || (detectedX2 - detectedX1) < 50) && blockBox) {
    var defT = 16;
    detectedX1 = blockBox.minX + defT;
    detectedX2 = blockBox.maxX - defT;
    if (isNaN(detectedY1)) detectedY1 = blockBox.minY + defT;
    if (isNaN(detectedY2)) detectedY2 = blockBox.maxY - defT;
    if (isNaN(detectedZFront)) detectedZFront = blockBox.maxZ;
    if (isNaN(detectedZBack)) detectedZBack = blockBox.minZ + 4;
}

if (isNaN(detectedX1) || isNaN(detectedX2) || isNaN(detectedY1) || isNaN(detectedY2) || isNaN(detectedZBack) || isNaN(detectedZFront)) {
    Action.Hint = 'Укажите 2 точки ниши базы по диагонали';
    var pMan1 = GetPoint('Укажите первую точку угла ниши');
    var pMan2 = GetPoint('Укажите противоположную точку угла ниши');
    if (pMan1 && pMan2) {
        detectedX1 = Math.min(pMan1.x, pMan2.x);
        detectedX2 = Math.max(pMan1.x, pMan2.x);
        detectedY1 = Math.min(pMan1.y, pMan2.y);
        detectedY2 = Math.max(pMan1.y, pMan2.y);
        detectedZBack = Math.min(pMan1.z, pMan2.z);
        detectedZFront = Math.max(pMan1.z, pMan2.z);
    }
}

// Защита от пустых значений
if (isNaN(detectedX1)) detectedX1 = 16;
if (isNaN(detectedX2)) detectedX2 = 584;
if (isNaN(detectedY1)) detectedY1 = 116;
if (isNaN(detectedY2)) detectedY2 = 804;
if (isNaN(detectedZBack)) detectedZBack = 4;
if (isNaN(detectedZFront)) detectedZFront = 560;

var initW = Math.round(detectedX2 - detectedX1);
var initH = Math.round(detectedY2 - detectedY1);
var initD = Math.round(detectedZFront - detectedZBack);

if (initW <= 0) initW = 568;
if (initH <= 0) initH = 688;
if (initD <= 0) initD = 556;

// -----------------------------------------------------------------------------
// 4. Панель свойств Action.Properties
// -----------------------------------------------------------------------------
var Prop = Action.Properties;
Prop.Clear();

// [Группа 1: Обнаруженная база]
var grBase = Prop.NewGroup('1. Внутреннее пространство базы');
var pBaseName = grBase.NewString('Корпус', baseObj.Name || 'Базовый модуль');
pBaseName.Enabled = false;
var pW = grBase.NewNumber('Ширина между боковинами W, мм', initW);
var pH = grBase.NewNumber('Высота от дна до верха H, мм', initH);
var pD = grBase.NewNumber('Глубина до задника D, мм', initD);
var pBackInfo = grBase.NewString('Задник корпуса', hasBackWall ? 'Обнаружен (ящики не проходят сквозь него)' : 'Не обнаружен (расчет до края боковин)');
pBackInfo.Enabled = false;

// [Группа 2: Выбор наполнения]
var grType = Prop.NewGroup('2. Что построить');
var pType = grType.NewCombo('Тип наполнения', 'Выдвижные ящики (из фрагмента Ящик Базовый.fr3d)\nПолки (в упор к боковинам)');
pType.ItemIndex = 0;

// [Группа 3: Параметры ящиков]
var grDrawers = Prop.NewGroup('3. Параметры ящиков');
var pDrawerSource = grDrawers.NewCombo('Источник ящиков', 'Фрагмент "Ящик Базовый.fr3d"\nПараметрический ящик (короб + фасад)');
pDrawerSource.ItemIndex = 0;
var pDrawerFileInfo = grDrawers.NewString('Файл фрагмента', hasDrawerFragment ? 'Ящик Базовый.fr3d (Найден)' : 'Не найден (будет параметрический)');
pDrawerFileInfo.Enabled = false;

var pDrawerMode = grDrawers.NewCombo('Расчет высот ящиков', 'Равномерно (по количеству)\nКаждый отдельно (по полям ниже)');
pDrawerMode.ItemIndex = 0;
var pDrawerCount = grDrawers.NewNumber('Количество ящиков', 3);

// Поля для отдельных высот каждого ящика
var grDrawerHeights = grDrawers.NewGroup('Высоты каждого ящика (снизу вверх, мм)');
var pH1 = grDrawerHeights.NewNumber('Ящик 1 (нижний)', 300);
var pH2 = grDrawerHeights.NewNumber('Ящик 2', 200);
var pH3 = grDrawerHeights.NewNumber('Ящик 3', 180);
var pH4 = grDrawerHeights.NewNumber('Ящик 4', 150);
var pH5 = grDrawerHeights.NewNumber('Ящик 5', 150);
var pH6 = grDrawerHeights.NewNumber('Ящик 6', 150);
var pDrawerCustomStr = grDrawerHeights.NewString('Или списком через запятую', '300, 200, 180');

var pDrawerStatus = grDrawers.NewString('Статус высоты', '');
pDrawerStatus.Enabled = false;

var grDrawerGaps = grDrawers.NewGroup('Зазоры и сопряжение с боковиной');
var pDrawerManualOffset = grDrawerGaps.NewNumber('Смещение X (коррекция влево/вправо), мм', 0);
var pDrawerGapBet = grDrawerGaps.NewNumber('Зазор между фасадами, мм', 3);
var pDrawerGapBot = grDrawerGaps.NewNumber('Зазор снизу от дна базы, мм', 2);
var pDrawerGapTop = grDrawerGaps.NewNumber('Зазор сверху до верха/планки, мм', 2);
var pDrawerFacadeIndent = grDrawerGaps.NewNumber('Утопить фасад внутрь ниши, мм', 0);

// [Группа 4: Параметры полок]
var grShelves = Prop.NewGroup('4. Параметры полок');
var pShelfMode = grShelves.NewCombo('Распределение полок', 'Равномерно (по количеству)\nИндивидуально (через запятую)');
pShelfMode.ItemIndex = 0;
var pShelfCount = grShelves.NewNumber('Количество полок (при равном.)', 2);
var pShelfCustom = grShelves.NewString('Просветы снизу (мм через запятую)', '250, 300, 300');
var pShelfFit = grShelves.NewCombo('Посадка в боковины', 'В упор в край (встроенно / жестко)\nСъемная (с зазором 1 мм на сторону)');
pShelfFit.ItemIndex = 0;
var pShelfIndentFront = grShelves.NewNumber('Утопить полку спереди, мм', 20);
var pShelfIndentBack = grShelves.NewNumber('Отступ от задника, мм', 0);

// [Группа 5: Кнопки действий]
var grActions = Prop.NewGroup('5. Завершение');
var btnBuild = grActions.NewButton('ПОСТРОИТЬ В МОДЕЛЬ');
var btnCancel = grActions.NewButton('Отмена');

function parseNumberList(str, defaultVal) {
    if (!str) return [];
    var cleaned = str.replace(/;/g, ',');
    var parts = cleaned.split(',');
    var res = [];
    for (var i = 0; i < parts.length; i++) {
        var s = parts[i].replace(/^\s+|\s+$/g, '');
        if (s.length > 0) {
            var val = parseFloat(s);
            if (!isNaN(val) && val > 0) {
                res.push(val);
            }
        }
    }
    if (res.length === 0 && defaultVal) {
        res.push(defaultVal);
    }
    return res;
}

// -----------------------------------------------------------------------------
// 5. Вспомогательные функции построения панелей
// -----------------------------------------------------------------------------
function safeAddHoriz(x1, z1, x2, z2, y, name) {
    var p = null;
    try {
        p = AddHorizPanel(x1, z1, x2, z2, y);
    } catch(e) {
        try {
            var w = Math.abs(x2 - x1);
            var l = Math.abs(z2 - z1);
            p = AddPanel(w, l);
            if (p) {
                p.RotateX(90);
                p.Position = NewVector(Math.min(x1, x2), y, Math.min(z1, z2));
            }
        } catch(e2) {}
    }
    if (p && name) p.Name = name;
    return p;
}

function safeAddVert(z1, y1, z2, y2, x, name) {
    var p = null;
    try {
        p = AddVertPanel(z1, y1, z2, y2, x);
    } catch(e) {
        try {
            var l = Math.abs(z2 - z1);
            var h = Math.abs(y2 - y1);
            p = AddPanel(l, h);
            if (p) {
                p.RotateY(90);
                p.Position = NewVector(x, Math.min(y1, y1), Math.min(z1, z2));
            }
        } catch(e2) {}
    }
    if (p && name) p.Name = name;
    return p;
}

function safeAddFront(x1, y1, x2, y2, z, name) {
    var p = null;
    try {
        p = AddFrontPanel(x1, y1, x2, y2, z);
    } catch(e) {
        try {
            var w = Math.abs(x2 - x1);
            var h = Math.abs(y2 - y1);
            p = AddPanel(w, h);
            if (p) {
                p.Position = NewVector(Math.min(x1, x2), Math.min(y1, y2), z);
            }
        } catch(e2) {}
    }
    if (p && name) p.Name = name;
    return p;
}

// -----------------------------------------------------------------------------
// 6. Построение выдвижных ящиков
// -----------------------------------------------------------------------------
function buildDrawers(x1, x2, y1, y2, zBack, zFront) {
    var secW = x2 - x1;
    var secH = y2 - y1;
    var secD = zFront - zBack;

    var gapBet = pDrawerGapBet.Value;
    var gapBot = pDrawerGapBot.Value;
    var gapTop = pDrawerGapTop.Value;

    var dCount = Math.max(1, Math.round(pDrawerCount.Value));
    var facadeHeights = [];

    if (pDrawerMode.ItemIndex === 0) {
        var totalGaps = gapBot + gapTop + gapBet * (dCount - 1);
        var availH = secH - totalGaps;
        if (availH < 30) availH = secH;
        var singleH = Math.round((availH / dCount) * 10) / 10;
        for (var i = 0; i < dCount; i++) {
            facadeHeights.push(singleH);
        }
    } else {
        var customList = [pH1.Value, pH2.Value, pH3.Value, pH4.Value, pH5.Value, pH6.Value];
        var strList = parseNumberList(pDrawerCustomStr.Value, 0);
        if (strList.length >= dCount) {
            for (var c = 0; c < dCount; c++) {
                facadeHeights.push(strList[c]);
            }
        } else {
            for (var c = 0; c < dCount; c++) {
                facadeHeights.push(customList[c]);
            }
        }
    }

    var totalUsedH = gapBot + gapTop + gapBet * (facadeHeights.length - 1);
    for (var fhIdx = 0; fhIdx < facadeHeights.length; fhIdx++) {
        totalUsedH += facadeHeights[fhIdx];
    }
    var remainH = Math.round(secH - totalUsedH);
    pDrawerStatus.Value = 'Использовано ' + Math.round(totalUsedH) + ' мм из ' + Math.round(secH) + ' мм (остаток: ' + remainH + ' мм)';

    var availSafeDepth = secD - 15;
    if (availSafeDepth < 200) availSafeDepth = secD;

    var curFacadeY = y1 + gapBot;
    for (var j = 0; j < facadeHeights.length; j++) {
        var fh = facadeHeights[j];
        if (curFacadeY + fh > y2 + 10) break;

        var drawerObj = AddBlock('Ящик ' + (j + 1) + ' (H=' + Math.round(fh) + ')');
        var loadSuccess = false;

        // Загрузка фрагмента 'Ящик Базовый.fr3d'
        if (pDrawerSource.ItemIndex === 0 && hasDrawerFragment) {
            try {
                loadSuccess = drawerObj.Load(drawerFragmentFile);
            } catch(e) {
                loadSuccess = false;
            }
        }

        if (loadSuccess) {
            var dBlock = drawerObj;
            if (drawerObj.Count > 0) {
                var firstChild = (drawerObj.Objects && typeof drawerObj.Objects[0] !== 'undefined') ? drawerObj.Objects[0] : drawerObj[0];
                if (firstChild) dBlock = firstChild;
            }

            var nativeD = 500;
            if (dBlock.GSize && dBlock.GSize.z > 0) {
                nativeD = dBlock.GSize.z;
            } else if (drawerObj.GSize && drawerObj.GSize.z > 0) {
                nativeD = drawerObj.GSize.z;
            }

            // Растягиваем блок ящика СТРОГО ОДИН РАЗ (без повторных рекурсивных вызовов!)
            var targetW = secW;
            var targetH = fh;

            var resizeObj = dBlock.ElasticResize ? dBlock : (drawerObj.ElasticResize ? drawerObj : null);
            if (resizeObj) {
                try {
                    // Растяжение и по ширине targetW, и по высоте targetH (глубина фиксированная)
                    resizeObj.ElasticResize(NewVector(targetW, targetH, nativeD));
                } catch(e1) {
                    try {
                        // Резервный вариант, если высота не имеет плоскости
                        resizeObj.ElasticResize(NewVector(targetW, resizeObj.GSize.y, nativeD));
                    } catch(e2) {}
                }
                resizeObj.Build();
            }
            drawerObj.Build();

            // Поиск фасада внутри ящика для выравнивания по высоте
            var facadeObj = null;
            function searchFacade(parentObj) {
                if (!parentObj) return null;
                var cnt = (typeof parentObj.Count === 'number') ? parentObj.Count : 0;
                for (var f = 0; f < cnt; f++) {
                    var ch = (parentObj.Objects && typeof parentObj.Objects[f] !== 'undefined') ? parentObj.Objects[f] : parentObj[f];
                    if (ch) {
                        if (ch.Name && ch.Name.indexOf('Фасад') !== -1 && ch.GSize && ch.GSize.y > 30) {
                            return ch;
                        }
                        var sub = searchFacade(ch);
                        if (sub) return sub;
                    }
                }
                return null;
            }
            facadeObj = searchFacade(drawerObj);

            // Базовые координаты до смещения
            var bMin = drawerObj.GabMin || dBlock.GabMin;
            var bMax = drawerObj.GabMax || dBlock.GabMax;

            // В исходном фрагменте рамка (габаритная секция) ящика начинается строго в X = 0,
            // а вычитающие цилиндры крепежа выступают влево в отрицательную область X < 0.
            // Поэтому, чтобы совместить РАМКУ (направляющие) встык с боковинами x1 и x2:
            // shiftX должен быть равен x1!
            var shiftX = x1 + pDrawerManualOffset.Value;
            var boxMinY = facadeObj ? facadeObj.GabMin.y : ((bMin && !isNaN(bMin.y)) ? bMin.y : 0);
            var boxMaxZ = (bMax && !isNaN(bMax.z)) ? bMax.z : 0;

            var shiftY = curFacadeY - boxMinY;
            var shiftZ = (zFront - pDrawerFacadeIndent.Value) - boxMaxZ;

            drawerObj.Translate(NewVector(shiftX, shiftY, shiftZ));
            drawerObj.Build();
        } else {
            // Резервное параметрическое построение
            var T = 16;
            var boxD = 450;
            if (availSafeDepth >= 500) boxD = 500;
            else if (availSafeDepth >= 450) boxD = 450;
            else if (availSafeDepth >= 400) boxD = 400;
            else if (availSafeDepth >= 350) boxD = 350;
            else boxD = 300;

            var facX1 = x1 + 2;
            var facX2 = x2 - 2;
            var facY1 = curFacadeY;
            var facY2 = curFacadeY + fh;
            var facZ = zFront - T - pDrawerFacadeIndent.Value;

            safeAddFront(facX1, facY1, facX2, facY2, facZ, 'Фасад ящика ' + (j + 1));

            var boxH = Math.max(60, fh - 50);
            var boxY1 = curFacadeY + 15;
            var boxY2 = boxY1 + boxH;
            var boxZFront = facZ;
            var boxZBack = boxZFront - boxD;

            var leftSideX = x1 + 13;
            var rightSideX = x2 - 13 - T;

            safeAddVert(boxZBack, boxY1, boxZFront, boxY2, leftSideX, 'Боковина ящика левая');
            safeAddVert(boxZBack, boxY1, boxZFront, boxY2, rightSideX, 'Боковина ящика правая');

            var innerBoxX1 = leftSideX + T;
            var innerBoxX2 = rightSideX;

            safeAddFront(innerBoxX1, boxY1, innerBoxX2, boxY2, boxZFront - T, 'Передняя стенка короба');
            safeAddFront(innerBoxX1, boxY1, innerBoxX2, boxY2, boxZBack, 'Задняя стенка короба');
            safeAddHoriz(leftSideX, boxZBack, rightSideX + T, boxZFront, boxY1 - 4, 'Дно ящика (ХДФ)');
        }

        curFacadeY += fh + gapBet;
    }
}

// -----------------------------------------------------------------------------
// 7. Построение полок
// -----------------------------------------------------------------------------
function buildShelves(x1, x2, y1, y2, zBack, zFront) {
    var T = 16;
    var sideGap = (pShelfFit.ItemIndex === 1) ? 1 : 0;
    var shelfX1 = x1 + sideGap;
    var shelfX2 = x2 - sideGap;

    var shelfZBack = zBack + pShelfIndentBack.Value;
    var shelfZFront = zFront - pShelfIndentFront.Value;

    if (shelfZFront <= shelfZBack + 100) {
        shelfZFront = zFront;
        shelfZBack = zBack;
    }

    var secH = y2 - y1;
    var shelfYList = [];

    if (pShelfMode.ItemIndex === 0) {
        var sCount = Math.max(1, Math.round(pShelfCount.Value));
        var step = (secH - sCount * T) / (sCount + 1);
        if (step < 20) step = secH / (sCount + 1);
        var curY = y1 + step;
        for (var i = 0; i < sCount; i++) {
            shelfYList.push(curY);
            curY += step + T;
        }
    } else {
        var customList = parseNumberList(pShelfCustom.Value, 250);
        var curY = y1;
        for (var j = 0; j < customList.length; j++) {
            curY += customList[j];
            if (curY + T > y2 - 30) break;
            shelfYList.push(curY);
            curY += T;
        }
    }

    for (var k = 0; k < shelfYList.length; k++) {
        var sy = shelfYList[k];
        safeAddHoriz(shelfX1, shelfZBack, shelfX2, shelfZFront, sy, 'Полка ' + (k + 1));
    }
}

// -----------------------------------------------------------------------------
// 8. Главная сборка и события формы
// -----------------------------------------------------------------------------
function BuildAll() {
    var curW = pW.Value;
    var curH = pH.Value;
    var curD = pD.Value;

    if (isNaN(curW) || curW <= 50) curW = initW || 568;
    if (isNaN(curH) || curH <= 50) curH = initH || 688;
    if (isNaN(curD) || curD <= 50) curD = initD || 556;

    var curX1 = detectedX1;
    var curX2 = detectedX1 + curW;
    var curY1 = detectedY1;
    var curY2 = detectedY1 + curH;
    var curZBack = detectedZBack;
    var curZFront = detectedZBack + curD;

    BeginBlock('Наполнение базы (' + (pType.ItemIndex === 1 ? 'Полки' : 'Ящики') + ')');

    if (pType.ItemIndex === 0) {
        buildDrawers(curX1, curX2, curY1, curY2, curZBack, curZFront);
    } else {
        buildShelves(curX1, curX2, curY1, curY2, curZBack, curZFront);
    }

    EndBlock();
}

Prop.OnChange = function() {
    DeleteNewObjects();
    BuildAll();
};

btnBuild.OnClick = function() {
    DeleteNewObjects();
    BuildAll();
    Action.Commit();
    Action.Finish();
};

btnCancel.OnClick = function() {
    DeleteNewObjects();
    Action.Cancel();
};

BuildAll();
Action.Hint = 'Настройте наполнение в панели слева и нажмите [ПОСТРОИТЬ В МОДЕЛЬ]';
Action.Continue();
