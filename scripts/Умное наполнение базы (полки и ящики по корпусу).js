/**
 * Умное наполнение базы (полки, ящики Ящик Базовый / TANDEMBOX antaro / Шариковые, база под духовку/печку)
 * Для БАЗИС-Мебельщик (8, 9, 10, 11, 2021-2024)
 * 
 * 1. Выделяешь шкаф/модуль (или кликаешь по корпусу).
 * 2. Скрипт САМ находит внутренние границы ниши:
 *    - Ширина: строго между внутренними плоскостями боковин.
 *    - Высота: от верхней пласти дна (над ножками!) до низа верхней крышки/планок.
 *    - Глубина: от задника до переднего края боковин.
 * 3. ВЫБОР ЧТО ПОСТРОИТЬ:
 *    - Выдвижные ящики (все пространство ниши)
 *    - Духовка / печка сверху (ниша 600 мм) + ящик снизу под противни
 *    - Полки (в упор к боковинам или со съемным зазором)
 * 4. ВЫБОР СИСТЕМЫ ВЫДВИЖЕНИЯ:
 *    - 1. Ящик Базовый (Tandem скрытого монтажа из Ящик Базовый.fr3d)
 *    - 2. TANDEMBOX antaro BLUM (оригинальные метабоксы Blum Antaro: царги D, M, N)
 *    - 3. Шариковые направляющие (Boyard телескопы)
 *    - 4. Параметрический ящик (короб + фасад)
 */

// -----------------------------------------------------------------------------
// 1. Поиск путей к фрагментам ящиков
// -----------------------------------------------------------------------------
function findFirstExistingFile(paths) {
    for (var i = 0; i < paths.length; i++) {
        if (system.fileExists(paths[i])) {
            return paths[i];
        }
    }
    return paths[0];
}

var drawerFragmentFile = findFirstExistingFile([
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Ящики\\Ящик Базовый.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Мои ящики\\Ящик Базовый.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\08_ЯЩИКИ_И_ВЫДВИЖНЫЕ_СИСТЕМЫ\\Ящик Базовый.fr3d',
    'z:\\Work\\генерация мебели\\Модели\\Ящики\\Ящик Базовый.fr3d'
]);
var hasDrawerFragment = system.fileExists(drawerFragmentFile);

function getTandemboxFragment(subType, depth) {
    var length = 500;
    if (depth >= 580) length = 550;
    else if (depth >= 530) length = 500;
    else if (depth >= 480) length = 450;
    else if (depth >= 430) length = 400;
    else if (depth >= 380) length = 350;
    else if (depth >= 330) length = 300;
    else length = 270;

    var baseDir = 'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Blum петли\\Antarion\\TANDEMBOX\\TANDEMBOX_antaro_BLUMOTION_белый_( 16 мм.)';
    var folderName = 'TANDEMBOX_antaro_' + subType + '_белый_( 16 мм.)';
    var fileName = 'TANDEMBOX_antaro_' + subType + ', L=' + length + ', белый.fr3d';
    var fullPath = baseDir + '\\' + folderName + '\\' + fileName;

    if (system.fileExists(fullPath)) return fullPath;

    var lens = [500, 450, 400, 350, 300, 550, 270];
    for (var i = 0; i < lens.length; i++) {
        var alt = baseDir + '\\' + folderName + '\\TANDEMBOX_antaro_' + subType + ', L=' + lens[i] + ', белый.fr3d';
        if (system.fileExists(alt)) return alt;
    }
    return '';
}

function getBallBearingSlideFragment(depth) {
    var length = 500;
    if (depth >= 530) length = 500;
    else if (depth >= 480) length = 450;
    else if (depth >= 430) length = 400;
    else if (depth >= 380) length = 350;
    else length = 300;

    var path = 'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\направляющие боярд шариковые\\DB4518Zn\\Шариковые направ. DB4518Zn_' + length + '.fr3d';
    if (system.fileExists(path)) return path;
    return '';
}

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
    Action.Hint = 'Кликните на корпус базы (шкафа) для наполнения';
    baseObj = GetObject('Выберите шкаф или секцию для наполнения');
}

