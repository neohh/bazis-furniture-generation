/**
 * Быстрая расстановка кухонных баз (ряд модулей из предустановленных фрагментов)
 * Для БАЗИС-Мебельщик (8, 9, 10, 11, 2021-2024)
 * 
 * ИСПОЛЬЗУЕТ ГОТОВЫЕ ПРЕДУСТАНОВЛЕННЫЕ ЭЛАСТИЧНЫЕ БАЗЫ ПОЛЬЗОВАТЕЛЯ:
 * 1. "база кухни1 для шкафов полок.fr3d" (каркас + ножки + полка + распашные двери с петлями)
 * 2. "база кухни1 для мойки.fr3d" (каркас + ножки + царги под мойку + распашные двери)
 * 3. "модуль под полки, ящику.fr3d" (открытый модуль под наполнение / ящики)
 * 4. "модуль Базовый.fr3d"
 * 5. Встраивание "Ящик Базовый.fr3d" (выдвижные ящики скрытого монтажа Tandem)
 * 
 * ПЛЮС:
 * - Единая столешница сверху (38 мм, свес 40 мм).
 * - Цельный цоколь вдоль всех баз (100 мм, утоплен на 45 мм).
 * - Живой интерактивный предпросмотр (Prop.OnChange).
 * - Фиксация в модель по кнопке [ПОСТРОИТЬ В МОДЕЛЬ] (Action.Commit).
 */

