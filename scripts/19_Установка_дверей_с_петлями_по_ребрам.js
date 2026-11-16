// ==============================================================================
// 19_Установка_дверей_с_петлями_по_ребрам.js
// Универсальный генератор фасадов (дверей) по указанным крайним ребрам шкафа:
// 1. Интерактивный клик по 4-5 ребрам проема (левое, правое, верхнее, нижнее, фасад)
// 2. Точный отступ фасада со всех сторон: ровно 1.5 мм (настраивается)
// 3. Выбор количества дверей (1 левая / 1 правая / 2 распашные / 3 / 4)
// 4. Установка петель "петля МОЯ" (Blum CLIP top с присадкой)
// 5. Выбор количества петель на створку (2, 3, 4, 5, 6)
// 6. Отступ петель от края фасада: ровно 50 мм (настраивается)
// ==============================================================================

// 1. Поиск фурнитуры "петля МОЯ.f3d"
function findFirstFile(paths) {
    for (var i = 0; i < paths.length; i++) {
        try {
            if (system.fileExists(paths[i])) return paths[i];
        } catch(e) {}
    }
    return '';
}

var HINGE_DEFAULT_PATH = findFirstFile([
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Blum петли\\Antarion\\Петли без заглушек и крестообр. планка\\Петля_CLIP top, CLIP без заглушек\\петля МОЯ.f3d',
    'z:\\Work\\генерация мебели\\furn\\петля_моя.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Крепеж\\петля МОЯ.f3d'
]);

var currentHingePath = HINGE_DEFAULT_PATH;
var hingeObj = null;

function loadHinge(path) {
    if (!path) return null;
    try {
        if (system.fileExists(path)) {
            return OpenFurniture(path);
        }
    } catch(eH) {}
    return null;
}

hingeObj = loadHinge(currentHingePath);

// 2. Вспомогательная функция извлечения координаты из ребра (Edge3)
function getEdgeCoord(edge, coordName) {
    if (!edge) return 0;
    var pt = edge.GFirst || edge.First;
    if (!pt) return 0;
    if (coordName === 'x') return pt.x;
    if (coordName === 'y') return pt.y;
    if (coordName === 'z') return pt.z;
    return 0;
}

// 3. Запрос указания крайних ребер шкафа в 3D
var eLeft = null, eRight = null, eTop = null, eBottom = null, eFront = null;

try {
    Action.Hint = 'Укажите ЛЕВОЕ крайнее ребро шкафа/секции';
    eLeft = GetEdge('1/5: Укажите ЛЕВОЕ крайнее ребро шкафа (AxisY)', AxisY);
} catch(eL) {}

if (!eLeft) {
    Action.Finish();
}

try {
    Action.Hint = 'Укажите ПРАВОЕ крайнее ребро шкафа/секции';
    eRight = GetEdge('2/5: Укажите ПРАВОЕ крайнее ребро шкафа (AxisY)', AxisY);
} catch(eR) {}

if (!eRight) {
    Action.Finish();
}

try {
    Action.Hint = 'Укажите ВЕРХНЕЕ крайнее ребро шкафа/секции';
    eTop = GetEdge('3/5: Укажите ВЕРХНЕЕ крайнее ребро шкафа (AxisX)', AxisX);
} catch(eT) {}

if (!eTop) {
    Action.Finish();
}

try {
    Action.Hint = 'Укажите НИЖНЕЕ крайнее ребро шкафа/секции';
    eBottom = GetEdge('4/5: Укажите НИЖНЕЕ крайнее ребро шкафа (AxisX)', AxisX);
} catch(eB) {}

if (!eBottom) {
    Action.Finish();
}

try {
    Action.Hint = 'Укажите ПЕРЕДНЕЕ ребро (лицевую плоскость корпуса) или Enter для авто';
    eFront = GetEdge('5/5: Укажите ПЕРЕДНЕЕ ребро (лицевую грань корпуса)', AxisY);
} catch(eF) {
    eFront = null;
}