if (!baseObj) {
    Action.Cancel();
}

// -----------------------------------------------------------------------------
// 3. Автоматический анализ геометрии ниши базы
// -----------------------------------------------------------------------------
function collectPanels(obj, arr) {
    if (!obj) return arr;
    if (typeof obj.Count === 'number' && obj.Count > 0) {
        for (var i = 0; i < obj.Count; i++) {
            var ch = (obj.Objects && typeof obj.Objects[i] !== 'undefined') ? obj.Objects[i] : obj[i];
            collectPanels(ch, arr);
        }
    }
    var bMin = obj.GabMin || obj.GMin;
    var bMax = obj.GabMax || obj.GMax;
    if (bMin && bMax && !isNaN(bMin.x) && !isNaN(bMax.x)) {
        var sx = Math.round(Math.abs(bMax.x - bMin.x));
        var sy = Math.round(Math.abs(bMax.y - bMin.y));
        var sz = Math.round(Math.abs(bMax.z - bMin.z));
        if (sx > 0 && sy > 0 && sz > 0) {
            arr.push({
                obj: obj,
                minX: Math.min(bMin.x, bMax.x),
                maxX: Math.max(bMin.x, bMax.x),
                minY: Math.min(bMin.y, bMax.y),
                maxY: Math.max(bMin.y, bMax.y),
                minZ: Math.min(bMin.z, bMax.z),
                maxZ: Math.max(bMin.z, bMax.z),
                sx: sx, sy: sy, sz: sz
            });
        }
    }
    return arr;
}

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

var cabinetPanels = collectPanels(baseObj, []);
var sides = [];
var horiz = [];
var backs = [];

