/**
 * =============================================================================
 * Установка дверей на кухонные базы (распашные и подъемные)
 * Для БАЗИС-Мебельщик (8, 9, 10, 11, 2021-2024)
 * 
 * Назначение:
 * Универсальный скрипт установки фасадов (дверей) на любые кухонные модули:
 * как на НИЖНИЕ базы (столы), так и на ВЕРХНИЕ базы (навесные шкафы).
 * 
 * Возможности:
 * 1. Автоматический поиск модулей/секций в сцене (по блокам или парам стоек).
 * 2. Выбор типа дверей для каждого найденного модуля:
 *    - 0. Без дверей (пропустить модуль)
 *    - 1. Вертикальная 1 дверь (распашная, петли слева)
 *    - 2. Вертикальная 1 дверь (распашная, петли справа)
 *    - 3. Вертикальные 2 двери (распашные: левая + правая)
 *    - 4. Горизонтальная 1 дверь (подъемная вверх на весь проем)
 *    - 5. Горизонтальные 2 двери (подъемные вверх, нижняя + верхняя)
 * 3. Настройка зазоров (1.5 мм по периметру, 2.0 мм между створками).
 * 4. Настройка свеса снизу (для верхних баз 20 мм под захват рукой без ручек;
 *    для нижних баз 0 мм вровень со стойками).
 * 5. Автоматическая установка петель "петля МОЯ" с привязкой 70 мм от дна
 *    и 100 мм от верхнего края двери.
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// 1. Поиск фурнитуры ("петля МОЯ")
// -----------------------------------------------------------------------------
function findFirstExistingFile(paths) {
    for (var i = 0; i < paths.length; i++) {
        if (system.fileExists(paths[i])) {
            return paths[i];
        }
    }
    return paths[0];
}

var HINGE_PATHS = [
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Blum петли\\Antarion\\Петли без заглушек и крестообр. планка\\Петля_CLIP top, CLIP без заглушек\\петля МОЯ.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Петли\\петля_моя.f3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\петля_моя.f3d',
    'z:\\Work\\генерация мебели\\furn\\петля_моя.f3d'
];

var hingePath = findFirstExistingFile(HINGE_PATHS);
var hingeObj = null;
if (system.fileExists(hingePath)) {
    try { hingeObj = OpenFurniture(hingePath); } catch (eH) {}
}

// -----------------------------------------------------------------------------
// 2. Сканирование сцены и обнаружение модулей
// -----------------------------------------------------------------------------
var allPosts = [];
var allHoriz = [];

function scanContainer(container) {
    if (!container) return;
    for (var i = 0; i < container.Count; i++) {
        var obj = container.Objects[i];
        if (obj.AsPanel) {
            var n = (obj.Name || '').toLowerCase();
            var szX = obj.GabMax.x - obj.GabMin.x;
            var szY = obj.GabMax.y - obj.GabMin.y;
            var szZ = obj.GabMax.z - obj.GabMin.z;

            // Стойка: толщина по X <= 35 мм, высота > 250 мм, глубина > 180 мм, не фасад
            if (szX <= 35 && szY > 250 && szZ > 180 && n.indexOf('фасад') === -1 && n.indexOf('двер') === -1 && n.indexOf('цоколь') === -1) {
                allPosts.push({
                    obj: obj,
                    selected: obj.Selected,
                    name: obj.Name,
                    minX: obj.GabMin.x, maxX: obj.GabMax.x,
                    minY: obj.GabMin.y, maxY: obj.GabMax.y,
                    minZ: obj.GabMin.z, maxZ: obj.GabMax.z
                });
            }

            // Горизонтальная панель (дно / полка / крышка): толщина по Y <= 35 мм
            if (szY <= 35 && szX > 200 && szZ > 180 && n.indexOf('фасад') === -1 && n.indexOf('столешниц') === -1) {
                allHoriz.push({
                    obj: obj,
                    minX: obj.GabMin.x, maxX: obj.GabMax.x,
                    minY: obj.GabMin.y, maxY: obj.GabMax.y,
                    minZ: obj.GabMin.z, maxZ: obj.GabMax.z
                });
            }
        }
        if (obj.Count && obj.Count > 0) {
            scanContainer(obj);
        }
    }
}

scanContainer(Model);

// Если есть выделенные стойки, работаем только по ним
var activePosts = [];
var hasSelected = false;
for (var p = 0; p < allPosts.length; p++) {
    if (allPosts[p].selected) {
        hasSelected = true;
        break;
    }
}

if (hasSelected) {
    for (var p = 0; p < allPosts.length; p++) {
        if (allPosts[p].selected) activePosts.push(allPosts[p]);
    }
} else {
    activePosts = allPosts;
}

if (activePosts.length < 2) {
    alert('Не найдено достаточно стоек (боковин) для установки дверей!\n' +
          'Найдено стоек: ' + activePosts.length + '.\n' +
          'Создайте или выделите кухонные модули в сцене.');
    Action.Finish();
}

// -----------------------------------------------------------------------------
// 3. Кластеризация стоек по ярусам Y (нижние базы vs верхние базы) и секциям
// -----------------------------------------------------------------------------
// Группировка стоек по схожей высоте низа Y с погрешностью 60 мм
var yTiers = [];

for (var i = 0; i < activePosts.length; i++) {
    var post = activePosts[i];
    var placedInTier = false;

    for (var t = 0; t < yTiers.length; t++) {
        var tier = yTiers[t];
        if (Math.abs(post.minY - tier.refY) < 60) {
            tier.posts.push(post);
            placedInTier = true;
            break;
        }
    }

    if (!placedInTier) {
        yTiers.push({
            refY: post.minY,
            posts: [post]
        });
    }
}

// Сортировка ярусов снизу вверх
yTiers.sort(function(a, b) { return a.refY - b.refY; });

var detectedModules = [];

for (var t = 0; t < yTiers.length; t++) {
    var tierPosts = yTiers[t].posts;
    // Сортировка стоек в ярусе слева направо
    tierPosts.sort(function(a, b) { return a.minX - b.minX; });

    // Поиск пар стоек, образующих модуль (ширина от 200 до 1400 мм)
    var pIdx = 0;
    while (pIdx < tierPosts.length - 1) {
        var p1 = tierPosts[pIdx];
        var p2 = tierPosts[pIdx + 1];
        var spanW = p2.maxX - p1.minX;

        // Если стойки отстоят на ширину модуля (200..1400 мм)
        if (spanW >= 200 && spanW <= 1400) {
            var modMinY = Math.min(p1.minY, p2.minY);
            var modMaxY = Math.max(p1.maxY, p2.maxY);
            var modMaxZ = Math.max(p1.maxZ, p2.maxZ);
            var isUpper = (modMinY >= 900); // верхняя база, если Y >= 900 мм

            // Поиск дна между стойками
            var foundBottom = null;
            var minBottomY = 999999;
            for (var h = 0; h < allHoriz.length; h++) {
                var hp = allHoriz[h];
                if (hp.minX >= p1.minX - 10 && hp.maxX <= p2.maxX + 10 && hp.minY >= modMinY - 30 && hp.minY <= modMinY + 100) {
                    if (hp.minY < minBottomY) {
                        minBottomY = hp.minY;
                        foundBottom = hp;
                    }
                }
            }

            var modNum = detectedModules.length + 1;
            var typeStr = isUpper ? 'Верхний шкаф' : 'Нижняя база';
            var label = modNum + '. ' + typeStr + ' W=' + Math.round(spanW) + ' (X:' + Math.round(p1.minX) + '..' + Math.round(p2.maxX) + ', Y:' + Math.round(modMinY) + ')';

            detectedModules.push({
                index: modNum,
                label: label,
                isUpper: isUpper,
                leftPost: p1.obj,
                rightPost: p2.obj,
                minX: p1.minX,
                maxX: p2.maxX,
                thickL: p1.maxX - p1.minX,
                thickR: p2.maxX - p2.minX,
                minY: modMinY,
                maxY: modMaxY,
                maxZ: modMaxZ,
                bottomPanel: foundBottom ? foundBottom.obj : null,
                bottomTopY: foundBottom ? foundBottom.maxY : (modMinY + 16)
            });

            pIdx += 2; // переходим к следующему модулю
        } else {
            pIdx += 1;
        }
    }
}

if (detectedModules.length === 0) {
    alert('Не удалось автоматически сопоставить пары стоек в модули шкафа.\n' +
          'Убедитесь, что стойки модулей расположены параллельно и имеют стандартные размеры.');
    Action.Finish();
}

// -----------------------------------------------------------------------------
// 4. Построение интерфейса Action.Properties
// -----------------------------------------------------------------------------
var Prop = Action.Properties;
Prop.Clear();

var doorOptions = 
    '0. Без дверей (пропустить модуль)\n' +
    '1. Вертикальная 1 дверь (распашная, петли слева)\n' +
    '2. Вертикальная 1 дверь (распашная, петли справа)\n' +
    '3. Вертикальные 2 двери (распашные: левая + правая)\n' +
    '4. Горизонтальная 1 дверь (подъемная вверх)\n' +
    '5. Горизонтальные 2 двери (подъемные вверх)';

// [Группа 1: Общие зазоры и фасады]
var grCommon = Prop.NewGroup('1. Общие параметры фасадов');
var pDoorGap = grCommon.NewNumber('Зазор по периметру, мм', 1.5);
pDoorGap.MinValue = 0;
pDoorGap.MaxValue = 10;

var pMidGap = grCommon.NewNumber('Зазор между створками/фасадами, мм', 2.0);
pMidGap.MinValue = 0;
pMidGap.MaxValue = 10;

var pDefaultUpperHang = grCommon.NewNumber('Свес снизу для верхних баз (захват рукой), мм', 20);
pDefaultUpperHang.MinValue = 0;
pDefaultUpperHang.MaxValue = 50;

var pDoorThick = grCommon.NewNumber('Толщина фасада, мм', 16);
pDoorThick.MinValue = 10;
pDoorThick.MaxValue = 30;

var pMatDoor = grCommon.NewMaterial('Материал фасадов (МДФ / ЛДСП)');
var pEdgeDoor = grCommon.NewButt('Кромка фасадов (0.8 мм)');

// [Группа 2: Петли]
var grHinges = Prop.NewGroup('2. Настройки петель ("петля МОЯ")');
var pInstallHinges = grHinges.NewBool('Монтировать петли на распашные двери', true);
var pHingeBottomOffset = grHinges.NewNumber('Отступ нижней петли от дна, мм', 70);
var pHingeTopOffset = grHinges.NewNumber('Отступ верхней петли от верха, мм', 100);

// [Группа 3: Список обнаруженных модулей]
var grMods = Prop.NewGroup('3. Список найденных модулей (' + detectedModules.length + ' шт)');
var modControls = [];

for (var m = 0; m < detectedModules.length; m++) {
    var mod = detectedModules[m];
    var grMod = grMods.NewGroup(mod.label);

    var pDoorChoice = grMod.NewCombo('Выбор дверей', doorOptions);
    // Интеллектуальный выбор по умолчанию:
    // Ширина <= 500 мм -> 1 дверь (петли слева)
    // Ширина > 500 мм -> 2 двери распашные
    var w = mod.maxX - mod.minX;
    if (w <= 500) {
        pDoorChoice.ItemIndex = 1; // 1 дверь левая
    } else {
        pDoorChoice.ItemIndex = 3; // 2 двери
    }

    var defHang = mod.isUpper ? pDefaultUpperHang.Value : 0;
    var pHang = grMod.NewNumber('Свес снизу для этого модуля, мм', defHang);
    pHang.MinValue = 0;
    pHang.MaxValue = 60;

    modControls.push({
        doorChoice: pDoorChoice,
        hangBottom: pHang
    });
}

// [Группа 4: Действия]
var grActions = Prop.NewGroup('4. Действия');
var btnBuild = grActions.NewButton('Установить выбранные двери');
var btnFinish = grActions.NewButton('Готово (сохранить)');

// -----------------------------------------------------------------------------
// 5. Функция создания дверей и монтажа петель
// -----------------------------------------------------------------------------
function buildDoors() {
    DeleteNewObjects();

    pMatDoor.SetActive();

    var gap = pDoorGap.Value;
    var midGap = pDoorMidGap.Value;
    var doorThick = pDoorThick.Value;
    var installHinges = pInstallHinges.Value && (hingeObj !== null);

    var totalDoorsCreated = 0;

    var mainBlock = BeginBlock('Установленные фасады кухни (' + detectedModules.length + ' модулей)');

    for (var m = 0; m < detectedModules.length; m++) {
        var mod = detectedModules[m];
        var ctrl = modControls[m];
        var choice = ctrl.doorChoice.ItemIndex;

        if (choice === 0) continue; // пропустить

        var hang = ctrl.hangBottom.Value;

        var doorX1 = mod.minX + gap;
        var doorX2 = mod.maxX - gap;
        var doorY1 = mod.minY + gap - hang;
        var doorY2 = mod.maxY - gap;
        var doorZ = mod.maxZ;

        var totalW = doorX2 - doorX1;
        var totalH = doorY2 - doorY1;

        var doorsToMake = [];

        if (choice === 1) {
            // 1 дверь (петли слева)
            doorsToMake.push({
                name: 'Фасад (петли слева)',
                x1: doorX1, x2: doorX2,
                y1: doorY1, y2: doorY2,
                post: mod.leftPost,
                side: 'left'
            });
        } else if (choice === 2) {
            // 1 дверь (петли справа)
            doorsToMake.push({
                name: 'Фасад (петли справа)',
                x1: doorX1, x2: doorX2,
                y1: doorY1, y2: doorY2,
                post: mod.rightPost,
                side: 'right'
            });
        } else if (choice === 3) {
            // 2 двери распашные (левая + правая)
            var wSingle = (totalW - midGap) / 2;
            doorsToMake.push({
                name: 'Фасад левый',
                x1: doorX1, x2: doorX1 + wSingle,
                y1: doorY1, y2: doorY2,
                post: mod.leftPost,
                side: 'left'
            });
            doorsToMake.push({
                name: 'Фасад правый',
                x1: doorX2 - wSingle, x2: doorX2,
                y1: doorY1, y2: doorY2,
                post: mod.rightPost,
                side: 'right'
            });
        } else if (choice === 4) {
            // 1 горизонтальная дверь (подъемная вверх)
            doorsToMake.push({
                name: 'Фасад подъемный (вверх)',
                x1: doorX1, x2: doorX2,
                y1: doorY1, y2: doorY2,
                post: null,
                side: 'up'
            });
        } else if (choice === 5) {
            // 2 горизонтальные двери (подъемные вверх)
            var hSingle = (totalH - midGap) / 2;
            doorsToMake.push({
                name: 'Фасад подъемный нижний',
                x1: doorX1, x2: doorX2,
                y1: doorY1, y2: doorY1 + hSingle,
                post: null,
                side: 'up'
            });
            doorsToMake.push({
                name: 'Фасад подъемный верхний',
                x1: doorX1, x2: doorX2,
                y1: doorY2 - hSingle, y2: doorY2,
                post: null,
                side: 'up'
            });
        }

        // Создание панелей и монтаж петель
        for (var d = 0; d < doorsToMake.length; d++) {
            var dInfo = doorsToMake[d];
            var fPanel = AddFrontPanel(dInfo.x1, dInfo.y1, dInfo.x2, dInfo.y2, doorZ);
            fPanel.Name = dInfo.name;
            fPanel.Thickness = doorThick;
            fPanel.AddButt(pEdgeDoor, 0);
            fPanel.AddButt(pEdgeDoor, 1);
            fPanel.AddButt(pEdgeDoor, 2);
            fPanel.AddButt(pEdgeDoor, 3);
            fPanel.Build();
            totalDoorsCreated++;

            // Монтаж кастомных петель "петля МОЯ"
            if (installHinges && dInfo.post) {
                var mountX = (dInfo.side === 'left') ? (mod.minX + mod.thickL) : (mod.maxX - mod.thickR);
                // 70 мм от верхней пласти дна
                var hYBot = mod.bottomTopY + pHingeBottomOffset.Value;
                // 100 мм от верхнего края двери
                var hYTop = dInfo.y2 - pHingeTopOffset.Value;

                if (hYTop <= hYBot) hYTop = hYBot + 100;

                try {
                    hingeObj.Mount(dInfo.post, fPanel, mountX, hYBot, doorZ);
                    hingeObj.Mount(dInfo.post, fPanel, mountX, hYTop, doorZ);

                    // Дополнительная средняя петля, если фасад выше 900 мм
                    if ((dInfo.y2 - dInfo.y1) > 900) {
                        var hYMid = (hYBot + hYTop) / 2;
                        hingeObj.Mount(dInfo.post, fPanel, mountX, hYMid, doorZ);
                    }
                } catch (eHng) {}
            }
        }
    }

    EndBlock();

    ViewAll();
    SetCamera(p3dIsometric);
    return totalDoorsCreated;
}

// Привязка кнопок и событий
btnBuild.OnClick = function() {
    buildDoors();
};

btnFinish.OnClick = function() {
    var count = buildDoors();
    Action.Commit();
    Action.Finish();
    alert('Успешно установлено дверей/фасадов: ' + count + ' шт.');
};

Prop.OnChange = function() {
    buildDoors();
};

// Первый интерактивный запуск
buildDoors();
Action.Continue();