// Извлечение координат габаритного прямоугольника проема
var rawX1 = getEdgeCoord(eLeft, 'x');
var rawX2 = getEdgeCoord(eRight, 'x');
var rawY1 = getEdgeCoord(eBottom, 'y');
var rawY2 = getEdgeCoord(eTop, 'y');

var xMin = Math.min(rawX1, rawX2);
var xMax = Math.max(rawX1, rawX2);
var yMin = Math.min(rawY1, rawY2);
var yMax = Math.max(rawY1, rawY2);

// Определение лицевой плоскости Z
var zFront = 0;
if (eFront) {
    zFront = getEdgeCoord(eFront, 'z');
} else {
    // Берем максимальный Z из указанных ребер
    var zList = [
        getEdgeCoord(eLeft, 'z'),
        getEdgeCoord(eRight, 'z'),
        getEdgeCoord(eTop, 'z'),
        getEdgeCoord(eBottom, 'z')
    ];
    zFront = Math.max.apply(null, zList);
}

var openingW = xMax - xMin;
var openingH = yMax - yMin;

// 4. Поиск прилегающих боковин/стоек в сцене для присадки петель
var postLeft = null;
var postRight = null;

function scanPosts(container) {
    if (!container) return;
    for (var i = 0; i < container.Count; i++) {
        var obj = container.Objects[i];
        if (obj.AsPanel) {
            var n = (obj.Name || '').toLowerCase();
            var thX = obj.GabMax.x - obj.GabMin.x;
            var htY = obj.GabMax.y - obj.GabMin.y;
            var dpZ = obj.GabMax.z - obj.GabMin.z;

            // Вертикальная стойка: толщина <= 35, высота > 200, глубина > 150
            if (thX <= 35 && htY > 200 && dpZ > 150 && n.indexOf('фасад') === -1 && n.indexOf('дверь') === -1) {
                // Левая стойка: внешняя или внутренняя пласть совпадает с xMin (+-10 мм)
                if (Math.abs(obj.GabMin.x - xMin) < 15 || Math.abs(obj.GabMax.x - xMin) < 15) {
                    postLeft = obj;
                }
                // Правая стойка: внешняя или внутренняя пласть совпадает с xMax (+-10 мм)
                if (Math.abs(obj.GabMax.x - xMax) < 15 || Math.abs(obj.GabMin.x - xMax) < 15) {
                    postRight = obj;
                }
            }
        }
        if (obj.Count && obj.Count > 0) scanPosts(obj);
    }
}

try {
    scanPosts(Model);
} catch(eScan) {}

// Авто-определение количества петель по высоте проема
function suggestHingeCount(h) {
    if (h < 900) return 2;
    if (h < 1500) return 3;
    if (h < 2100) return 4;
    return 5; // Для высоких шкафов 2100..2700 мм
}

// 5. Панель свойств Action.Properties
var Prop = null;
try {
    Prop = Action.Properties;
    Prop.Clear();
} catch(ePr) {}

var pDoorsMode = null;
var pDoorGap = null;
var pMidGap = null;
var pDoorThick = null;

var pInstallHinges = null;
var pHingeCount = null;
var pHingeOffset = null;
var pBtnHinge = null;

