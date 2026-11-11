/**
 * Быстрая расстановка кухонных баз (ряд модулей)
 * Для БАЗИС-Мебельщик (8, 9, 10, 11, 2021-2024)
 * 
 * 1. Запуск: скрипт запрашивает точку старта (Enter или клик для 0, 0, 0).
 * 2. Расстановка: базы выстраиваются слева направо вдоль оси X встык.
 * 3. Настройка ряда:
 *    - Задание количества баз (от 1 до 8) с динамическим управлением списком.
 *    - Для каждой базы: тип (полки/двери, ящики Tandem, мойка, духовка, открытый каркас) и ширина.
 *    - Общие габариты: высота корпуса (720 мм), ножки (100 мм), глубина (560 мм).
 * 4. Финальные опции:
 *    - Единая столешница сверху (38 мм, свес 40 мм).
 *    - Цельный цоколь вдоль всего ряда баз (утоплен на 45 мм).
 * 5. Интерактивный 3D-предпросмотр на лету (Prop.OnChange).
 * 6. Фиксация в модель по кнопке [ПОСТРОИТЬ В МОДЕЛЬ] (Action.Commit).
 */

// -----------------------------------------------------------------------------
// 1. Поиск библиотеки фурнитуры и фрагментов
// -----------------------------------------------------------------------------
function findFirstExistingFile(paths) {
    for (var i = 0; i < paths.length; i++) {
        if (system.fileExists(paths[i])) {
            return paths[i];
        }
    }
    return '';
}

var legFile = findFirstExistingFile([
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Ножки для кухни под цоколь\\Неопласт\\Ножка под цоколь H.100 с присадкой d.5x12.f3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Ножки_для_кухни_под_цоколь\\Неопласт\\Ножка под цоколь H.100 с присадкой d.5x12.f3d',
    'z:\\Work\\генерация мебели\\Фурнитура\\Ножки для кухни под цоколь\\Неопласт\\Ножка под цоколь H.100 с присадкой d.5x12.f3d'
]);

var drawerFile = findFirstExistingFile([
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Ящики\\Ящик Базовый.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Мои ящики\\Ящик Базовый.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\08_ЯЩИКИ_И_ВЫДВИЖНЫЕ_СИСТЕМЫ\\Ящик Базовый.fr3d',
    'z:\\Work\\генерация мебели\\Модели\\Ящики\\Ящик Базовый.fr3d'
]);

