/**
 * Быстрая расстановка кухонных баз (ряд модулей с единой столешницей и цоколем)
 * Для БАЗИС-Мебельщик (8, 9, 10, 11, 2021-2024)
 * 
 * 1. Интерактивный запрос точки начала ряда (по умолчанию 0, 0, 0).
 * 2. Расстановка модулей слева направо на основе ПРЕДУСТАНОВЛЕННЫХ фрагментов:
 *    - База для полок (база кухни1 для шкафов полок.fr3d) - ножки + корпус + полка + распашные двери.
 *    - База для мойки (база кухни1 для мойки.fr3d) - ножки + корпус + планки мойки + распашные двери.
 *    - База с выдвижными ящиками - корпус (модуль под полки, ящику.fr3d) + ящики.
 *    - База под духовку / печку - корпус + ниша под духовку (600 мм) + полка-перегородка + ящик снизу!
 *    - Модуль под полки / ящики (модуль под полки, ящику.fr3d) - открытый корпус с ножками.
 *    - Модуль Базовый (модуль Базовый.fr3d).
 * 3. ВЫБОР СИСТЕМЫ ВЫДВИЖЕНИЯ (в свойствах каждой базы с ящиками или под духовку):
 *    - 1. Ящик Базовый (Tandem скрытого монтажа из Ящик Базовый.fr3d)
 *    - 2. TANDEMBOX antaro BLUM (оригинальные метабоксы Blum Antaro: царги D, M, N)
 *    - 3. Шариковые направляющие (Boyard телескопы полного выдвижения)
 * 4. Настройка РАЗМЕРОВ:
 *    - Общая глубина каркаса баз D (по умолчанию 560 мм; можно ставить 500, 450, 400, 300 мм и т.д.).
 *    - Индивидуальная глубина для каждой базы (для ступенчатых кухонь с перепадом глубин).
 *    - Общая высота баз H (по умолчанию 820 мм; можно ставить 850, 860, 900 мм под любые ножки).
 *    - Ширина каждой базы отдельно (или общим списком через запятую).
 * 5. Единая столешница:
 *    - Автоматическая глубина под глубину баз со свесом 40 мм (факт выводится в свойствах).
 *    - Стандартная индустриальная толщина 38 мм (постформинг, влагостойкая) или 28 мм.
 *    - Отдельный выбор материала столешницы (NewMaterial / Make).
 *    - Настройка свесов спереди, сзади, слева, справа.
 * 6. Единый цоколь вдоль баз:
 *    - Высота 100 мм (или 120, 150 мм).
 *    - Отступ 70 мм от фасадов (вплотную к опорам/ножкам).
 *    - Отдельный материал цоколя.
 */

// -----------------------------------------------------------------------------
// 1. Поиск путей к предустановленным фрагментам пользователя
// -----------------------------------------------------------------------------
function findFirstExistingFile(paths) {
    for (var i = 0; i < paths.length; i++) {
        if (system.fileExists(paths[i])) {
            return paths[i];
        }
    }
    return paths[0];
}

function getBaseFragmentPath(typeIndex) {
    var candidates = [];
    if (typeIndex === 0) {
        // База для полок / шкафов
        candidates = [
            'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Кухонные модули (эластичные)\\база кухни1 для шкафов полок.fr3d',
            'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\07_КУХОННЫЕ_МОДУЛИ_И_БАЗЫ_ЭЛАСТИЧНЫЕ\\база кухни1 для шкафов полок.fr3d',
            'z:\\Work\\генерация мебели\\Модели\\Кухонные модули\\база кухни1 для шкафов полок.fr3d',
            'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Кухонные модули (эластичные)\\модуль под полки, ящику.fr3d',
            'z:\\Work\\генерация мебели\\Модели\\Кухонные модули\\модуль под полки, ящику.fr3d'
        ];
    } else if (typeIndex === 1) {
        // База для мойки
        candidates = [
            'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Кухонные модули (эластичные)\\база кухни1 для мойки.fr3d',
            'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\07_КУХОННЫЕ_МОДУЛИ_И_БАЗЫ_ЭЛАСТИЧНЫЕ\\база кухни1 для мойки.fr3d',
            'z:\\Work\\генерация мебели\\Модели\\Кухонные модули\\база кухни1 для мойки.fr3d',
            'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Кухонные модули (эластичные)\\модуль Базовый.fr3d',
            'z:\\Work\\генерация мебели\\Модели\\Кухонные модули\\модуль Базовый.fr3d'
        ];
    } else if (typeIndex === 2 || typeIndex === 3) {
        // База под ящики или База под духовку (открытый корпус с ножками)
        candidates = [
            'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Кухонные модули (эластичные)\\модуль под полки, ящику.fr3d',
            'z:\\Work\\генерация мебели\\Модели\\Кухонные модули\\модуль под полки, ящику.fr3d',
            'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Кухонные модули (эластичные)\\база кухни1 для шкафов полок.fr3d',
            'z:\\Work\\генерация мебели\\Модели\\Кухонные модули\\база кухни1 для шкафов полок.fr3d'
        ];
    } else if (typeIndex === 4) {
        // Модуль под полки / ящики
        candidates = [
            'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Кухонные модули (эластичные)\\модуль под полки, ящику.fr3d',
            'z:\\Work\\генерация мебели\\Модели\\Кухонные модули\\модуль под полки, ящику.fr3d'
        ];
    } else if (typeIndex === 5) {
        // Модуль Базовый
        candidates = [
            'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Кухонные модули (эластичные)\\модуль Базовый.fr3d',
            'z:\\Work\\генерация мебели\\Модели\\Кухонные модули\\модуль Базовый.fr3d'
        ];
    }
    return findFirstExistingFile(candidates);
}