for (var i = 0; i < cabinetPanels.length; i++) {
    var b = cabinetPanels[i];
    if (!b) continue;

    if (b.sx <= 35 && b.sy > 150 && b.sz > 100) {
        sides.push(b);
    } else if (b.sy <= 35 && b.sx >= 180 && b.sz >= 150) {
        horiz.push(b);
    } else if (b.sz <= 25 && b.sx > 150 && b.sy > 150) {
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

var minSidesY = (sides.length > 0) ? sides[0].minY : -Infinity;
var maxSidesY = (sides.length > 0) ? sides[0].maxY : Infinity;
for (var sIdx = 1; sIdx < sides.length; sIdx++) {
    if (sides[sIdx].minY < minSidesY) minSidesY = sides[sIdx].minY;
    if (sides[sIdx].maxY > maxSidesY) maxSidesY = sides[sIdx].maxY;
}

var validHoriz = [];
for (var hIdx = 0; hIdx < horiz.length; hIdx++) {
    var hp = horiz[hIdx];
    if (hp.maxY >= minSidesY - 30) {
        validHoriz.push(hp);
    }
}

if (validHoriz.length > 0) {
    detectedY1 = validHoriz[0].maxY; // верхняя пласть дна
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
    if (topPanels.length > 0) {
        var minTopY = topPanels[0].minY;
        for (var tp = 1; tp < topPanels.length; tp++) {
            if (topPanels[tp].minY < minTopY) minTopY = topPanels[tp].minY;
        }
        detectedY2 = minTopY;
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
var pType = grType.NewCombo('Тип наполнения', 'Выдвижные ящики (все пространство ниши)\nДуховка / печка сверху (ниша 600 мм) + ящик снизу\nПолки (в упор к боковинам)');
pType.ItemIndex = 0;

// [Группа 2.1: Параметры для духовки / печки]
var grOven = grType.NewGroup('Параметры ниши под духовку');
var pOvenH = grOven.NewNumber('Высота ниши под духовку, мм', 600);
pOvenH.MinValue = 350;
pOvenH.MaxValue = 700;
var pOvenShelfThick = grOven.NewNumber('Толщина полки под духовку, мм', 16);
var pOvenDrawerHInfo = grOven.NewString('Высота нижнего ящика (факт)', '');
pOvenDrawerHInfo.Enabled = false;

// [Группа 3: Параметры ящиков]
var grDrawers = Prop.NewGroup('3. Параметры ящиков');
var pDrawerSource = grDrawers.NewCombo('Система выдвижения', 'Ящик Базовый (Tandem скрытого монтажа)\nTANDEMBOX antaro BLUM (метабоксы Blum)\nШариковые направляющие (Boyard телескопы)\nПараметрический деревянный ящик');
pDrawerSource.ItemIndex = 0;

var pDrawerFileInfo = grDrawers.NewString('Статус системы', hasDrawerFragment ? 'Ящик Базовый.fr3d (Найден)' : 'Будет параметрический');
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
var pDrawerFacadeIndent = grDrawerGaps.NewNumber('Смещение фасада вперед/назад, мм', 0);

// [Группа 4: Параметры полок]
var grShelves = Prop.NewGroup('4. Параметры полок');
var pShelfMode = grShelves.NewCombo('Распределение полок', 'Равномерно по высоте ниши\nСнизу вверх (по просветам вручную)');
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
            if (!isNaN(val) && val > 0) res.push(val);
        }
    }
    if (res.length === 0 && defaultVal) res.push(defaultVal);
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
                p.Position = NewVector(x, Math.min(y1, y2), Math.min(z1, z2));
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

// -----------------------------------------------------------------------------
// 6. Построение одиночного ящика выбранной системы
// -----------------------------------------------------------------------------
function buildSingleDrawerInstance(sysIndex, isBottom, x1, x2, curFY, fh, secD, zFront, drawerLabel) {
    var secW = x2 - x1;
    var drawerObj = AddBlock('Ящик ' + drawerLabel + ' (H=' + Math.round(fh) + ')');

    // СИСТЕМА 1: TANDEMBOX antaro BLUM
    if (sysIndex === 1) {
        var subType = isBottom ? 'D' : 'M';
        if (fh < 130) subType = 'N'; // низкий под духовку

        var tbFile = getTandemboxFragment(subType, secD);
        var tbOk = false;
        if (tbFile && system.fileExists(tbFile)) {
            try { tbOk = drawerObj.Load(tbFile); } catch(eTLoad) { tbOk = false; }
        }

        if (tbOk) {
            var dSub = drawerObj;
            if (drawerObj.Count > 0) {
                var fChild = (drawerObj.Objects && typeof drawerObj.Objects[0] !== 'undefined') ? drawerObj.Objects[0] : drawerObj[0];
                if (fChild) dSub = fChild;
            }

            var rObj = dSub.ElasticResize ? dSub : (drawerObj.ElasticResize ? drawerObj : null);
            if (rObj) {
                try { rObj.ElasticResize(NewVector(secW, rObj.GSize ? rObj.GSize.y : 200, rObj.GSize ? rObj.GSize.z : 500)); } catch(eTR) {}
                rObj.Build();
            }
            drawerObj.Build();

            var dBox = getPanelBox(drawerObj);
            var minX = dBox ? dBox.minX : 0;
            var minY = dBox ? dBox.minY : 0;
            var maxZ = dBox ? dBox.maxZ : 0;

            var dShiftX = x1 - minX + pDrawerManualOffset.Value;
            var dShiftY = (curFY + 15) - minY;
            var dShiftZ = (zFront - pDrawerFacadeIndent.Value) - maxZ;

            drawerObj.Translate(NewVector(dShiftX, dShiftY, dShiftZ));
            drawerObj.Build();
        }

        // Накладной фасад Tandembox (зазоры 2 мм по краям, толщина 16 мм)
        safeAddFront(x1 - 14, curFY, x2 + 14, curFY + fh, zFront + 16 - pDrawerFacadeIndent.Value, 'Фасад Tandembox (H=' + Math.round(fh) + ')');
        return;
    }

    // СИСТЕМА 2: Шариковые направляющие (Boyard)
    if (sysIndex === 2) {
        var T = 16;
        var boxGapSide = 13;
        var boxX1 = x1 + boxGapSide;
        var boxX2 = x2 - boxGapSide;
        var boxH = Math.min(Math.round(fh * 0.7), 180);
        if (boxH < 60) boxH = 60;
        var boxD = 450;
        if (secD >= 530) boxD = 500;
        else if (secD >= 480) boxD = 450;
        else if (secD >= 430) boxD = 400;
        else if (secD >= 380) boxD = 350;
        else boxD = 300;

        var boxZFront = zFront - 2 - pDrawerFacadeIndent.Value;
        var boxZBack = boxZFront - boxD;
        var boxBotY = curFY + 15;
        var boxTopY = boxBotY + boxH;

        safeAddHoriz(boxX1, boxZBack, boxX2, boxZFront, boxBotY, 'Дно ящика');
        safeAddVert(boxZBack, boxBotY + T, boxZFront, boxTopY, boxX1 + T, 'Боковина ящика Лев');
        safeAddVert(boxZBack, boxBotY + T, boxZFront, boxTopY, boxX2, 'Боковина ящика Прав');
        safeAddFront(boxX1 + T, boxBotY + T, boxX2 - T, boxTopY, boxZBack + T, 'Задняя стенка ящика');
        safeAddFront(boxX1 + T, boxBotY + T, boxX2 - T, boxTopY, boxZFront, 'Передняя стенка ящика');

        var slideFile = getBallBearingSlideFragment(secD);
        if (slideFile && system.fileExists(slideFile)) {
            var slideBlock = AddBlock('Направляющие шариковые L=' + boxD);
            try {
                if (slideBlock.Load(slideFile)) {
                    var sBox = getPanelBox(slideBlock);
                    var sMinX = sBox ? sBox.minX : 0;
                    var sMinY = sBox ? sBox.minY : 0;
                    var sMaxZ = sBox ? sBox.maxZ : 0;
                    slideBlock.Translate(NewVector(x1 - sMinX, (boxBotY + 10) - sMinY, zFront - sMaxZ));
                    slideBlock.Build();
                }
            } catch(eSl) {}
        }

        safeAddFront(x1 - 14, curFY, x2 + 14, curFY + fh, zFront + 16 - pDrawerFacadeIndent.Value, 'Фасад ящика (H=' + Math.round(fh) + ')');
        return;
    }

    // СИСТЕМА 0: Ящик Базовый (Tandem скрытого монтажа)
    if (sysIndex === 0 && hasDrawerFragment) {
        var loadSuccess = false;
        try { loadSuccess = drawerObj.Load(drawerFragmentFile); } catch(e) { loadSuccess = false; }

        if (loadSuccess) {
            var dBlock = drawerObj;
            if (drawerObj.Count > 0) {
                var firstChild = (drawerObj.Objects && typeof drawerObj.Objects[0] !== 'undefined') ? drawerObj.Objects[0] : drawerObj[0];
                if (firstChild) dBlock = firstChild;
            }

            var nativeD = 500;
            if (dBlock.GSize && dBlock.GSize.z > 0) nativeD = dBlock.GSize.z;
            else if (drawerObj.GSize && drawerObj.GSize.z > 0) nativeD = drawerObj.GSize.z;

            var targetW = secW;
            var targetH = fh;

            var resizeObj = dBlock.ElasticResize ? dBlock : (drawerObj.ElasticResize ? drawerObj : null);
            if (resizeObj) {
                try {
                    resizeObj.ElasticResize(NewVector(targetW, targetH, nativeD));
                } catch(e1) {
                    try {
                        resizeObj.ElasticResize(NewVector(targetW, resizeObj.GSize.y, nativeD));
                    } catch(e2) {}
                }
                resizeObj.Build();
            }
            drawerObj.Build();

            var facadeObj = searchFacade(drawerObj);
            var bMin = drawerObj.GabMin || dBlock.GabMin;
            var bMax = drawerObj.GabMax || dBlock.GabMax;

            var shiftX = x1 + pDrawerManualOffset.Value;
            var boxMinY = facadeObj ? facadeObj.GabMin.y : ((bMin && !isNaN(bMin.y)) ? bMin.y : 0);
            var boxMaxZ = (bMax && !isNaN(bMax.z)) ? bMax.z : 0;

            var shiftY = curFY - boxMinY;
            var shiftZ = (zFront - pDrawerFacadeIndent.Value) - boxMaxZ;

            drawerObj.Translate(NewVector(shiftX, shiftY, shiftZ));
            drawerObj.Build();
            return;
        }
    }

    // РЕЗЕРВ: Параметрический деревянный ящик
    var T = 16;
    var boxD = (secD >= 500) ? 450 : 350;
    var facX1 = x1 + 2;
    var facX2 = x2 - 2;
    var facY1 = curFY;
    var facY2 = curFY + fh;
    var facZ = zFront - T - pDrawerFacadeIndent.Value;

    safeAddFront(facX1, facY1, facX2, facY2, facZ, 'Фасад ящика');
    var bX1 = x1 + 13;
    var bX2 = x2 - 13;
    var bY1 = curFY + 15;
    var bY2 = curFY + Math.min(fh - 30, 180);
    var bZFront = facZ - 2;
    var bZBack = bZFront - boxD;

    safeAddHoriz(bX1, bZBack, bX2, bZFront, bY1, 'Дно ящика');
    safeAddVert(bZBack, bY1 + T, bZFront, bY2, bX1 + T, 'Боковина левая');
    safeAddVert(bZBack, bY1 + T, bZFront, bY2, bX2, 'Боковина правая');
    safeAddFront(bX1 + T, bY1 + T, bX2 - T, bY2, bZBack + T, 'Задняя стенка');
    safeAddFront(bX1 + T, bY1 + T, bX2 - T, bY2, bZFront, 'Передняя стенка');
}

// -----------------------------------------------------------------------------
// 7. Построение выдвижных ящиков во всю нишу
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
            for (var c = 0; c < dCount; c++) facadeHeights.push(strList[c]);
        } else {
            for (var c = 0; c < dCount; c++) facadeHeights.push(customList[c]);
        }
    }

    var totalUsedH = gapBot + gapTop + gapBet * (facadeHeights.length - 1);
    for (var fhIdx = 0; fhIdx < facadeHeights.length; fhIdx++) {
        totalUsedH += facadeHeights[fhIdx];
    }
    var remainH = Math.round(secH - totalUsedH);
    pDrawerStatus.Value = 'Использовано ' + Math.round(totalUsedH) + ' мм из ' + Math.round(secH) + ' мм (остаток: ' + remainH + ' мм)';

    var curFacadeY = y1 + gapBot;
    var sysIdx = pDrawerSource.ItemIndex;

    for (var j = 0; j < facadeHeights.length; j++) {
        var fh = facadeHeights[j];
        if (curFacadeY + fh > y2 + 10) break;
        var isBottom = (j === 0);
        buildSingleDrawerInstance(sysIdx, isBottom, x1, x2, curFacadeY, fh, secD, zFront, j + 1);
        curFacadeY += fh + gapBet;
    }
}