if (Prop) {
    var grDoors = Prop.NewGroup('1. Конфигурация дверей (фасадов)');
    
    // Предлагаем 2 двери по умолчанию, если ширина > 600 мм
    var defaultModeIdx = (openingW > 600) ? 0 : 1;
    pDoorsMode = grDoors.NewCombo('Тип дверей',
        '2 двери (распашные: левая + правая)\n' +
        '1 дверь (распашная, петли слева)\n' +
        '1 дверь (распашная, петли справа)\n' +
        '3 двери (распашные)\n' +
        '4 двери (распашные)'
    );
    pDoorsMode.ItemIndex = defaultModeIdx;

    pDoorGap = grDoors.NewNumber('Отступ от краев (зазор), мм', 1.5);
    pDoorGap.MinValue = 0;
    pDoorGap.MaxValue = 10;

    pMidGap = grDoors.NewNumber('Зазор между створками, мм', 2.0);
    pMidGap.MinValue = 0;
    pMidGap.MaxValue = 10;

    pDoorThick = grDoors.NewNumber('Толщина фасада, мм', 16);
    pDoorThick.MinValue = 10;
    pDoorThick.MaxValue = 30;

    var grHinges = Prop.NewGroup('2. Петли (фурнитура)');

    pInstallHinges = grHinges.NewBool('Устанавливать петли', (hingeObj !== null));

    var defaultHingeCount = suggestHingeCount(openingH);
    pHingeCount = grHinges.NewNumber('Количество петель на створку', defaultHingeCount);
    pHingeCount.MinValue = 2;
    pHingeCount.MaxValue = 7;

    pHingeOffset = grHinges.NewNumber('Отступ петли от края фасада, мм', 50.0);
    pHingeOffset.MinValue = 30;
    pHingeOffset.MaxValue = 200;

    pBtnHinge = grHinges.NewButton('Выбрать файл петли (.f3d)...');
    pBtnHinge.OnClick = function() {
        try {
            var newPath = system.askFileName('f3d;fr3d');
            if (newPath) {
                currentHingePath = newPath;
                hingeObj = loadHinge(currentHingePath);
                pInstallHinges.Value = (hingeObj !== null);
                buildDoors();
            }
        } catch(eFile) {}
    };
}