var drawerFragmentPath = findFirstExistingFile([
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Ящики\\Ящик Базовый.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Мои ящики\\Ящик Базовый.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\08_ЯЩИКИ_И_ВЫДВИЖНЫЕ_СИСТЕМЫ\\Ящик Базовый.fr3d',
    'z:\\Work\\генерация мебели\\Модели\\Ящики\\Ящик Базовый.fr3d'
]);

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
// 2. Запрос точки начала расстановки (по умолчанию 0, 0, 0)
// -----------------------------------------------------------------------------
var startPoint = NewVector(0, 0, 0);

Action.Hint = 'Укажите точку начала кухонного ряда (Enter или ЛКМ для точки 0, 0, 0)';
try {
    var pInput = GetPoint('Укажите точку начала кухонного ряда (Enter для 0,0,0)');
    if (pInput && !isNaN(pInput.x)) {
        startPoint = NewVector(pInput.x, pInput.y, pInput.z);
    }
} catch(ePt) {
    startPoint = NewVector(0, 0, 0);
}

// -----------------------------------------------------------------------------
// 3. Формирование панели свойств Action.Properties
// -----------------------------------------------------------------------------
var Prop = Action.Properties;
Prop.Clear();

// [Группа 1: Количество и общий состав баз]
var grMain = Prop.NewGroup('1. Состав кухонного ряда');
var pBaseCount = grMain.NewNumber('Количество баз в ряду', 3);
pBaseCount.MinValue = 1;
pBaseCount.MaxValue = 8;
pBaseCount.ValueStep = 1;

var pRowDepth = grMain.NewNumber('Общая глубина каркаса баз D, мм', 560);
pRowDepth.MinValue = 200;
pRowDepth.MaxValue = 1200;
pRowDepth.ValueStep = 10;

var pRowHeight = grMain.NewNumber('Общая высота баз H (с ножками), мм', 820);
pRowHeight.MinValue = 400;
pRowHeight.MaxValue = 1200;
pRowHeight.ValueStep = 5;

var pTotalLengthInfo = grMain.NewString('Общая длина ряда баз', '1800 мм');
pTotalLengthInfo.Enabled = false;

var pCustomWidths = grMain.NewString('Ширины списком (если нужно, через запятую)', '');

var MAX_BASES = 8;
var baseSlots = [];

var baseTypeNames = [
    'База для полок (база кухни1 для шкафов полок)',
    'База для мойки (база кухни1 для мойки)',
    'База с выдвижными ящиками (на выбор Tandembox / Базовый)',
    'База под духовку / печку (духовка 600 мм + ящик снизу)',
    'Модуль под полки / ящики (открытый)',
    'Модуль Базовый'
];

var drawerSystemOptions = [
    'Ящик Базовый (Tandem)',
    'TANDEMBOX antaro BLUM',
    'Шариковые направляющие (Boyard)'
].join('\n');

var baseTypeOptions = baseTypeNames.join('\n');
var defaultWidths = [600, 600, 600, 600, 450, 800, 600, 600];