// -----------------------------------------------------------------------------
// 8. Построение ниши под духовку + ящик снизу под противни
// -----------------------------------------------------------------------------
function buildOvenAndDrawer(x1, x2, y1, y2, zBack, zFront) {
    var secW = x2 - x1;
    var secH = y2 - y1;
    var secD = zFront - zBack;

    var ovenH = pOvenH.Value;
    if (isNaN(ovenH) || ovenH < 350) ovenH = 600;

    var sThick = pOvenShelfThick.Value;
    if (isNaN(sThick) || sThick <= 0) sThick = 16;

    // Полка-перегородка под духовку
    var shelfY = y2 - ovenH - sThick;
    if (shelfY < y1 + 60) shelfY = y1 + 60;

    safeAddHoriz(x1, zBack, x2, zFront, shelfY, 'Полка под духовой шкаф (ДСП ' + Math.round(sThick) + ' мм)');

    // Нижний отсек под ящик
    var lowerH = shelfY - y1;
    var gapBot = pDrawerGapBot.Value;
    var gapTop = 3; // зазор до духовки
    var drawerFH = lowerH - (gapBot + gapTop);
    if (drawerFH < 50) drawerFH = 50;

    pOvenDrawerHInfo.Value = Math.round(drawerFH) + ' мм (ниша духовки: ' + Math.round(ovenH) + ' мм)';

    var curFY = y1 + gapBot;
    var sysIdx = pDrawerSource.ItemIndex;

    buildSingleDrawerInstance(sysIdx, true, x1, x2, curFY, drawerFH, secD, zFront, 'под духовку');
}

