// ==============================================================================
// 19_Установка_дверей_с_петлями_по_ребрам.js
// Универсальный генератор накладных фасадов (дверей) по ребрам шкафа:
// 1. Клик по 4-5 ребрам проема (левое, правое, верхнее, нижнее, фасад).
// 2. Если кликнуто внутреннее ребро боковины — фасад перекрывает боковину
//    до дальнего внешнего края (с отступом 1.5 мм), а петли крепятся к внутренней пласти.
// 3. Интерактивная ПРЕВИЗУАЛИЗАЦИЯ в 3D в реальном времени.
// 4. Панель свойств: выбор количества петель, отступа 50 мм, типа дверей, зазоров.
// 5. Кнопка "Применить" фиксирует превизуализацию в реальную геометрию (Action.Commit).
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
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\петля МОЯ.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Blum петли\\Antarion\\Петли без заглушек и крестообр. планка\\Петля_CLIP top, CLIP без заглушек\\петля МОЯ.f3d',
    'z:\\Work\\генерация мебели\\furn\\петля_моя.f3d'
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

// 2. Вспомогательные функции
function getEdgeCoord(edge, coordName) {
    if (!edge) return 0;
    var pt = edge.GFirst || edge.First;
    if (!pt) return 0;
    if (coordName === 'x') return pt.x;
    if (coordName === 'y') return pt.y;
    if (coordName === 'z') return pt.z;
    return 0;
}