// 6. Основная функция построения дверей и расстановки петель
function buildDoors() {
    DeleteNewObjects();

    var mode = pDoorsMode ? pDoorsMode.ItemIndex : ((openingW > 600) ? 0 : 1);
    var gap = pDoorGap ? pDoorGap.Value : 1.5;
    var midGap = pMidGap ? pMidGap.Value : 2.0;
    var thick = pDoorThick ? pDoorThick.Value : 16;
    var doHinges = pInstallHinges ? pInstallHinges.Value : (hingeObj !== null);
    var hCount = pHingeCount ? Math.round(pHingeCount.Value) : suggestHingeCount(openingH);
    var hOffset = pHingeOffset ? pHingeOffset.Value : 50.0;

    BeginBlock('Фасады с петлями');

    ActiveMaterial.Make('ЛДСП ' + thick + ' мм', thick);

    // Вертикальные границы фасада с отступом 1.5 мм сверху и снизу
    var doorY1 = yMin + gap;
    var doorY2 = yMax - gap;
    var doorH = doorY2 - doorY1;

    // Горизонтальные границы
    var spanX1 = xMin + gap;
    var spanX2 = xMax - gap;
    var totalSpanW = spanX2 - spanX1;

    var doorConfigs = [];

    if (mode === 0) {
        // 2 двери распашные (левая + правая)
        var wSingle = (totalSpanW - midGap) / 2;
        doorConfigs.push({
            name: 'Фасад левый',
            x1: spanX1,
            x2: spanX1 + wSingle,
            hingeSide: 'left',
            post: postLeft,
            mountX: xMin
        });
        doorConfigs.push({
            name: 'Фасад правый',
            x1: spanX2 - wSingle,
            x2: spanX2,
            hingeSide: 'right',
            post: postRight,
            mountX: xMax
        });
    } else if (mode === 1) {
        // 1 дверь (петли слева)
        doorConfigs.push({
            name: 'Фасад (петли слева)',
            x1: spanX1,
            x2: spanX2,
            hingeSide: 'left',
            post: postLeft,
            mountX: xMin
        });
    } else if (mode === 2) {
        // 1 дверь (петли справа)
        doorConfigs.push({
            name: 'Фасад (петли справа)',
            x1: spanX1,
            x2: spanX2,
            hingeSide: 'right',
            post: postRight,
            mountX: xMax
        });
    } else if (mode === 3) {
        // 3 двери распашные
        var w3 = (totalSpanW - 2 * midGap) / 3;
        doorConfigs.push({ name: 'Фасад 1 (левый)', x1: spanX1, x2: spanX1 + w3, hingeSide: 'left', post: postLeft, mountX: xMin });
        doorConfigs.push({ name: 'Фасад 2 (средний)', x1: spanX1 + w3 + midGap, x2: spanX1 + 2 * w3 + midGap, hingeSide: 'left', post: null, mountX: spanX1 + w3 + midGap });
        doorConfigs.push({ name: 'Фасад 3 (правый)', x1: spanX2 - w3, x2: spanX2, hingeSide: 'right', post: postRight, mountX: xMax });
    } else if (mode === 4) {
        // 4 двери распашные
        var w4 = (totalSpanW - 3 * midGap) / 4;
        doorConfigs.push({ name: 'Фасад 1', x1: spanX1, x2: spanX1 + w4, hingeSide: 'left', post: postLeft, mountX: xMin });
        doorConfigs.push({ name: 'Фасад 2', x1: spanX1 + (w4 + midGap), x2: spanX1 + (w4 + midGap) + w4, hingeSide: 'right', post: null, mountX: spanX1 + (w4 + midGap) + w4 });
        doorConfigs.push({ name: 'Фасад 3', x1: spanX2 - 2 * w4 - midGap, x2: spanX2 - w4 - midGap, hingeSide: 'left', post: null, mountX: spanX2 - 2 * w4 - midGap });
        doorConfigs.push({ name: 'Фасад 4', x1: spanX2 - w4, x2: spanX2, hingeSide: 'right', post: postRight, mountX: xMax });
    }

    var totalHingesCount = 0;

    // Создание панелей дверей и монтаж петель
    for (var d = 0; d < doorConfigs.length; d++) {
        var cfg = doorConfigs[d];
        var panel = AddFrontPanel(cfg.x1, doorY1, cfg.x2, doorY2, zFront);
        panel.Name = cfg.name;
        panel.Thickness = thick;

        try {
            panel.AddButt(null, 0);
            panel.AddButt(null, 1);
            panel.AddButt(null, 2);
            panel.AddButt(null, 3);
        } catch(eButt) {}
        panel.Build();

        // Монтаж петель с отступом 50 мм от нижнего и верхнего края
        if (doHinges && hingeObj && hCount >= 2) {
            var yHingeBot = doorY1 + hOffset;
            var yHingeTop = doorY2 - hOffset;
            if (yHingeTop <= yHingeBot) yHingeTop = yHingeBot + 100;

            var stepY = (yHingeTop - yHingeBot) / (hCount - 1);
            var mX = (cfg.hingeSide === 'left') ? cfg.x1 : cfg.x2;

            for (var k = 0; k < hCount; k++) {
                var yPos = yHingeBot + k * stepY;
                try {
                    // Если стойка найдена в сцене — крепим к стойке и фасаду, иначе к фасаду
                    var targetPost = cfg.post || panel;
                    hingeObj.Mount(targetPost, panel, mX, yPos, zFront);
                    totalHingesCount++;
                } catch(eMnt) {}
            }
        }
    }

    EndBlock();

    try {
        Action.Commit();
    } catch(eC) {}

    try {
        ViewAll();
        SetCamera(p3dIsometric);
    } catch(eV) {}

    var hingeStatus = doHinges ? ('Установлено петель: ' + totalHingesCount + ' (модель: МОЯ, отступ: ' + hOffset + ' мм)') : 'Без петель';
    Action.Hint = 'Создано фасадов: ' + doorConfigs.length + ' (отступ: ' + gap + ' мм) | ' + hingeStatus;
}

// Первоначальное построение
buildDoors();

// Обработка изменений в панели свойств
if (Prop) {
    Prop.OnChange = function() {
        buildDoors();
    };
}