// -----------------------------------------------------------------------------
// 9. Построение полок
// -----------------------------------------------------------------------------
function buildShelves(x1, x2, y1, y2, zBack, zFront) {
    var secW = x2 - x1;
    var secH = y2 - y1;
    var secD = zFront - zBack;

    var sFit = pShelfFit.ItemIndex;
    var sideGap = (sFit === 1) ? 1.5 : 0;
    var shX1 = x1 + sideGap;
    var shX2 = x2 - sideGap;

    var indentFront = pShelfIndentFront.Value;
    var indentBack = pShelfIndentBack.Value;
    var shZFront = zFront - indentFront;
    var shZBack = zBack + indentBack;

    var sCount = Math.max(1, Math.round(pShelfCount.Value));
    var yPositions = [];

    if (pShelfMode.ItemIndex === 0) {
        var step = (secH - 16 * sCount) / (sCount + 1);
        var curY = y1 + step;
        for (var s = 0; s < sCount; s++) {
            yPositions.push(Math.round(curY));
            curY += 16 + step;
        }
    } else {
        var strList = parseNumberList(pShelfCustom.Value, 250);
        var curY = y1;
        for (var s = 0; s < strList.length; s++) {
            curY += strList[s];
            if (curY + 16 > y2 - 20) break;
            yPositions.push(Math.round(curY));
            curY += 16;
        }
    }

    for (var i = 0; i < yPositions.length; i++) {
        var sy = yPositions[i];
        safeAddHoriz(shX1, shZBack, shX2, shZFront, sy, 'Полка ' + (i + 1) + ' (T=16)');
    }
}