for (var b = 0; b < MAX_BASES; b++) {
    var bNum = b + 1;
    var grSlot = grMain.NewGroup('База ' + bNum);
    
    var pSlotType = grSlot.NewCombo('Тип базы', baseTypeOptions);
    if (b === 0) pSlotType.ItemIndex = 0;
    else if (b === 1) pSlotType.ItemIndex = 2; // база с ящиками
    else if (b === 2) pSlotType.ItemIndex = 1; // мойка
    else pSlotType.ItemIndex = 0;
    
    var pSlotW = grSlot.NewNumber('Ширина W' + bNum + ', мм', defaultWidths[b]);
    pSlotW.MinValue = 200;
    pSlotW.MaxValue = 1400;

    var pSlotD = grSlot.NewNumber('Глубина D' + bNum + ' (0 = общая ' + 560 + ' мм)', 0);
    pSlotD.MinValue = 0;
    pSlotD.MaxValue = 1200;

    var pSlotDrawerSys = grSlot.NewCombo('Система выдвижения', drawerSystemOptions);
    pSlotDrawerSys.ItemIndex = 0; // по умолчанию Ящик Базовый, можно переключить на TANDEMBOX

    var pSlotDrawers = grSlot.NewCombo('Раскладка ящиков', '3 ящика (1 высокий снизу + 2 равных сверху)\n2 ящика (равные по высоте)\n4 ящика (равные по высоте)');
    pSlotDrawers.ItemIndex = 0;

    var pSlotOvenH = grSlot.NewNumber('Высота ниши духовки, мм', 600);
    pSlotOvenH.MinValue = 350;
    pSlotOvenH.MaxValue = 700;

    var pSlotFile = grSlot.NewString('Файл фрагмента', '');
    pSlotFile.Enabled = false;

    baseSlots.push({
        group: grSlot,
        type: pSlotType,
        width: pSlotW,
        depth: pSlotD,
        drawerSys: pSlotDrawerSys,
        drawers: pSlotDrawers,
        ovenH: pSlotOvenH,
        fileInfo: pSlotFile
    });
}

// [Группа 2: Единая столешница]
var grTop = Prop.NewGroup('2. Единая столешница');
var pTopEnable = grTop.NewBool('Установить столешницу', true);
var pTopThick = grTop.NewNumber('Толщина столешницы, мм', 38);
var pTopMat = grTop.NewMaterial('Материал столешницы');
var pTopDepthInfo = grTop.NewString('Глубина столешницы (факт)', '600 мм');
pTopDepthInfo.Enabled = false;
var pTopOverFront = grTop.NewNumber('Свес спереди (над фасадами), мм', 40);
var pTopOverBack = grTop.NewNumber('Свес сзади (до стены), мм', 0);
var pTopOverLeft = grTop.NewNumber('Свес слева, мм', 0);
var pTopOverRight = grTop.NewNumber('Свес справа, мм', 0);

// [Группа 3: Единый цоколь]
var grPlinth = Prop.NewGroup('3. Единый цоколь вдоль баз');
var pPlinthEnable = grPlinth.NewBool('Установить цоколь', true);
var pPlinthH = grPlinth.NewNumber('Высота цоколя, мм', 100);
var pPlinthIndent = grPlinth.NewNumber('Отступ цоколя от фасадов, мм', 70);
var pPlinthThick = grPlinth.NewNumber('Толщина цоколя, мм', 16);
var pPlinthMat = grPlinth.NewMaterial('Материал цоколя');

// [Группа 4: Кнопки действий]
var grActions = Prop.NewGroup('4. Действия');
var btnBuild = grActions.NewButton('ПОСТРОИТЬ В МОДЕЛЬ');
var btnCancel = grActions.NewButton('Отмена');

// -----------------------------------------------------------------------------
// 4. Вспомогательные функции геометрии и обхода модели
// -----------------------------------------------------------------------------
function parseNumberList(str) {
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
    return res;
}