// -----------------------------------------------------------------------------
// 1. Поиск путей к предустановленным фрагментам
// -----------------------------------------------------------------------------
function findFirstExistingFile(paths) {
    for (var i = 0; i < paths.length; i++) {
        if (system.fileExists(paths[i])) {
            return paths[i];
        }
    }
    return '';
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
    } else if (typeIndex === 2) {
        // База под ящики (открытый модуль)
        candidates = [
            'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Кухонные модули (эластичные)\\модуль под полки, ящику.fr3d',
            'z:\\Work\\генерация мебели\\Модели\\Кухонные модули\\модуль под полки, ящику.fr3d',
            'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Кухонные модули (эластичные)\\база кухни1 для шкафов полок.fr3d',
            'z:\\Work\\генерация мебели\\Модели\\Кухонные модули\\база кухни1 для шкафов полок.fr3d'
        ];
    } else if (typeIndex === 3) {
        // Модуль под полки / ящики
        candidates = [
            'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Кухонные модули (эластичные)\\модуль под полки, ящику.fr3d',
            'z:\\Work\\генерация мебели\\Модели\\Кухонные модули\\модуль под полки, ящику.fr3d'
        ];
    } else if (typeIndex === 4) {
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

var pTotalLengthInfo = grMain.NewString('Общая длина ряда баз', '1800 мм');
pTotalLengthInfo.Enabled = false;

var pCustomWidths = grMain.NewString('Ширины списком (если нужно, через запятую)', '');

var MAX_BASES = 8;
var baseSlots = [];

var baseTypeNames = [
    'База для полок (база кухни1 для шкафов полок)',
    'База для мойки (база кухни1 для мойки)',
    'База с выдвижными ящиками (Ящик Базовый)',
    'Модуль под полки / ящики (открытый)',
    'Модуль Базовый'
];

var baseTypeOptions = baseTypeNames.join('\n');
var defaultWidths = [600, 600, 600, 600, 450, 800, 600, 600];

for (var b = 0; b < MAX_BASES; b++) {
    var bNum = b + 1;
    var grSlot = grMain.NewGroup('База ' + bNum);
    
    var pSlotType = grSlot.NewCombo('Тип базы', baseTypeOptions);
    // По умолчанию: база 1 = полки (0), база 2 = мойка (1), остальные = полки (0)
    pSlotType.ItemIndex = (b === 1) ? 1 : 0;
    
    var pSlotW = grSlot.NewNumber('Ширина W' + bNum + ', мм', defaultWidths[b]);
    pSlotW.MinValue = 200;
    pSlotW.MaxValue = 1400;

    var pSlotFileInfo = grSlot.NewString('Файл фрагмента', '');
    pSlotFileInfo.Enabled = false;

    baseSlots.push({
        group: grSlot,
        type: pSlotType,
        width: pSlotW,
        fileInfo: pSlotFileInfo
    });
}

// [Группа 2: Единая столешница]
var grTop = Prop.NewGroup('2. Единая столешница сверху');
var pTopEnable = grTop.NewBool('Установить единую столешницу', true);
var pTopThick = grTop.NewNumber('Толщина столешницы, мм', 38);
var pTopOverFront = grTop.NewNumber('Свес спереди (над фасадами), мм', 40);
var pTopOverLeft = grTop.NewNumber('Свес слева, мм', 0);
var pTopOverRight = grTop.NewNumber('Свес справа, мм', 0);

// [Группа 3: Цельный цоколь]
var grPlinth = Prop.NewGroup('3. Единый цоколь вдоль всех баз');
var pPlinthEnable = grPlinth.NewBool('Установить цельный цоколь', true);
var pPlinthH = grPlinth.NewNumber('Высота цоколя, мм', 100);
var pPlinthIndent = grPlinth.NewNumber('Утопить цоколь внутрь, мм', 45);
var pPlinthThick = grPlinth.NewNumber('Толщина цоколя, мм', 16);

// [Группа 4: Кнопки завершения]
var grActions = Prop.NewGroup('4. Завершение');
var btnBuild = grActions.NewButton('ПОСТРОИТЬ В МОДЕЛЬ');
var btnCancel = grActions.NewButton('Отмена');

// -----------------------------------------------------------------------------
// 4. Вспомогательные функции
// -----------------------------------------------------------------------------
function parseList(str) {
    if (!str) return [];
    var parts = str.replace(/;/g, ',').split(',');
    var res = [];
    for (var i = 0; i < parts.length; i++) {
        var s = parts[i].replace(/^\s+|\s+$/g, '');
        if (s.length > 0) {
            var val = parseFloat(s);
            if (!isNaN(val) && val >= 100) res.push(val);
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

// -----------------------------------------------------------------------------
// 5. Главный алгоритм построения ряда баз из предустановленных фрагментов
// -----------------------------------------------------------------------------
function BuildKitchenRow() {
    var numBases = Math.min(MAX_BASES, Math.max(1, Math.round(pBaseCount.Value)));
    
    // Обновляем видимость групп слотов в панели
    for (var s = 0; s < MAX_BASES; s++) {
        var isActive = (s < numBases);
        baseSlots[s].group.Enabled = isActive;
        if (isActive) {
            var fPath = getBaseFragmentPath(baseSlots[s].type.ItemIndex);
            var fName = fPath ? fPath.substring(fPath.lastIndexOf('\\') + 1) : 'Не найден';
            baseSlots[s].fileInfo.Value = fName;
        }
    }

    var customWidthList = parseList(pCustomWidths.Value);

    // Сбор ширин баз
    var widths = [];
    var totalW = 0;
    for (var bIdx = 0; bIdx < numBases; bIdx++) {
        var w = baseSlots[bIdx].width.Value;
        if (customWidthList.length > bIdx) {
            w = customWidthList[bIdx];
        }
        if (isNaN(w) || w < 150) w = 600;
        widths.push(w);
        totalW += w;
    }

    pTotalLengthInfo.Value = Math.round(totalW) + ' мм (' + numBases + ' баз)';

    // Корневой блок всего кухонного гарнитура
    BeginBlock('Кухонный гарнитур (Нижний ряд, L=' + Math.round(totalW) + ')');

    var curBaseX = startPoint.x;
    var rowMaxY = startPoint.y + 820; // стандарт верха баз с ножками
    var rowMaxZ = startPoint.z + 560;

    for (var i = 0; i < numBases; i++) {
        var bWidth = widths[i];
        var slot = baseSlots[i];
        var bType = slot.type.ItemIndex;
        var fragPath = getBaseFragmentPath(bType);

        var shortName = baseTypeNames[bType] || 'База';
        var baseBlock = AddBlock('База ' + (i + 1) + ' (' + shortName + ', Ш=' + Math.round(bWidth) + ')');
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

            // Однократное растяжение на целевую ширину bWidth
            var resizeObj = dBlock.ElasticResize ? dBlock : (baseBlock.ElasticResize ? baseBlock : null);
            if (resizeObj) {
                var curSize = resizeObj.GSize;
                var natH = (curSize && curSize.y > 0) ? curSize.y : 820;
                var natD = (curSize && curSize.z > 0) ? curSize.z : 560;
                try {
                    resizeObj.ElasticResize(NewVector(bWidth, natH, natD));
                } catch(eR1) {
                    try {
                        resizeObj.ElasticResize(NewVector(bWidth, resizeObj.GSize.y, resizeObj.GSize.z));
                    } catch(eR2) {}
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

            // Если выбран тип 2: "База с выдвижными ящиками", встраиваем ящики Tandem
            if (bType === 2 && drawerFragmentPath && system.fileExists(drawerFragmentPath)) {
                // Сканируем внутренний световой проем ниши базы
                var innerBox = getPanelBox(baseBlock);
                if (innerBox) {
                    var secW = bWidth - 32; // за вычетом двух боковин по 16 мм
                    var secH = 704;        // рабочая высота проема
                    var numD = 3;          // 3 ящика
                    var gapBet = 3;
                    var gapBot = 2;
                    var gapTop = 2;
                    var dHBot = Math.round(secH * 0.42);
                    var dHTop = Math.round((secH - dHBot - (gapBot + gapTop + gapBet * 2)) / 2);
                    var dHeights = [dHBot, dHTop, dHTop];

                    var curFY = startPoint.y + 100 + 16 + gapBot;
                    var drawerX1 = curBaseX + 16;
                    var drawerZFront = startPoint.z + (innerBox.sz || 560);

                    for (var d = 0; d < dHeights.length; d++) {
                        var fh = dHeights[d];
                        var dObj = AddBlock('Ящик ' + (d + 1) + ' (H=' + fh + ')');
                        var dOk = false;
                        try {
                            dOk = dObj.Load(drawerFragmentPath);
                        } catch(eDLoad) { dOk = false; }

                        if (dOk) {
                            var dSub = dObj;
                            if (dObj.Count > 0) {
                                var fChild = (dObj.Objects && typeof dObj.Objects[0] !== 'undefined') ? dObj.Objects[0] : dObj[0];
                                if (fChild) dSub = fChild;
                            }
                            var rObj = dSub.ElasticResize ? dSub : (dObj.ElasticResize ? dObj : null);
                            if (rObj) {
                                try {
                                    rObj.ElasticResize(NewVector(secW, fh, rObj.GSize ? rObj.GSize.z : 500));
                                } catch(eDr) {}
                                rObj.Build();
                            }
                            dObj.Build();

                            var dBox = getPanelBox(dObj);
                            var dMinX = dBox ? dBox.minX : 0;
                            var dMinY = dBox ? dBox.minY : 0;
                            var dMaxZ = dBox ? dBox.maxZ : 0;

                            // Стыкуем направляющие по X=0 к левой боковине drawerX1
                            var dShiftX = drawerX1;
                            var dShiftY = curFY - dMinY;
                            var dShiftZ = drawerZFront - dMaxZ;

                            dObj.Translate(NewVector(dShiftX, dShiftY, dShiftZ));
                            dObj.Build();
                        }
                        curFY += fh + gapBet;
                    }
                }
            }

        } else {
            // Резервный параметрический каркас (только если файл фрагмента физически отсутствует)
            var T = 16;
            var botY = startPoint.y + 100;
            var topY = botY + 720;
            var dZ = startPoint.z + 560;
            safeHoriz(curBaseX, startPoint.z, curBaseX + bWidth, dZ, botY, 'Дно базы');
            safeVert(startPoint.z, botY + T, dZ, topY, curBaseX + T, 'Боковина Л');
            safeVert(startPoint.z, botY + T, dZ, topY, curBaseX + bWidth, 'Боковина П');
            safeHoriz(curBaseX + T, startPoint.z, curBaseX + bWidth - T, startPoint.z + 80, topY, 'Планка задняя');
            safeHoriz(curBaseX + T, dZ - 80, curBaseX + bWidth - T, dZ, topY, 'Планка передняя');
        }

        curBaseX += bWidth;
    }

    // 6. Единая столешница сверху (если включена)
    if (pTopEnable.Value) {
        var topThick = pTopThick.Value;
        var overFront = pTopOverFront.Value;
        var overL = pTopOverLeft.Value;
        var overR = pTopOverRight.Value;

        var topX1 = startPoint.x - overL;
        var topX2 = startPoint.x + totalW + overR;
        var topZ1 = startPoint.z;
        var topZ2 = rowMaxZ + overFront;
        var topPosY = rowMaxY;

        var topPanel = safeHoriz(topX1, topZ1, topX2, topZ2, topPosY, 'Столешница единая (L=' + Math.round(topX2 - topX1) + ', T=' + Math.round(topThick) + ')');
        if (topPanel) {
            try { topPanel.Thickness = topThick; } catch(eT) {}
        }
    }

    // 7. Цельный цоколь вдоль всех баз (если включен)
    if (pPlinthEnable.Value) {
        var plinthH = pPlinthH.Value;
        var plinthIndent = pPlinthIndent.Value;
        var plinthT = pPlinthThick.Value;

        var plinthX1 = startPoint.x;
        var plinthX2 = startPoint.x + totalW;
        var plinthY1 = startPoint.y;
        var plinthY2 = startPoint.y + plinthH;
        var plinthZ = rowMaxZ - plinthIndent;

        safeFront(plinthX1, plinthY1, plinthX2, plinthY2, plinthZ, 'Цоколь единый (L=' + Math.round(totalW) + ', H=' + Math.round(plinthH) + ')');
    }

    EndBlock(); // Завершение корневого блока кухонного гарнитура
}

// -----------------------------------------------------------------------------
// 6. Обработчики событий панели свойств
// -----------------------------------------------------------------------------
Prop.OnChange = function() {
    DeleteNewObjects();
    BuildKitchenRow();
};

btnBuild.OnClick = function() {
    DeleteNewObjects();
    BuildKitchenRow();
    Action.Commit();
    Action.Finish();
};

btnCancel.OnClick = function() {
    DeleteNewObjects();
    Action.Cancel();
};

// Первый старт построения
BuildKitchenRow();
Action.Hint = 'Настройте ряд предустановленных баз в свойствах слева и нажмите [ПОСТРОИТЬ В МОДЕЛЬ]';
Action.Continue();