// -----------------------------------------------------------------------------
// 10. Главная функция генерации
// -----------------------------------------------------------------------------
function generateContent() {
    var x1 = detectedX1;
    var x2 = detectedX2;
    var y1 = detectedY1;
    var y2 = detectedY2;
    var zBack = detectedZBack;
    var zFront = detectedZFront;

    BeginBlock('Наполнение базы (' + (baseObj.Name || 'Корпус') + ')');

    var typeIdx = pType.ItemIndex;

    // Включение/отключение групп свойств
    grOven.Visible = (typeIdx === 1);
    grDrawers.Visible = (typeIdx === 0 || typeIdx === 1);
    grShelves.Visible = (typeIdx === 2);

    if (typeIdx === 0) {
        buildDrawers(x1, x2, y1, y2, zBack, zFront);
    } else if (typeIdx === 1) {
        buildOvenAndDrawer(x1, x2, y1, y2, zBack, zFront);
    } else if (typeIdx === 2) {
        buildShelves(x1, x2, y1, y2, zBack, zFront);
    }

    EndBlock();
}

Prop.OnChange = function() {
    DeleteNewObjects();
    generateContent();
};

btnBuild.OnClick = function() {
    DeleteNewObjects();
    generateContent();
    Action.Finish();
};

btnCancel.OnClick = function() {
    DeleteNewObjects();
    Action.Cancel();
};

// Первичное построение при запуске
generateContent();
Action.Continue();