function safeHoriz(x1, z1, x2, z2, y, name) {
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

function safeVert(z1, y1, z2, y2, x, name) {
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

function safeFront(x1, y1, x2, y2, z, name) {
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

function findFrontPanel(parentObj) {
    var best = null;
    var maxZ = -Infinity;
    function scan(item) {
        if (!item) return;
        var bMin = item.GabMin || item.GMin;
        var bMax = item.GabMax || item.GMax;
        if (bMin && bMax && !isNaN(bMax.z)) {
            var sy = Math.abs(bMax.y - bMin.y);
            var sx = Math.abs(bMax.x - bMin.x);
            if (sx > 100 && sy > 50 && bMax.z > maxZ) {
                maxZ = bMax.z;
                best = item;
            }
        }
        var count = (typeof item.Count === 'number') ? item.Count : 0;
        for (var c = 0; c < count; c++) {
            var ch = (item.Objects && typeof item.Objects[c] !== 'undefined') ? item.Objects[c] : item[c];
            scan(ch);
        }
    }
    scan(parentObj);
    return best;
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

// Построение отдельного ящика по выбранной системе выдвижения
function buildSingleDrawer(sysType, isBottomOrOnly, x1, x2, curFY, fh, secD, carcassFrontZ, drawerIndex) {
    var secW = Math.round(x2 - x1);
    var dObj = AddBlock('Ящик ' + drawerIndex + ' (H=' + Math.round(fh) + ')');

    // ВАРИАНТ 1: TANDEMBOX antaro BLUM
    if (sysType === 1) {
        var subType = isBottomOrOnly ? 'D' : 'M';
        if (fh < 130) subType = 'N'; // ультра-низкий для духовки

        var tbFile = getTandemboxFragment(subType, secD);
        var loaded = false;
        if (tbFile && system.fileExists(tbFile)) {
            try { loaded = dObj.Load(tbFile); } catch(eTB) { loaded = false; }
        }

        if (loaded) {
            var dSub = dObj;
            if (dObj.Count > 0) {
                var firstChild = (dObj.Objects && typeof dObj.Objects[0] !== 'undefined') ? dObj.Objects[0] : dObj[0];
                if (firstChild) dSub = firstChild;
            }

            var rObj = dSub.ElasticResize ? dSub : (dObj.ElasticResize ? dObj : null);
            if (rObj) {
                try { rObj.ElasticResize(NewVector(secW, rObj.GSize ? rObj.GSize.y : 200, rObj.GSize ? rObj.GSize.z : 500)); } catch(eTR) {}
                rObj.Build();
            }
            dObj.Build();

            var dBox = getPanelBox(dObj);
            var minX = dBox ? dBox.minX : 0;
            var minY = dBox ? dBox.minY : 0;
            var maxZ = dBox ? dBox.maxZ : 0;

            var dShiftX = x1 - minX;
            var dShiftY = (curFY + 15) - minY; // дно ящика на 15 мм выше кромки фасада
            var dShiftZ = carcassFrontZ - maxZ;

            dObj.Translate(NewVector(dShiftX, dShiftY, dShiftZ));
            dObj.Build();
        }

        // Строим фасад Tandembox (накладной, толщина 16 мм, с зазорами 2 мм по краям)
        safeFront(x1 - 14, curFY, x2 + 14, curFY + fh, carcassFrontZ + 16, 'Фасад Tandembox (H=' + Math.round(fh) + ')');
        return;
    }

    // ВАРИАНТ 2: Шариковые направляющие (Boyard)
    if (sysType === 2) {
        var T = 16;
        var boxGapSide = 13; // 12.7 мм зазор на направляющие
        var boxX1 = x1 + boxGapSide;
        var boxX2 = x2 - boxGapSide;
        var boxW = boxX2 - boxX1;
        var boxH = Math.min(Math.round(fh * 0.7), 180);
        if (boxH < 60) boxH = 60;
        var boxD = 450;
        if (secD >= 530) boxD = 500;
        else if (secD >= 480) boxD = 450;
        else if (secD >= 430) boxD = 400;
        else if (secD >= 380) boxD = 350;
        else boxD = 300;

        var boxZFront = carcassFrontZ - 2;
        var boxZBack = boxZFront - boxD;
        var boxBotY = curFY + 15;
        var boxTopY = boxBotY + boxH;

        // Короб ящика
        safeHoriz(boxX1, boxZBack, boxX2, boxZFront, boxBotY, 'Дно ящика');
        safeVert(boxZBack, boxBotY + T, boxZFront, boxTopY, boxX1 + T, 'Боковина ящика Лев');
        safeVert(boxZBack, boxBotY + T, boxZFront, boxTopY, boxX2, 'Боковина ящика Прав');
        safeFront(boxX1 + T, boxBotY + T, boxX2 - T, boxTopY, boxZBack + T, 'Задняя стенка ящика');
        safeFront(boxX1 + T, boxBotY + T, boxX2 - T, boxTopY, boxZFront, 'Передняя стенка ящика');

        // Шариковые направляющие Boyard
        var slideFile = getBallBearingSlideFragment(secD);
        if (slideFile && system.fileExists(slideFile)) {
            var slideBlock = AddBlock('Направляющие шариковые L=' + boxD);
            try {
                if (slideBlock.Load(slideFile)) {
                    var sBox = getPanelBox(slideBlock);
                    var sMinX = sBox ? sBox.minX : 0;
                    var sMinY = sBox ? sBox.minY : 0;
                    var sMaxZ = sBox ? sBox.maxZ : 0;
                    slideBlock.Translate(NewVector(x1 - sMinX, (boxBotY + 10) - sMinY, carcassFrontZ - sMaxZ));
                    slideBlock.Build();
                }
            } catch(eSl) {}
        }

        // Фасад
        safeFront(x1 - 14, curFY, x2 + 14, curFY + fh, carcassFrontZ + 16, 'Фасад ящика (H=' + Math.round(fh) + ')');
        return;
    }

    // ВАРИАНТ 0 (по умолчанию): Ящик Базовый (Tandem)
    if (drawerFragmentPath && system.fileExists(drawerFragmentPath)) {
        var dOk = false;
        try { dOk = dObj.Load(drawerFragmentPath); } catch(eDLoad) { dOk = false; }

        if (dOk) {
            var dSub = dObj;
            if (dObj.Count > 0) {
                var firstChild = (dObj.Objects && typeof dObj.Objects[0] !== 'undefined') ? dObj.Objects[0] : dObj[0];
                if (firstChild) dSub = firstChild;
            }

            var nativeD = 500;
            if (dSub.GSize && dSub.GSize.z > 0) nativeD = dSub.GSize.z;
            else if (dObj.GSize && dObj.GSize.z > 0) nativeD = dObj.GSize.z;

            var rObj = dSub.ElasticResize ? dSub : (dObj.ElasticResize ? dObj : null);
            if (!rObj && dObj.Count > 0) {
                for (var k = 0; k < dObj.Count; k++) {
                    var chk = (dObj.Objects && typeof dObj.Objects[k] !== 'undefined') ? dObj.Objects[k] : dObj[k];
                    if (chk && chk.ElasticResize) {
                        rObj = chk;
                        break;
                    }
                }
            }

            if (rObj) {
                try {
                    rObj.ElasticResize(NewVector(secW, fh, nativeD));
                } catch(eDr1) {
                    try {
                        rObj.ElasticResize(NewVector(secW, rObj.GSize ? rObj.GSize.y : 200, nativeD));
                    } catch(eDr2) {}
                }
                rObj.Build();
            }
            dObj.Build();

            var dBox = getPanelBox(dObj);
            var minX = dBox ? dBox.minX : 0;
            var minY = dBox ? dBox.minY : 0;
            var maxZ = dBox ? dBox.maxZ : 0;

            var facadeObj = searchFacade(dObj) || findFrontPanel(dObj);
            var boxMinY = facadeObj ? (facadeObj.GabMin ? facadeObj.GabMin.y : facadeObj.Position.y) : minY;
            var boxMaxZ = (facadeObj && facadeObj.GabMax && !isNaN(facadeObj.GabMax.z)) ? facadeObj.GabMax.z : maxZ;

            var dShiftX = x1 - minX;
            var dShiftY = curFY - boxMinY;
            var dShiftZ = carcassFrontZ - boxMaxZ;

            dObj.Translate(NewVector(dShiftX, dShiftY, dShiftZ));
            dObj.Build();
        }
    }
}

// -----------------------------------------------------------------------------
// 5. Главный алгоритм построения ряда баз из предустановленных фрагментов
// -----------------------------------------------------------------------------
function BuildKitchenRow() {
    var numBases = Math.round(pBaseCount.Value);
    if (numBases < 1) numBases = 1;
    if (numBases > MAX_BASES) numBases = MAX_BASES;

    var commonD = pRowDepth.Value;
    if (isNaN(commonD) || commonD < 200) commonD = 560;

    var commonH = pRowHeight.Value;
    if (isNaN(commonH) || commonH < 400) commonH = 820;

    // Включение/отключение групп баз
    for (var b = 0; b < MAX_BASES; b++) {
        var visible = (b < numBases);
        baseSlots[b].group.Visible = visible;
        if (visible) {
            var bTypeIdx = baseSlots[b].type.ItemIndex;
            var fPath = getBaseFragmentPath(bTypeIdx);
            var fName = fPath ? fPath.split(/[\\\/]/).pop() : 'Не найден';
            baseSlots[b].fileInfo.Value = fName;

            var hasDrawers = (bTypeIdx === 2 || bTypeIdx === 3);
            baseSlots[b].drawerSys.Visible = hasDrawers;
            baseSlots[b].drawers.Visible = (bTypeIdx === 2);
            baseSlots[b].ovenH.Visible = (bTypeIdx === 3);
        }
    }

    var customWidthList = parseNumberList(pCustomWidths.Value);
    var widths = [];
    var depths = [];
    var totalW = 0;

    for (var bIdx = 0; bIdx < numBases; bIdx++) {
        var w = baseSlots[bIdx].width.Value;
        if (customWidthList.length > bIdx && customWidthList[bIdx] >= 150) {
            w = customWidthList[bIdx];
        }
        if (isNaN(w) || w < 150) w = 600;
        widths.push(w);
        totalW += w;

        var dVal = baseSlots[bIdx].depth.Value;
        if (isNaN(dVal) || dVal <= 150) {
            dVal = commonD;
        }
        depths.push(dVal);
    }

    pTotalLengthInfo.Value = Math.round(totalW) + ' мм (' + numBases + ' баз)';

    // Корневой блок всего кухонного гарнитура
    BeginBlock('Кухонный гарнитур (Нижний ряд, L=' + Math.round(totalW) + ', H=' + Math.round(commonH) + ', D=' + Math.round(commonD) + ')');

    var curBaseX = startPoint.x;
    var rowMaxY = startPoint.y + commonH;
    var rowMaxZ = startPoint.z + commonD;

    for (var i = 0; i < numBases; i++) {
        var bWidth = widths[i];
        var bDepth = depths[i];
        var bHeight = commonH;

        var slot = baseSlots[i];
        var bType = slot.type.ItemIndex;
        var fragPath = getBaseFragmentPath(bType);

        var shortName = baseTypeNames[bType] || 'База';
        var baseBlock = AddBlock('База ' + (i + 1) + ' (' + shortName + ', ' + Math.round(bWidth) + 'x' + Math.round(bHeight) + 'x' + Math.round(bDepth) + ')');
        var loadOk = false;

        if (fragPath && system.fileExists(fragPath)) {
            try {
                loadOk = baseBlock.Load(fragPath);
            } catch(eLoad) {
                loadOk = false;
            }
        }

        if (loadOk) {
            // Находим корневой эластичный блок внутри загруженного фрагмента
            var dBlock = baseBlock;
            if (baseBlock.Count > 0) {
                var firstChild = (baseBlock.Objects && typeof baseBlock.Objects[0] !== 'undefined') ? baseBlock.Objects[0] : baseBlock[0];
                if (firstChild) dBlock = firstChild;
            }

            // Однократное растяжение фрагмента на целевую ширину bWidth, высоту bHeight и глубину bDepth
            var resizeObj = dBlock.ElasticResize ? dBlock : (baseBlock.ElasticResize ? baseBlock : null);
            if (resizeObj) {
                try {
                    resizeObj.ElasticResize(NewVector(bWidth, bHeight, bDepth));
                } catch(eR1) {
                    try {
                        resizeObj.ElasticResize(NewVector(bWidth, bHeight, resizeObj.GSize ? resizeObj.GSize.z : bDepth));
                    } catch(eR2) {
                        try {
                            resizeObj.ElasticResize(NewVector(bWidth, resizeObj.GSize.y, resizeObj.GSize.z));
                        } catch(eR3) {}
                    }
                }
                resizeObj.Build();
            }
            baseBlock.Build();

            // Точное определение габаритов и привязка к позиции ряда
            var box = getPanelBox(baseBlock);
            var boxMinX = box ? box.minX : 0;
            var boxMinY = box ? box.minY : 0;
            var boxMinZ = box ? box.minZ : 0;

            var shiftX = curBaseX - boxMinX;
            var shiftY = startPoint.y - boxMinY;
            var shiftZ = startPoint.z - boxMinZ;

            baseBlock.Translate(NewVector(shiftX, shiftY, shiftZ));
            baseBlock.Build();

            if (box) {
                if (box.maxY + shiftY > rowMaxY) rowMaxY = box.maxY + shiftY;
                if (box.maxZ + shiftZ > rowMaxZ) rowMaxZ = box.maxZ + shiftZ;
            }

            // СКАНИРОВАНИЕ ВНУТРЕННЕГО ПРОЕМА НИШИ
            var allPanels = collectPanels(baseBlock, []);
            var sides = [];
            var horiz = [];
            var backs = [];

            for (var pIdx = 0; pIdx < allPanels.length; pIdx++) {
                var pItem = allPanels[pIdx];
                if (pItem.sx <= 35 && pItem.sy > 150 && pItem.sz > 100) {
                    sides.push(pItem);
                } else if (pItem.sy <= 35 && pItem.sx >= 180 && pItem.sz >= 50) {
                    horiz.push(pItem);
                } else if (pItem.sz <= 25 && pItem.sx > 150 && pItem.sy > 150) {
                    backs.push(pItem);
                }
            }

            sides.sort(function(a, b) { return a.minX - b.minX; });
            horiz.sort(function(a, b) { return a.minY - b.minY; });

            var nicheX1 = curBaseX + 16;
            var nicheX2 = curBaseX + bWidth - 16;
            var nicheY1 = startPoint.y + 100 + 16; // верхняя пласть дна
            var nicheY2 = startPoint.y + bHeight - 16; // низ верхних планок
            var carcassFrontZ = startPoint.z + bDepth;
            var carcassBackZ = startPoint.z;

            if (sides.length >= 2) {
                var sLeft = sides[0];
                var sRight = sides[sides.length - 1];
                if (Math.abs(sLeft.minX - curBaseX) <= 60 && Math.abs(sRight.maxX - (curBaseX + bWidth)) <= 60) {
                    nicheX1 = sLeft.maxX;
                    nicheX2 = sRight.minX;
                    carcassFrontZ = Math.max(sLeft.maxZ, sRight.maxZ);
                    carcassBackZ = Math.min(sLeft.minZ, sRight.minZ);
                }
            }

            var minSidesY = (sides.length > 0) ? sides[0].minY : (startPoint.y + 100);
            var validHoriz = [];
            for (var hI = 0; hI < horiz.length; hI++) {
                if (horiz[hI].maxY >= minSidesY - 30) validHoriz.push(horiz[hI]);
            }

            if (validHoriz.length > 0) {
                nicheY1 = validHoriz[0].maxY; // ВЕРХНЯЯ ПЛАСТЬ ДНА
            }
            if (validHoriz.length > 1) {
                var maxHY = validHoriz[validHoriz.length - 1].maxY;
                var topP = [];
                for (var h2 = 0; h2 < validHoriz.length; h2++) {
                    if (validHoriz[h2].maxY >= maxHY - 40) topP.push(validHoriz[h2]);
                }
                if (topP.length > 0) {
                    var minTopY = topP[0].minY;
                    for (var tI = 1; tI < topP.length; tI++) {
                        if (topP[tI].minY < minTopY) minTopY = topP[tI].minY;
                    }
                    nicheY2 = minTopY; // НИЗ ВЕРХНИХ ПЛАНОК
                }
            }

            var secW = Math.round(nicheX2 - nicheX1);
            var secH = Math.round(nicheY2 - nicheY1);
            var secD = Math.round(carcassFrontZ - carcassBackZ);
            if (secW <= 0 || secW > bWidth) secW = bWidth - 32;
            if (secH <= 0 || secH > bHeight) secH = bHeight - 132;
            if (secD <= 0) secD = bDepth - 20;

            var sysType = slot.drawerSys.ItemIndex; // 0=Базовый, 1=TANDEMBOX, 2=Шариковые

            // СЛУЧАЙ А: ТИП 2 - БАЗА С ВЫДВИЖНЫМИ ЯЩИКАМИ (2, 3 или 4 ящика)
            if (bType === 2) {
                var gapBet = 3;
                var gapBot = 2;
                var gapTop = 2;

                var drOpt = slot.drawers.ItemIndex;
                var numD = (drOpt === 1) ? 2 : ((drOpt === 2) ? 4 : 3);

                var availH = secH - (gapBot + gapTop + gapBet * (numD - 1));
                if (availH < 50) availH = secH;

                var dHeights = [];
                if (numD === 3) {
                    var dHBot = Math.round(availH * 0.42);
                    var dHTop = Math.round((availH - dHBot) / 2);
                    dHBot = availH - dHTop * 2;
                    dHeights = [dHBot, dHTop, dHTop];
                } else if (numD === 2) {
                    var dH2 = Math.round(availH / 2);
                    dHeights = [dH2, availH - dH2];
                } else {
                    var dH4 = Math.round(availH / 4);
                    dHeights = [dH4, dH4, dH4, availH - dH4 * 3];
                }

                var curFacadeY = nicheY1 + gapBot;
                for (var d = 0; d < dHeights.length; d++) {
                    var fh = dHeights[d];
                    var isBottom = (d === 0);
                    buildSingleDrawer(sysType, isBottom, nicheX1, nicheX2, curFacadeY, fh, secD, carcassFrontZ, d + 1);
                    curFacadeY += fh + gapBet;
                }
            }

            // СЛУЧАЙ Б: ТИП 3 - БАЗА ПОД ДУХОВКУ / ПЕЧКУ (духовка 600 мм + ящик снизу)
            else if (bType === 3) {
                var ovenH = slot.ovenH.Value;
                if (isNaN(ovenH) || ovenH < 350) ovenH = 600;

                // Полка под духовку (щит ДСП 16 мм, на который опирается духовой шкаф)
                var shelfThick = 16;
                var shelfY = nicheY2 - ovenH - shelfThick;
                if (shelfY < nicheY1 + 60) shelfY = nicheY1 + 60;

                safeHoriz(nicheX1, startPoint.z, nicheX2, carcassFrontZ, shelfY, 'Полка под духовой шкаф (ДСП 16 мм)');

                // Высота оставшегося нижнего отсека под противни
                var bottomNicheH = shelfY - nicheY1;
                var drawerFacadeH = bottomNicheH - 5; // 2 мм снизу, 3 мм сверху до духовки
                if (drawerFacadeH < 60) drawerFacadeH = 60;

                var drawerFY = nicheY1 + 2;
                buildSingleDrawer(sysType, true, nicheX1, nicheX2, drawerFY, drawerFacadeH, secD, carcassFrontZ, 'под духовку');
            }

        } else {
            // Резервный параметрический модуль
            var T = 16;
            var legH = 100;
            var botY = startPoint.y + legH;
            var topY = startPoint.y + bHeight;
            var dZ = startPoint.z + bDepth;
            safeHoriz(curBaseX, startPoint.z, curBaseX + bWidth, dZ, botY, 'Дно базы');
            safeVert(startPoint.z, botY + T, dZ, topY, curBaseX + T, 'Боковина левая');
            safeVert(startPoint.z, botY + T, dZ, topY, curBaseX + bWidth, 'Боковина правая');
            safeHoriz(curBaseX + T, startPoint.z, curBaseX + bWidth - T, startPoint.z + 80, topY, 'Планка задняя');
            safeHoriz(curBaseX + T, dZ - 80, curBaseX + bWidth - T, dZ, topY, 'Планка передняя');
        }

        curBaseX += bWidth;
    }

    // 6. ЕДИНАЯ СТОЛЕШНИЦА (38 мм стандарт постформинг)
    if (pTopEnable.Value) {
        var topThick = pTopThick.Value;
        if (isNaN(topThick) || topThick <= 0) topThick = 38;

        var overFront = pTopOverFront.Value;
        var overBack = pTopOverBack.Value;
        var overL = pTopOverLeft.Value;
        var overR = pTopOverRight.Value;

        var topX1 = startPoint.x - overL;
        var topX2 = startPoint.x + totalW + overR;
        var topZ1 = startPoint.z - overBack;
        var topZ2 = rowMaxZ + overFront;
        var topPosY = rowMaxY;

        var calcTopD = Math.round(topZ2 - topZ1);
        pTopDepthInfo.Value = calcTopD + ' мм (каркас ' + Math.round(rowMaxZ - startPoint.z) + ' + свес ' + Math.round(overFront) + ' мм)';

        try {
            pTopMat.SetActive();
        } catch(eMat) {
            try {
                ActiveMaterial.Make('Столешница ' + Math.round(topThick) + ' мм (постформинг)', topThick);
            } catch(eM2) {}
        }

        var topPanel = safeHoriz(topX1, topZ1, topX2, topZ2, topPosY, 'Столешница единая (L=' + Math.round(topX2 - topX1) + ', D=' + calcTopD + ', T=' + Math.round(topThick) + ')');
        if (topPanel) {
            try { topPanel.Thickness = topThick; } catch(eT) {}
            if (!pTopMat.Value) {
                try { topPanel.MaterialName = 'Столешница ' + Math.round(topThick) + ' мм (постформинг)'; } catch(eM3) {}
            }
        }
    }

    // 7. ЕДИНЫЙ ЦОКОЛЬ ВДОЛЬ БАЗ (с отступом к ножкам 70 мм)
    if (pPlinthEnable.Value) {
        var plinthH = pPlinthH.Value;
        var plinthIndent = pPlinthIndent.Value;
        var plinthT = pPlinthThick.Value;
        if (isNaN(plinthH) || plinthH <= 0) plinthH = 100;
        if (isNaN(plinthIndent)) plinthIndent = 70;
        if (isNaN(plinthT) || plinthT <= 0) plinthT = 16;

        var plinthX1 = startPoint.x;
        var plinthX2 = startPoint.x + totalW;
        var plinthY1 = startPoint.y;
        var plinthY2 = startPoint.y + plinthH;
        var plinthZ = rowMaxZ - plinthIndent;

        try {
            pPlinthMat.SetActive();
        } catch(ePMat) {}

        var plinthPanel = safeFront(plinthX1, plinthY1, plinthX2, plinthY2, plinthZ, 'Единый цоколь кухни (L=' + Math.round(totalW) + ', H=' + Math.round(plinthH) + ')');
        if (plinthPanel) {
            try { plinthPanel.Thickness = plinthT; } catch(ePT) {}
            if (pPlinthMat.Value) {
                try { plinthPanel.MaterialName = pPlinthMat.Value; } catch(ePM) {}
            }
        }
    }

    EndBlock(); // Конец гарнитура
}

// -----------------------------------------------------------------------------
// 6. Подключение обработчиков интерфейса
// -----------------------------------------------------------------------------
Prop.OnChange = function() {
    DeleteNewObjects();
    BuildKitchenRow();
};

btnBuild.OnClick = function() {
    DeleteNewObjects();
    BuildKitchenRow();
    Action.Finish();
};

btnCancel.OnClick = function() {
    DeleteNewObjects();
    Action.Cancel();
};

// Первичное построение при запуске скрипта
BuildKitchenRow();
Action.Continue();