var hingeFile = findFirstExistingFile([
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Петли\\петля_моя.f3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\петля_моя.f3d',
    'z:\\Work\\генерация мебели\\furn\\петля_моя.f3d'
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

// [Группа 1: Общие габариты ряда]
var grGlobal = Prop.NewGroup('1. Общие габариты кухонного ряда');
var pHBody = grGlobal.NewNumber('Высота корпусов баз H, мм', 720);
var pHLegs = grGlobal.NewCombo('Высота ножек / цоколя, мм', '100\n150\n80\n60');
pHLegs.ItemIndex = 0; // 100 мм
var pDepth = grGlobal.NewNumber('Глубина корпусов D, мм', 560);
var pThick = grGlobal.NewNumber('Толщина ЛДСП, мм', 16);
var pBackWall = grGlobal.NewCombo('Задняя стенка (ХДФ 4 мм)', 'В паз (отступ 16 мм)\nНакладная\nБез задней стенки');
pBackWall.ItemIndex = 0;

// [Группа 2: Количество и состав баз]
var grBases = Prop.NewGroup('2. Состав кухонного ряда (базы слева направо)');
var pBaseCount = grBases.NewNumber('Количество баз в ряду', 3);
pBaseCount.MinValue = 1;
pBaseCount.MaxValue = 8;
pBaseCount.ValueStep = 1;

var pTotalLengthInfo = grBases.NewString('Общая длина ряда баз', '1800 мм');
pTotalLengthInfo.Enabled = false;

var pCustomWidths = grBases.NewString('Ширины списком (если нужно, через запятую)', '');

// Слот-группы для 8 баз
var MAX_BASES = 8;
var baseSlots = [];

var baseTypeOptions = 
    'С полками и распашными дверями\n' +
    'С выдвижными ящиками (фрагмент Ящик Базовый)\n' +
    'Под мойку (свободный объем, царги верт.)\n' +
    'Под встроенную духовку (ниша 595мм + ящик)\n' +
    'Открытый каркас (под умное наполнение)';

var defaultWidths = [600, 600, 600, 600, 450, 800, 600, 600];

for (var b = 0; b < MAX_BASES; b++) {
    var bNum = b + 1;
    var grSlot = grBases.NewGroup('База ' + bNum);
    
    var pSlotType = grSlot.NewCombo('Тип базы', baseTypeOptions);
    pSlotType.ItemIndex = 0; // По умолчанию: с полками
    
    var pSlotW = grSlot.NewNumber('Ширина W' + bNum + ', мм', defaultWidths[b]);
    pSlotW.MinValue = 150;
    pSlotW.MaxValue = 1400;
    
    var pSlotDoors = grSlot.NewCombo('Двери / Фасады', 'Авто (1 дверь <=500мм, 2 двери >500мм)\n1 дверь (петли слева)\n1 дверь (петли справа)\n2 двери (распашные)');
    pSlotDoors.ItemIndex = 0;
    
    var pSlotDrawers = grSlot.NewCombo('Конфигурация ящиков', '3 ящика (1 большой + 2 средних)\n2 больших ящика (кастрюльные)\n4 одинаковых ящика');
    pSlotDrawers.ItemIndex = 0;

    baseSlots.push({
        group: grSlot,
        type: pSlotType,
        width: pSlotW,
        doors: pSlotDoors,
        drawers: pSlotDrawers
    });
}

// [Группа 3: Единая столешница]
var grTop = Prop.NewGroup('3. Единая столешница сверху');
var pTopEnable = grTop.NewBool('Установить единую столешницу', true);
var pTopThick = grTop.NewNumber('Толщина столешницы, мм', 38);
var pTopOverFront = grTop.NewNumber('Свес спереди (над фасадами), мм', 40);
var pTopOverLeft = grTop.NewNumber('Свес слева, мм', 0);
var pTopOverRight = grTop.NewNumber('Свес справа, мм', 0);

// [Группа 4: Цельный цоколь]
var grPlinth = Prop.NewGroup('4. Единый цоколь вдоль баз');
var pPlinthEnable = grPlinth.NewBool('Установить цельный цоколь', true);
var pPlinthIndent = grPlinth.NewNumber('Утопить цоколь внутрь, мм', 45);
var pPlinthThick = grPlinth.NewNumber('Толщина цоколя, мм', 16);

// [Группа 5: Кнопки завершения]
var grActions = Prop.NewGroup('5. Завершение');
var btnBuild = grActions.NewButton('ПОСТРОИТЬ В МОДЕЛЬ');
var btnCancel = grActions.NewButton('Отмена');

// -----------------------------------------------------------------------------
// 4. Вспомогательные функции построения
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
                p.Position = NewVector(x, Math.min(y1, y1), Math.min(z1, z2));
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

function searchFacadeInBlock(parentObj) {
    if (!parentObj) return null;
    var cnt = (typeof parentObj.Count === 'number') ? parentObj.Count : 0;
    for (var f = 0; f < cnt; f++) {
        var ch = (parentObj.Objects && typeof parentObj.Objects[f] !== 'undefined') ? parentObj.Objects[f] : parentObj[f];
        if (ch) {
            if (ch.Name && ch.Name.indexOf('Фасад') !== -1 && ch.GSize && ch.GSize.y > 30) {
                return ch;
            }
            var sub = searchFacadeInBlock(ch);
            if (sub) return sub;
        }
    }
    return null;
}

// Монтаж ножек под дно базы
function placeLegsUnderBase(baseX1, baseX2, baseY, depth, legHeight, legObj) {
    var footBlock = BeginBlock('Опоры кухонные (4 шт.)');
    var legOffsetSides = 50;
    var legOffsetFront = 70;
    var legOffsetBack = 60;

    var coords = [
        { x: baseX1 + legOffsetSides, z: legOffsetBack },
        { x: baseX2 - legOffsetSides, z: legOffsetBack },
        { x: baseX1 + legOffsetSides, z: depth - legOffsetFront },
        { x: baseX2 - legOffsetSides, z: depth - legOffsetFront }
    ];

    for (var i = 0; i < coords.length; i++) {
        var c = coords[i];
        if (legObj) {
            try {
                var legCopy = legObj.Copy ? legObj.Copy() : null;
                if (!legCopy && legObj.Objects) {
                    var w = AddBlock('Ножка ' + (i + 1));
                    w.Load(legFile);
                    w.Position = NewVector(c.x, baseY, c.z);
                    w.Build();
                } else if (legCopy) {
                    legCopy.Position = NewVector(c.x, baseY, c.z);
                    legCopy.Build();
                }
            } catch(eLeg) {
                // Резервная параметрическая ножка
                var cyl = AddCylinder(NewVector(c.x, baseY, c.z), 15, legHeight);
                cyl.RotateX(90);
            }
        } else {
            // Параметрическая опора с пяткой
            var pCyl = AddCylinder(NewVector(c.x, baseY, c.z), 15, legHeight);
            pCyl.RotateX(90);
            var flange = AddCylinder(NewVector(c.x, baseY + legHeight - 4, c.z), 35, 4);
            flange.RotateX(90);
        }
    }
    EndBlock();
}

// -----------------------------------------------------------------------------
// 5. Главный алгоритм построения ряда баз
// -----------------------------------------------------------------------------
function BuildKitchenRow() {
    var numBases = Math.min(MAX_BASES, Math.max(1, Math.round(pBaseCount.Value)));
    
    // Обновляем видимость/активность слотов в панели
    for (var s = 0; s < MAX_BASES; s++) {
        var isActive = (s < numBases);
        baseSlots[s].group.Enabled = isActive;
    }

    var hBody = pHBody.Value;
    var legH = parseFloat(pHLegs.Value) || 100;
    var depth = pDepth.Value;
    var T = pThick.Value;
    var backType = pBackWall.ItemIndex;

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

    // Загрузка фурнитуры для клонирования
    var legMaster = null;
    if (legFile && system.fileExists(legFile)) {
        try {
            legMaster = OpenFurniture(legFile);
        } catch(eL) { legMaster = null; }
    }

    var hingeMaster = null;
    if (hingeFile && system.fileExists(hingeFile)) {
        try {
            hingeMaster = OpenFurniture(hingeFile);
        } catch(eH) { hingeMaster = null; }
    }

    // Корневой блок всего кухонного ряда
    BeginBlock('Кухонный гарнитур (Нижний ряд, L=' + Math.round(totalW) + ')');

    var curBaseX = startPoint.x;
    var floorY = startPoint.y;
    var botY = floorY + legH;
    var topY = botY + hBody;
    var startZ = startPoint.z;

    for (var i = 0; i < numBases; i++) {
        var bWidth = widths[i];
        var slot = baseSlots[i];
        var bType = slot.type.ItemIndex;

        var x1 = curBaseX;
        var x2 = curBaseX + bWidth;

        var typeNames = [
            'Полки и двери',
            'Выдвижные ящики',
            'Под мойку',
            'Под духовку',
            'Открытый каркас'
        ];
        var baseTypeName = typeNames[bType] || 'База';

        var baseBlock = BeginBlock('База ' + (i + 1) + ' (' + baseTypeName + ', Ш=' + Math.round(bWidth) + ')');

        // 1. Дно проходное
        var botPanel = safeHoriz(x1, startZ, x2, startZ + depth, botY, 'Дно базы');

        // 2. Боковины на дне
        var leftSide = safeVert(startZ, botY + T, startZ + depth, topY, x1 + T, 'Боковина левая');
        var rightSide = safeVert(startZ, botY + T, startZ + depth, topY, x2, 'Боковина правая');

        // 3. Верхние царги / планки под столешницу (80 мм)
        var plankW = 80;
        if (bType === 2) {
            // База под мойку: передняя планка ВЕРТИКАЛЬНО (под чашу мойки), задняя горизонтально
            safeFront(x1 + T, topY - plankW, x2 - T, topY, startZ + depth - T, 'Планка передняя верт. (под мойку)');
            safeHoriz(x1 + T, startZ, x2 - T, startZ + plankW, topY, 'Планка задняя под столешницу');
        } else if (bType === 3) {
            // База под духовку: верх открыт под варочную панель
            safeHoriz(x1 + T, startZ, x2 - T, startZ + plankW, topY, 'Планка задняя');
        } else {
            // Стандартные базы и ящики: 2 горизонтальные планки 80 мм
            safeHoriz(x1 + T, startZ, x2 - T, startZ + plankW, topY, 'Планка задняя под столешницу');
            safeHoriz(x1 + T, startZ + depth - plankW, x2 - T, startZ + depth, topY, 'Планка передняя под столешницу');
        }

        // 4. Задняя стенка (ХДФ 4 мм)
        if (backType !== 2) {
            var backH = (topY - (botY + T));
            var backZ = (backType === 0) ? (startZ + 16) : startZ;
            safeFront(x1 + T, botY + T, x2 - T, topY, backZ, 'Задняя стенка (ХДФ)');
        }

        // 5. Опоры (ножки)
        placeLegsUnderBase(x1, x2, floorY, depth, legH, legMaster);

        // 6. Наполнение в зависимости от типа
        var innerX1 = x1 + T;
        var innerX2 = x2 - T;
        var innerY1 = botY + T;
        var innerY2 = topY;
        var innerZBack = (backType === 0) ? (startZ + 20) : (startZ + 4);
        var innerZFront = startZ + depth;

        if (bType === 0) {
            // ТИП 0: С полками и распашными дверями
            // Съемная полка посередине
            var midY = Math.round((innerY1 + innerY2) / 2);
            safeHoriz(innerX1 + 1, innerZBack, innerX2 - 1, innerZFront - 20, midY, 'Полка съемная');

            // Распашные фасады
            var doorMode = slot.doors.ItemIndex;
            var numDoors = (doorMode === 0) ? ((bWidth <= 500) ? 1 : 2) : ((doorMode === 3) ? 2 : 1);
            var gap = 1.5;
            var doorH = Math.round(hBody - gap * 2);
            var doorY = botY + gap;
            var doorZ = innerZFront;

            if (numDoors === 1) {
                var hingeOnLeft = (doorMode === 2) ? false : true;
                var dPan = safeFront(x1 + gap, doorY, x2 - gap, doorY + doorH, doorZ, 'Фасад распашной');
                // Монтаж петель
                if (hingeMaster) {
                    var post = hingeOnLeft ? leftSide : rightSide;
                    var mountX = hingeOnLeft ? (x1 + T) : (x2 - T);
                    try {
                        hingeMaster.Mount(post, dPan, mountX, doorY + 70, doorZ);
                        hingeMaster.Mount(post, dPan, mountX, doorY + doorH - 70, doorZ);
                    } catch(eM1) {}
                }
            } else {
                var halfW = (bWidth - gap * 2 - 3) / 2;
                var dL = safeFront(x1 + gap, doorY, x1 + gap + halfW, doorY + doorH, doorZ, 'Фасад левый');
                var dR = safeFront(x2 - gap - halfW, doorY, x2 - gap, doorY + doorH, doorZ, 'Фасад правый');
                if (hingeMaster) {
                    try {
                        hingeMaster.Mount(leftSide, dL, x1 + T, doorY + 70, doorZ);
                        hingeMaster.Mount(leftSide, dL, x1 + T, doorY + doorH - 70, doorZ);
                        hingeMaster.Mount(rightSide, dR, x2 - T, doorY + 70, doorZ);
                        hingeMaster.Mount(rightSide, dR, x2 - T, doorY + doorH - 70, doorZ);
                    } catch(eM2) {}
                }
            }

        } else if (bType === 1) {
            // ТИП 1: С выдвижными ящиками (фрагмент Ящик Базовый.fr3d)
            var dConfig = slot.drawers.ItemIndex;
            var dCounts = (dConfig === 1) ? 2 : ((dConfig === 2) ? 4 : 3);
            var availH = hBody;
            var gapBet = 3;
            var gapBot = 2;
            var gapTop = 2;

            var dHeights = [];
            if (dCounts === 3) {
                // 1 большой внизу (320-350 мм) + 2 средних сверху
                var botH = Math.round(availH * 0.42);
                var remH = availH - botH - (gapBot + gapTop + gapBet * 2);
                var topH = Math.round(remH / 2);
                dHeights = [botH, topH, topH];
            } else if (dCounts === 2) {
                var singleH = Math.round((availH - (gapBot + gapTop + gapBet)) / 2);
                dHeights = [singleH, singleH];
            } else {
                var sH = Math.round((availH - (gapBot + gapTop + gapBet * 3)) / 4);
                dHeights = [sH, sH, sH, sH];
            }

            var curFY = botY + gapBot;
            var secW = innerX2 - innerX1;

            for (var d = 0; d < dHeights.length; d++) {
                var fh = dHeights[d];
                var dWrapper = AddBlock('Ящик ' + (d + 1) + ' (H=' + Math.round(fh) + ')');
                var loaded = false;

                if (drawerFile && system.fileExists(drawerFile)) {
                    try {
                        loaded = dWrapper.Load(drawerFile);
                    } catch(eLD) { loaded = false; }
                }

                if (loaded) {
                    var dBlock = dWrapper;
                    if (dWrapper.Count > 0) {
                        var firstChild = (dWrapper.Objects && typeof dWrapper.Objects[0] !== 'undefined') ? dWrapper.Objects[0] : dWrapper[0];
                        if (firstChild) dBlock = firstChild;
                    }
                    var natD = 500;
                    if (dBlock.GSize && dBlock.GSize.z > 0) natD = dBlock.GSize.z;

                    // Однократное растяжение строго на блоке ящика
                    var resizeObj = dBlock.ElasticResize ? dBlock : (dWrapper.ElasticResize ? dWrapper : null);
                    if (resizeObj) {
                        try {
                            resizeObj.ElasticResize(NewVector(secW, fh, natD));
                        } catch(eR) {}
                        resizeObj.Build();
                    }
                    dWrapper.Build();

                    // Поиск фасада внутри ящика для выравнивания
                    var facadeObj = searchFacadeInBlock(dWrapper);

                    // Привязка: X по внутренней пласти левой боковины innerX1 (X=0 рамки ящика)
                    var bMin = dWrapper.GabMin || dBlock.GabMin;
                    var bMax = dWrapper.GabMax || dBlock.GabMax;
                    var shiftX = innerX1;
                    var boxMinY = facadeObj ? facadeObj.GabMin.y : ((bMin && !isNaN(bMin.y)) ? bMin.y : 0);
                    var boxMaxZ = (bMax && !isNaN(bMax.z)) ? bMax.z : 0;

                    var shiftY = curFY - boxMinY;
                    var shiftZ = innerZFront - boxMaxZ;

                    dWrapper.Translate(NewVector(shiftX, shiftY, shiftZ));
                    dWrapper.Build();
                } else {
                    // Резервный параметрический ящик
                    var fac = safeFront(innerX1 + 2, curFY, innerX2 - 2, curFY + fh, innerZFront - T, 'Фасад ящика ' + (d + 1));
                    var boxH = Math.max(60, fh - 40);
                    var boxD = 500;
                    safeVert(innerZFront - T - boxD, curFY + 15, innerZFront - T, curFY + 15 + boxH, innerX1 + 13, 'Боковина короба Л');
                    safeVert(innerZFront - T - boxD, curFY + 15, innerZFront - T, curFY + 15 + boxH, innerX2 - 13, 'Боковина короба П');
                    safeHoriz(innerX1 + 13, innerZFront - T - boxD, innerX2 - 13, innerZFront - T, curFY + 12, 'Дно ящика');
                }

                curFY += fh + gapBet;
            }

        } else if (bType === 2) {
            // ТИП 2: Под мойку
            // Чистый объем под сантехнику, распашные фасады
            var gapM = 1.5;
            var doorHM = Math.round(hBody - gapM * 2);
            var doorYM = botY + gapM;
            var doorZM = innerZFront;
            var halfWM = (bWidth - gapM * 2 - 3) / 2;

            var dLM = safeFront(x1 + gapM, doorYM, x1 + gapM + halfWM, doorYM + doorHM, doorZM, 'Фасад мойки левый');
            var dRM = safeFront(x2 - gapM - halfWM, doorYM, x2 - gapM, doorYM + doorHM, doorZM, 'Фасад мойки правый');
            if (hingeMaster) {
                try {
                    hingeMaster.Mount(leftSide, dLM, x1 + T, doorYM + 70, doorZM);
                    hingeMaster.Mount(leftSide, dLM, x1 + T, doorYM + doorHM - 70, doorZM);
                    hingeMaster.Mount(rightSide, dRM, x2 - T, doorYM + 70, doorZM);
                    hingeMaster.Mount(rightSide, dRM, x2 - T, doorYM + doorHM - 70, doorZM);
                } catch(eMM) {}
            }

        } else if (bType === 3) {
            // ТИП 3: Под встроенную духовку
            // Горизонтальная полка под духовку на высоте 120-140 мм от дна
            var ovenNicheH = 595;
            var bottomShelfY = topY - ovenNicheH;
            if (bottomShelfY < innerY1 + 60) bottomShelfY = innerY1 + 100;

            safeHoriz(innerX1, innerZBack, innerX2, innerZFront - 20, bottomShelfY, 'Полка под духовку');

            // Снизу: откидной фасад или ящик под противни
            var drawerBotH = bottomShelfY - innerY1 - 4;
            if (drawerBotH > 40) {
                safeFront(innerX1 + 2, innerY1 + 2, innerX2 - 2, innerY1 + 2 + drawerBotH, innerZFront, 'Фасад под духовкой (противни)');
            }

        } else if (bType === 4) {
            // ТИП 4: Открытый каркас (под дальнейшее умное наполнение)
            // Чистый каркас, ничего не добавляем — готов к скрипту умного наполнения!
        }

        EndBlock(); // Завершение блока базы

        curBaseX += bWidth;
    }

    // 7. Единая столешница сверху (если включена)
    if (pTopEnable.Value) {
        var topThick = pTopThick.Value;
        var overFront = pTopOverFront.Value;
        var overL = pTopOverLeft.Value;
        var overR = pTopOverRight.Value;

        var topX1 = startPoint.x - overL;
        var topX2 = startPoint.x + totalW + overR;
        var topZ1 = startPoint.z;
        var topZ2 = startPoint.z + depth + overFront;
        var topPosY = topY;

        var topPanel = safeHoriz(topX1, topZ1, topX2, topZ2, topPosY, 'Столешница единая (L=' + Math.round(topX2 - topX1) + ', T=' + Math.round(topThick) + ')');
        if (topPanel) {
            try { topPanel.Thickness = topThick; } catch(eT) {}
        }
    }

    // 8. Цельный цоколь вдоль всех баз (если включен)
    if (pPlinthEnable.Value) {
        var plinthH = legH;
        var plinthIndent = pPlinthIndent.Value;
        var plinthT = pPlinthThick.Value;

        var plinthX1 = startPoint.x;
        var plinthX2 = startPoint.x + totalW;
        var plinthY1 = floorY;
        var plinthY2 = floorY + plinthH;
        var plinthZ = startPoint.z + depth - plinthIndent;

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
Action.Hint = 'Настройте ряд баз в свойствах слева и нажмите [ПОСТРОИТЬ В МОДЕЛЬ]';
Action.Continue();