function getEdgeMidPoint(edge) {
    if (!edge) return NewVector(0, 0, 0);
    var p1 = edge.GFirst || edge.First;
    var p2 = edge.GLast || edge.Last;
    if (!p1 && !p2) return NewVector(0, 0, 0);
    if (!p1) return p2;
    if (!p2) return p1;
    return NewVector((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2);
}

// Поиск панели, которой принадлежит ребро
function findPanelAtPoint(pt) {
    if (!pt) return null;
    var exact = null;
    var closest = null;
    var minDist = 30; // в пределах 30 мм

    function scan(container) {
        if (!container) return;
        for (var i = 0; i < container.Count; i++) {
            var obj = container.Objects[i];
            if (obj.AsPanel) {
                var pMin = obj.GabMin;
                var pMax = obj.GabMax;
                if (pt.x >= pMin.x - 3 && pt.x <= pMax.x + 3 &&
                    pt.y >= pMin.y - 3 && pt.y <= pMax.y + 3 &&
                    pt.z >= pMin.z - 3 && pt.z <= pMax.z + 3) {
                    exact = obj;
                    return;
                }
                var dx = Math.max(0, pMin.x - pt.x, pt.x - pMax.x);
                var dy = Math.max(0, pMin.y - pt.y, pt.y - pMax.y);
                var dz = Math.max(0, pMin.z - pt.z, pt.z - pMax.z);
                var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                if (dist < minDist) {
                    minDist = dist;
                    closest = obj;
                }
            }
            if (obj.Count && obj.Count > 0) scan(obj);
            if (exact) return;
        }
    }

    try {
        scan(Model);
    } catch(eSc) {}
    return exact || closest;
}

// 3. Запрос указания ребер проема
var eLeft = null, eRight = null, eTop = null, eBottom = null, eFront = null;

try {
    Action.Hint = '1/5: Кликните ЛЕВОЕ ребро шкафа (внутреннее или внешнее)';
    eLeft = GetEdge('1/5: Кликните ЛЕВОЕ ребро шкафа', AxisY);
} catch(eL) {}

if (!eLeft) {
    Action.Finish();
}

try {
    Action.Hint = '2/5: Кликните ПРАВОЕ ребро шкафа (внутреннее или внешнее)';
    eRight = GetEdge('2/5: Кликните ПРАВОЕ ребро шкафа', AxisY);
} catch(eR) {}

if (!eRight) {
    Action.Finish();
}

try {
    Action.Hint = '3/5: Кликните ВЕРХНЕЕ ребро (крышку)';
    eTop = GetEdge('3/5: Кликните ВЕРХНЕЕ ребро (крышку)', AxisX);
} catch(eT) {}

if (!eTop) {
    Action.Finish();
}

try {
    Action.Hint = '4/5: Кликните НИЖНЕЕ ребро (дно или цоколь)';
    eBottom = GetEdge('4/5: Кликните НИЖНЕЕ ребро (дно или цоколь)', AxisX);
} catch(eB) {}

if (!eBottom) {
    Action.Finish();
}

try {
    Action.Hint = '5/5: Кликните ПЕРЕДНЕЕ ребро шкафа (или Esc для авто-определения)';
    eFront = GetEdge('5/5: Кликните ПЕРЕДНЕЕ ребро (Esc для авто)', AxisY);
} catch(eF) {
    eFront = null;
}

// 4. Анализ геометрии: определение панелей боковин, крышки и дна
var ptLeft = getEdgeMidPoint(eLeft);
var ptRight = getEdgeMidPoint(eRight);
var ptTop = getEdgeMidPoint(eTop);
var ptBottom = getEdgeMidPoint(eBottom);

// Автоматическая нормализация сторон, если пользователь кликнул в обратном порядке
if (ptLeft.x > ptRight.x) {
    var tmpE = eLeft; eLeft = eRight; eRight = tmpE;
    var tmpP = ptLeft; ptLeft = ptRight; ptRight = tmpP;
}

if (ptBottom.y > ptTop.y) {
    var tmpEy = eBottom; eBottom = eTop; eTop = tmpEy;
    var tmpPy = ptBottom; ptBottom = ptTop; ptTop = tmpPy;
}

var panelLeft = findPanelAtPoint(ptLeft);
var panelRight = findPanelAtPoint(ptRight);
var panelTop = findPanelAtPoint(ptTop);
var panelBottom = findPanelAtPoint(ptBottom);

// Координаты ребер
var rawL = getEdgeCoord(eLeft, 'x');
var rawR = getEdgeCoord(eRight, 'x');
var edgeX_left = Math.min(rawL, rawR);
var edgeX_right = Math.max(rawL, rawR);

var rawB = getEdgeCoord(eBottom, 'y');
var rawT = getEdgeCoord(eTop, 'y');
var edgeY_bot = Math.min(rawB, rawT);
var edgeY_top = Math.max(rawB, rawT);

// Z передней плоскости фасада
var zFront = 0;
if (eFront) {
    zFront = getEdgeCoord(eFront, 'z');
} else {
    var zList = [
        getEdgeCoord(eLeft, 'z'),
        getEdgeCoord(eRight, 'z'),
        getEdgeCoord(eTop, 'z'),
        getEdgeCoord(eBottom, 'z')
    ];
    if (panelLeft) zList.push(panelLeft.GabMax.z);
    if (panelRight) zList.push(panelRight.GabMax.z);
    if (panelTop) zList.push(panelTop.GabMax.z);
    if (panelBottom) zList.push(panelBottom.GabMax.z);
    zFront = Math.max.apply(null, zList);
}

// Авто-определение количества петель по высоте
function suggestHingeCount(h) {
    if (h < 900) return 2;
    if (h < 1500) return 3;
    if (h < 2100) return 4;
    return 5;
}

var openingH = edgeY_top - edgeY_bot;
var openingW = edgeX_right - edgeX_left;

// 5. Создание интерактивной панели свойств Action.Properties
var Prop = Action.Properties;
Prop.Clear();

// Кнопка применения в самом верху для максимального удобства!
var grApply = Prop.NewGroup('ГОТОВО (ФИКСАЦИЯ)');
var pBtnApply = grApply.NewButton('Применить (создать реальные двери)');

var grDoors = Prop.NewGroup('1. Конфигурация дверей (фасадов)');

var defaultModeIdx = (openingW > 600) ? 0 : 1;
var pDoorsMode = grDoors.NewCombo('Тип дверей',
    '2 двери (распашные: левая + правая)\n' +
    '1 дверь (распашная, петли слева)\n' +
    '1 дверь (распашная, петли справа)\n' +
    '3 двери (распашные)\n' +
    '4 двери (распашные)'
);
pDoorsMode.ItemIndex = defaultModeIdx;

var pOverlayMode = grDoors.NewCombo('Перекрытие боковин',
    'Накладной (до дальних внешних краев боковин)\n' +
    'Вкладной (строго внутри проема)\n' +
    'Полунакладной (на половину толщины боковин)\n' +
    'По указанным ребрам (без изменений)'
);
pOverlayMode.ItemIndex = 0; // По умолчанию НАКЛАДНОЙ!

var pOverlayTop = grDoors.NewCombo('Перекрытие крышки',
    'Накладной (до верха крышки/детали)\n' +
    'В стык (по указанному ребру)'
);
pOverlayTop.ItemIndex = 0;

var pOverlayBot = grDoors.NewCombo('Перекрытие дна',
    'Накладной (до низа дна/детали)\n' +
    'В стык (по указанному ребру)'
);
pOverlayBot.ItemIndex = 0;

var pDoorGap = grDoors.NewNumber('Отступ от краев (зазор), мм', 1.5);
pDoorGap.MinValue = 0;
pDoorGap.MaxValue = 10;

var pMidGap = grDoors.NewNumber('Зазор между створками, мм', 2.0);
pMidGap.MinValue = 0;
pMidGap.MaxValue = 10;

var pDoorThick = grDoors.NewNumber('Толщина фасада, мм', 16);
pDoorThick.MinValue = 10;
pDoorThick.MaxValue = 30;

var pMatName = grDoors.NewString('Материал фасада', 'ЛДСП 16 мм');

var grHinges = Prop.NewGroup('2. Петли (фурнитура)');

var pInstallHinges = grHinges.NewBool('Устанавливать петли', (hingeObj !== null));

var defaultHingeCount = suggestHingeCount(openingH);
var pHingeCount = grHinges.NewNumber('Количество петель на створку', defaultHingeCount);
pHingeCount.MinValue = 2;
pHingeCount.MaxValue = 7;

var pHingeOffset = grHinges.NewNumber('Отступ петли от края фасада, мм', 50.0);
pHingeOffset.MinValue = 30;
pHingeOffset.MaxValue = 200;

var pBtnHinge = grHinges.NewButton('Выбрать файл петли (.f3d)...');
pBtnHinge.OnClick = function() {
    try {
        var newPath = system.askFileName('f3d;fr3d');
        if (newPath) {
            currentHingePath = newPath;
            hingeObj = loadHinge(currentHingePath);
            pInstallHinges.Value = (hingeObj !== null);
            renderDoors(false);
        }
    } catch(eFile) {}
};

// 6. Функция генерации геометрии дверей и петель
function renderDoors(isFinalCommit) {
    // Очищаем предыдущую превизуализацию
    DeleteNewObjects();

    var mode = pDoorsMode.ItemIndex;
    var overlayMode = pOverlayMode.ItemIndex;
    var gap = pDoorGap.Value;
    var midGap = pMidGap.Value;
    var thick = pDoorThick.Value;
    var matName = pMatName.Value || ('ЛДСП ' + thick + ' мм');
    var doHinges = pInstallHinges.Value && (hingeObj !== null);
    var hCount = Math.round(pHingeCount.Value);
    var hOffset = pHingeOffset.Value;

    // Расчет внешних и внутренних границ по боковинам
    var farLeftX = edgeX_left;
    var innerLeftX = edgeX_left;
    if (panelLeft) {
        farLeftX = Math.min(panelLeft.GabMin.x, panelLeft.GabMax.x);
        innerLeftX = Math.max(panelLeft.GabMin.x, panelLeft.GabMax.x);
    } else {
        farLeftX = edgeX_left - 16;
    }

    var farRightX = edgeX_right;
    var innerRightX = edgeX_right;
    if (panelRight) {
        farRightX = Math.max(panelRight.GabMin.x, panelRight.GabMax.x);
        innerRightX = Math.min(panelRight.GabMin.x, panelRight.GabMax.x);
    } else {
        farRightX = edgeX_right + 16;
    }

    // Горизонтальная база фасада в зависимости от режима наложения
    var baseLeftX, baseRightX;
    if (overlayMode === 0) {
        // Накладной: фасад перекрывает боковины до самого дальнего внешнего края!
        baseLeftX = farLeftX;
        baseRightX = farRightX;
    } else if (overlayMode === 1) {
        // Вкладной: строго по внутреннему проему
        baseLeftX = innerLeftX;
        baseRightX = innerRightX;
    } else if (overlayMode === 2) {
        // Полунакладной: на половину толщины боковин
        baseLeftX = (farLeftX + innerLeftX) / 2;
        baseRightX = (farRightX + innerRightX) / 2;
    } else {
        // По указанным ребрам
        baseLeftX = edgeX_left;
        baseRightX = edgeX_right;
    }

    // Вертикальные границы
    var topY = edgeY_top;
    if (pOverlayTop.ItemIndex === 0 && panelTop) {
        topY = Math.max(panelTop.GabMin.y, panelTop.GabMax.y);
    }
    var doorY2 = topY - gap;

    var botY = edgeY_bot;
    if (pOverlayBot.ItemIndex === 0 && panelBottom) {
        botY = Math.min(panelBottom.GabMin.y, panelBottom.GabMax.y);
    }
    var doorY1 = botY + gap;

    // Горизонтальные габариты фасадов с отступами 1.5 мм
    var spanX1 = baseLeftX + gap;
    var spanX2 = baseRightX - gap;
    var totalSpanW = spanX2 - spanX1;

    BeginBlock('Фасады с петлями');

    ActiveMaterial.Make(matName, thick);

    var doorConfigs = [];

    if (mode === 0) {
        // 2 двери распашные (левая + правая)
        var wSingle = (totalSpanW - midGap) / 2;
        doorConfigs.push({
            name: 'Фасад левый',
            x1: spanX1,
            x2: spanX1 + wSingle,
            hingeSide: 'left',
            post: panelLeft,
            mountX: innerLeftX
        });
        doorConfigs.push({
            name: 'Фасад правый',
            x1: spanX2 - wSingle,
            x2: spanX2,
            hingeSide: 'right',
            post: panelRight,
            mountX: innerRightX
        });
    } else if (mode === 1) {
        // 1 дверь (петли слева)
        doorConfigs.push({
            name: 'Фасад (петли слева)',
            x1: spanX1,
            x2: spanX2,
            hingeSide: 'left',
            post: panelLeft,
            mountX: innerLeftX
        });
    } else if (mode === 2) {
        // 1 дверь (петли справа)
        doorConfigs.push({
            name: 'Фасад (петли справа)',
            x1: spanX1,
            x2: spanX2,
            hingeSide: 'right',
            post: panelRight,
            mountX: innerRightX
        });
    } else if (mode === 3) {
        // 3 двери распашные
        var w3 = (totalSpanW - 2 * midGap) / 3;
        doorConfigs.push({ name: 'Фасад 1', x1: spanX1, x2: spanX1 + w3, hingeSide: 'left', post: panelLeft, mountX: innerLeftX });
        doorConfigs.push({ name: 'Фасад 2', x1: spanX1 + w3 + midGap, x2: spanX1 + 2 * w3 + midGap, hingeSide: 'left', post: null, mountX: spanX1 + w3 + midGap });
        doorConfigs.push({ name: 'Фасад 3', x1: spanX2 - w3, x2: spanX2, hingeSide: 'right', post: panelRight, mountX: innerRightX });
    } else if (mode === 4) {
        // 4 двери распашные
        var w4 = (totalSpanW - 3 * midGap) / 4;
        doorConfigs.push({ name: 'Фасад 1', x1: spanX1, x2: spanX1 + w4, hingeSide: 'left', post: panelLeft, mountX: innerLeftX });
        doorConfigs.push({ name: 'Фасад 2', x1: spanX1 + (w4 + midGap), x2: spanX1 + (w4 + midGap) + w4, hingeSide: 'right', post: null, mountX: spanX1 + (w4 + midGap) + w4 });
        doorConfigs.push({ name: 'Фасад 3', x1: spanX2 - 2 * w4 - midGap, x2: spanX2 - w4 - midGap, hingeSide: 'left', post: null, mountX: spanX2 - 2 * w4 - midGap });
        doorConfigs.push({ name: 'Фасад 4', x1: spanX2 - w4, x2: spanX2, hingeSide: 'right', post: panelRight, mountX: innerRightX });
    }

    var totalHingesCount = 0;

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
        } catch(eB) {}
        panel.Build();

        // Монтаж петель с фиксированным отступом 50 мм от верхнего и нижнего края
        if (doHinges && hCount >= 2) {
            var yHingeBot = doorY1 + hOffset;
            var yHingeTop = doorY2 - hOffset;
            if (yHingeTop <= yHingeBot) yHingeTop = yHingeBot + 100;

            var stepY = (yHingeTop - yHingeBot) / (hCount - 1);
            var mX = cfg.mountX;

            for (var k = 0; k < hCount; k++) {
                var yPos = yHingeBot + k * stepY;
                try {
                    var targetPost = cfg.post || panel;
                    hingeObj.Mount(targetPost, panel, mX, yPos, zFront);
                    totalHingesCount++;
                } catch(eMnt) {}
            }
        }
    }

    EndBlock();

    if (isFinalCommit) {
        try {
            Action.Commit();
        } catch(eC) {}
        try {
            ViewAll();
            SetCamera(p3dIsometric);
        } catch(eV) {}
        Action.Hint = 'ГОТОВО: Создано реальных дверей: ' + doorConfigs.length + ', петель: ' + totalHingesCount;
        Action.Finish();
    } else {
        // Режим превизуализации
        var hStatus = doHinges ? ('Петель: ' + totalHingesCount + ' (отступ: ' + hOffset + ' мм)') : 'Без петель';
        Action.Hint = 'ПРЕВИЗУАЛИЗАЦИЯ: Дверей ' + doorConfigs.length + ' (отступ: ' + gap + ' мм) | ' + hStatus + ' -> Нажмите "Применить" в свойствах слева!';
    }
}

var isCommitted = false;
function commitAndFinish() {
    if (isCommitted) return;
    isCommitted = true;
    renderDoors(true);
}

// Первоначальный запуск в режиме ПРЕВИЗУАЛИЗАЦИИ
renderDoors(false);

// Интерактивное обновление при любых изменениях в панели свойств
Prop.OnChange = function() {
    if (!isCommitted) {
        renderDoors(false);
    }
};

// Обработка кнопки "Применить"
pBtnApply.OnClick = function() {
    commitAndFinish();
};

// Обработка стандартного завершения действия (зеленая галочка в Базисе)
Action.OnFinish = function() {
    commitAndFinish();
};

// Удерживаем интерактивный режим активным!
Action.Continue();
