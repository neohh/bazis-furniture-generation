/**
 * =============================================================================
 * Быстрая расстановка верхних кухонных баз (ряд навесных модулей)
 * Для БАЗИС-Мебельщик (8, 9, 10, 11, 2021-2024)
 * 
 * Расстановка ряда навесных шкафов на основе эластичного мастер-фрагмента
 * "Верхняя база.fr3d" (созданного пользователем с евровинтами и эластичностью)
 * или параметрического каркаса с опциями дверей (распашные / подъемные вверх).
 * 
 * Параметры по умолчанию:
 * - Глубина корпусов D: 500 мм (настраивается: 300, 350, 400, 500 мм и т.д.)
 * - Ширина модулей W: 700 мм (индивидуально для каждого модуля в ряду)
 * - Высота корпусов H: 720 мм (настраивается: 600, 720, 800, 920 мм и т.д.)
 * - Высота навески над полом: 1450 мм (настраивается)
 * 
 * Опции дверей:
 * - 0. Без дверей (открытые полки)
 * - 1. Вертикальная 1 дверь (распашная, петли слева)
 * - 2. Вертикальная 1 дверь (распашная, петли справа)
 * - 3. Вертикальные 2 двери (распашные: левая + правая)
 * - 4. Горизонтальная 1 дверь (подъемная вверх, петли к крышке!)
 * - 5. Горизонтальные 2 двери (подъемные вверх, верхняя петли к крышке!)
 * =============================================================================
 */

function findFirstExistingFile(paths) {
    for (var i = 0; i < paths.length; i++) {
        if (system.fileExists(paths[i])) {
            return paths[i];
        }
    }
    return paths[0];
}

var UPPER_BASE_PATHS = [
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Кухонные модули (эластичные)\\Верхняя база.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Кухонные модули (эластичные)\\модуль верхний Базовый.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\07_КУХОННЫЕ_МОДУЛИ_И_БАЗЫ_ЭЛАСТИЧНЫЕ\\Верхняя база.fr3d',
    'z:\\Work\\генерация мебели\\Модели\\Кухонные модули\\Верхняя база.fr3d'
];

var HINGE_PATHS = [
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Blum петли\\Antarion\\Петли без заглушек и крестообр. планка\\Петля_CLIP top, CLIP без заглушек\\петля МОЯ.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Петли\\петля_моя.f3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\петля_моя.f3d',
    'z:\\Work\\генерация мебели\\furn\\петля_моя.f3d'
];

var upperFragPath = findFirstExistingFile(UPPER_BASE_PATHS);
var hingePath = findFirstExistingFile(HINGE_PATHS);

var hingeObj = null;
if (system.fileExists(hingePath)) {
    try { hingeObj = OpenFurniture(hingePath); } catch (eH) {}
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
        if (item.Count && item.Count > 0) {
            for (var c = 0; c < item.Count; c++) {
                checkObj(item.Objects ? item.Objects[c] : item[c]);
            }
        }
    }
    checkObj(o);
    if (!found) return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
    return { minX: minX, maxX: maxX, minY: minY, maxY: maxY, minZ: minZ, maxZ: maxZ };
}

var Prop = Action.Properties;
Prop.Clear();

var MAX_BASES = 8;
var doorOptions = 
    '0. Без дверей (открытые полки)\n' +
    '1. Вертикальная 1 дверь (распашная, петли слева)\n' +
    '2. Вертикальная 1 дверь (распашная, петли справа)\n' +
    '3. Вертикальные 2 двери (распашные: левая + правая)\n' +
    '4. Горизонтальная 1 дверь (подъемная вверх)\n' +
    '5. Горизонтальные 2 двери (подъемные вверх)';

// [Группа 1: Общие параметры верхнего ряда]
var grMain = Prop.NewGroup('1. Общие параметры верхнего ряда');

var pNumBases = grMain.NewNumber('Количество верхних баз', 3);
pNumBases.MinValue = 1;
pNumBases.MaxValue = MAX_BASES;

var pDefW = grMain.NewNumber('Ширина по умолчанию W, мм', 700);
pDefW.MinValue = 200;
pDefW.MaxValue = 1400;

var pDefD = grMain.NewNumber('Глубина по умолчанию D, мм', 500);
pDefD.MinValue = 200;
pDefD.MaxValue = 800;

var pDefH = grMain.NewNumber('Высота по умолчанию H, мм', 720);
pDefH.MinValue = 300;
pDefH.MaxValue = 1500;

var pStartY = grMain.NewNumber('Высота навески над полом Y, мм', 1450);
pStartY.MinValue = 0;
pStartY.MaxValue = 2500;

var pStartX = grMain.NewNumber('Начало ряда X, мм', 0);
var pStartZ = grMain.NewNumber('Пристенный отступ Z, мм', 0);

// [Группа 2: Модули верхнего ряда]
var grSlots = Prop.NewGroup('2. Состав модулей в ряду');
var baseSlots = [];

for (var b = 0; b < MAX_BASES; b++) {
    var bNum = b + 1;
    var grSlot = grSlots.NewGroup('Верхняя база ' + bNum);

    var pSlotW = grSlot.NewNumber('Ширина W' + bNum + ', мм', 700);
    pSlotW.MinValue = 200;
    pSlotW.MaxValue = 1400;

    var pSlotD = grSlot.NewNumber('Глубина D' + bNum + ' (0 = общая 500 мм)', 0);
    pSlotD.MinValue = 0;
    pSlotD.MaxValue = 800;

    var pSlotH = grSlot.NewNumber('Высота H' + bNum + ' (0 = общая 720 мм)', 0);
    pSlotH.MinValue = 0;
    pSlotH.MaxValue = 1500;

    var pSlotDoor = grSlot.NewCombo('Выбор дверей', doorOptions);
    if (b < 2) pSlotDoor.ItemIndex = 3;
    else if (b === 2) pSlotDoor.ItemIndex = 4;
    else pSlotDoor.ItemIndex = 3;

    baseSlots.push({
        group: grSlot,
        width: pSlotW,
        depth: pSlotD,
        height: pSlotH,
        door: pSlotDoor
    });
}

// [Группа 3: Настройки фасадов и зазоров]
var grDoors = Prop.NewGroup('3. Настройки фасадов и зазоров');
var pDoorGap = grDoors.NewNumber('Зазор по периметру, мм', 1.5);
pDoorGap.MinValue = 0;
pDoorGap.MaxValue = 10;

var pDoorMidGap = grDoors.NewNumber('Зазор между фасадами, мм', 2.0);
pDoorMidGap.MinValue = 0;
pDoorMidGap.MaxValue = 10;

var pBottomHang = grDoors.NewNumber('Свес фасада снизу (захват рукой), мм', 20);
pBottomHang.MinValue = 0;
pBottomHang.MaxValue = 50;

var pDoorThick = grDoors.NewNumber('Толщина фасада, мм', 16);
pDoorThick.MinValue = 10;
pDoorThick.MaxValue = 30;

var pInstallHinges = grDoors.NewBool('Монтировать петли ("петля МОЯ")', true);
var pHingeBottomOffset = grDoors.NewNumber('Отступ нижней петли от дна, мм', 70);
var pHingeTopOffset = grDoors.NewNumber('Отступ верхней петли от верха, мм', 100);

// [Группа 4: Материалы и кромка фасадов]
var grMat = Prop.NewGroup('4. Материалы и кромка');
var pMatDoor = grMat.NewMaterial('Материал фасадов (МДФ / Фасадный ЛДСП)');
var pEdgeFront = grMat.NewButt('Кромка лицевая (0.8 мм)');

// [Группа 5: Действия]
var grActions = Prop.NewGroup('5. Действия');
var btnBuild = grActions.NewButton('Сгенерировать верхний ряд');
var btnFinish = grActions.NewButton('Готово (сохранить)');

function buildUpperRow() {
    DeleteNewObjects();

    var num = Math.min(Math.max(1, Math.round(pNumBases.Value)), MAX_BASES);
    var defW = pDefW.Value;
    var defD = pDefD.Value;
    var defH = pDefH.Value;

    var startX = pStartX.Value;
    var startY = pStartY.Value;
    var startZ = pStartZ.Value;

    var gap = pDoorGap.Value;
    var midGap = pDoorMidGap.Value;
    var bottomHang = pBottomHang.Value;
    var doorThick = pDoorThick.Value;
    var installHinges = pInstallHinges.Value && (hingeObj !== null);

    for (var s = 0; s < MAX_BASES; s++) {
        baseSlots[s].group.Visible = (s < num);
    }

    var curX = startX;
    var hasFragment = (upperFragPath && system.fileExists(upperFragPath));

    var rowBlock = BeginBlock('Ряд верхних баз (' + num + ' модулей)');

    for (var i = 0; i < num; i++) {
        var bNum = i + 1;
        var slot = baseSlots[i];

        var modW = slot.width.Value || defW;
        var modD = (slot.depth.Value > 0) ? slot.depth.Value : defD;
        var modH = (slot.height.Value > 0) ? slot.height.Value : defH;
        var doorChoice = slot.door.ItemIndex;

        var xL = curX;
        var xR = curX + modW;
        var yB = startY;
        var yT = startY + modH;
        var zBack = startZ;
        var zFront = startZ + modD;

        var levBok = null;
        var pravBok = null;
        var krishka = null;
        var dno = null;

        var modBlock = AddBlock('Верхняя база ' + bNum + ' (' + Math.round(modW) + 'x' + Math.round(modD) + 'x' + Math.round(modH) + ')');
        var loadOk = false;

        if (hasFragment) {
            try {
                loadOk = modBlock.Load(upperFragPath);
            } catch(eLoad) {
                loadOk = false;
            }
        }

        if (loadOk) {
            // Эластичное масштабирование фрагмента пользователя
            var dBlock = modBlock;
            if (modBlock.Count > 0) {
                var firstChild = (modBlock.Objects && typeof modBlock.Objects[0] !== 'undefined') ? modBlock.Objects[0] : modBlock[0];
                if (firstChild) dBlock = firstChild;
            }

            var resizeObj = dBlock.ElasticResize ? dBlock : (modBlock.ElasticResize ? modBlock : null);
            if (resizeObj) {
                try {
                    resizeObj.ElasticResize(NewVector(modW, modH, modD));
                } catch(eR1) {
                    try {
                        resizeObj.ElasticResize(NewVector(modW, modH, resizeObj.GSize ? resizeObj.GSize.z : modD));
                    } catch(eR2) {}
                }
                resizeObj.Build();
            }
            modBlock.Build();

            // Позиционирование в ряд
            var box = getPanelBox(modBlock);
            var shiftX = xL - box.minX;
            var shiftY = yB - box.minY;
            var shiftZ = zBack - box.minZ;

            modBlock.Position = NewVector(modBlock.Position.x + shiftX, modBlock.Position.y + shiftY, modBlock.Position.z + shiftZ);
            modBlock.Build();

            // Поиск боковин и крышки внутри загруженного модуля для монтажа петель
            function findPanels(container) {
                if (!container) return;
                for (var p = 0; p < container.Count; p++) {
                    var obj = container.Objects ? container.Objects[p] : container[p];
                    if (obj && obj.AsPanel) {
                        var szX = obj.GabMax.x - obj.GabMin.x;
                        var szY = obj.GabMax.y - obj.GabMin.y;
                        var szZ = obj.GabMax.z - obj.GabMin.z;

                        if (szX <= 35 && szY > (modH * 0.5)) {
                            if (!levBok || obj.GabMin.x < levBok.GabMin.x) levBok = obj;
                            if (!pravBok || obj.GabMax.x > pravBok.GabMax.x) pravBok = obj;
                        }
                        if (szY <= 35 && szX > (modW * 0.5)) {
                            if (!krishka || obj.GabMax.y > krishka.GabMax.y) krishka = obj;
                            if (!dno || obj.GabMin.y < dno.GabMin.y) dno = obj;
                        }
                    }
                    if (obj && obj.Count && obj.Count > 0) findPanels(obj);
                }
            }
            findPanels(modBlock);
        } else {
            // Fallback: чистый параметрический каркас
            var thick = 16;
            levBok = AddVertPanel(zBack, yB, zFront, yT, xL);
            levBok.Name = 'Боковина левая';
            levBok.Build();

            pravBok = AddVertPanel(zBack, yB, zFront, yT, xR - thick);
            pravBok.Name = 'Боковина правая';
            pravBok.Build();

            dno = AddHorizPanel(xL + thick, zBack, xR - thick, zFront, yB);
            dno.Name = 'Дно';
            dno.Build();

            krishka = AddHorizPanel(xL + thick, zBack, xR - thick, zFront, yT - thick);
            krishka.Name = 'Крышка';
            krishka.Build();

            var backWall = AddFrontPanel(xL + 2, yB + 2, xR - 2, yT - 2, zBack - 4);
            backWall.Name = 'Задняя стенка (ХДФ)';
            backWall.Thickness = 4;
            backWall.Build();
        }

        // Двери и фасады
        if (doorChoice > 0) {
            pMatDoor.SetActive();

            var doorX1 = xL + gap;
            var doorX2 = xR - gap;
            var doorY1 = yB - bottomHang;
            var doorY2 = yT - gap;
            var doorZ = zFront;

            var totalW = doorX2 - doorX1;
            var totalH = doorY2 - doorY1;

            var doorsToCreate = [];

            if (doorChoice === 1) {
                doorsToCreate.push({
                    name: 'Фасад (петли слева)',
                    x1: doorX1, x2: doorX2,
                    y1: doorY1, y2: doorY2,
                    post: levBok,
                    side: 'left'
                });
            } else if (doorChoice === 2) {
                doorsToCreate.push({
                    name: 'Фасад (петли справа)',
                    x1: doorX1, x2: doorX2,
                    y1: doorY1, y2: doorY2,
                    post: pravBok,
                    side: 'right'
                });
            } else if (doorChoice === 3) {
                var wSingle = (totalW - midGap) / 2;
                doorsToCreate.push({
                    name: 'Фасад левый',
                    x1: doorX1, x2: doorX1 + wSingle,
                    y1: doorY1, y2: doorY2,
                    post: levBok,
                    side: 'left'
                });
                doorsToCreate.push({
                    name: 'Фасад правый',
                    x1: doorX2 - wSingle, x2: doorX2,
                    y1: doorY1, y2: doorY2,
                    post: pravBok,
                    side: 'right'
                });
            } else if (doorChoice === 4) {
                // Горизонтальная 1 дверь - петли к крышке!
                doorsToCreate.push({
                    name: 'Фасад подъемный (вверх)',
                    x1: doorX1, x2: doorX2,
                    y1: doorY1, y2: doorY2,
                    post: krishka,
                    side: 'up'
                });
            } else if (doorChoice === 5) {
                var hSingle = (totalH - midGap) / 2;
                doorsToCreate.push({
                    name: 'Фасад подъемный нижний',
                    x1: doorX1, x2: doorX2,
                    y1: doorY1, y2: doorY1 + hSingle,
                    post: null,
                    side: 'lower_lift'
                });
                // Верхний фасад крепится к крышке!
                doorsToCreate.push({
                    name: 'Фасад подъемный верхний',
                    x1: doorX1, x2: doorX2,
                    y1: doorY2 - hSingle, y2: doorY2,
                    post: krishka,
                    side: 'up'
                });
            }

            for (var d = 0; d < doorsToCreate.length; d++) {
                var dInfo = doorsToCreate[d];
                var fPanel = AddFrontPanel(dInfo.x1, dInfo.y1, dInfo.x2, dInfo.y2, doorZ);
                fPanel.Name = dInfo.name;
                fPanel.Thickness = doorThick;
                fPanel.AddButt(pEdgeFront, 0);
                fPanel.AddButt(pEdgeFront, 1);
                fPanel.AddButt(pEdgeFront, 2);
                fPanel.AddButt(pEdgeFront, 3);
                fPanel.Build();

                if (installHinges && dInfo.post) {
                    if (dInfo.side === 'up') {
                        // ПЕТЛИ К КРЫШКЕ ШКАФА
                        var mountY = krishka ? krishka.GabMin.y : (yT - 16);
                        var hX1 = xL + 16 + 70;
                        var hX2 = xR - 16 - 70;
                        try {
                            hingeObj.Mount(dInfo.post, fPanel, hX1, mountY, doorZ);
                            hingeObj.Mount(dInfo.post, fPanel, hX2, mountY, doorZ);
                            if (modW > 900) {
                                var hXMid = (xL + xR) / 2;
                                hingeObj.Mount(dInfo.post, fPanel, hXMid, mountY, doorZ);
                            }
                        } catch (eHngUp) {}
                    } else {
                        // Распашные петли к боковинам
                        var mountX = (dInfo.side === 'left') ? (xL + 16) : (xR - 16);
                        var baseBottomY = dno ? dno.GabMax.y : (yB + 16);
                        var hYBot = baseBottomY + pHingeBottomOffset.Value;
                        var hYTop = dInfo.y2 - pHingeTopOffset.Value;
                        if (hYTop <= hYBot) hYTop = hYBot + 100;

                        try {
                            hingeObj.Mount(dInfo.post, fPanel, mountX, hYBot, doorZ);
                            hingeObj.Mount(dInfo.post, fPanel, mountX, hYTop, doorZ);

                            if ((dInfo.y2 - dInfo.y1) > 900) {
                                var hYMid = (hYBot + hYTop) / 2;
                                hingeObj.Mount(dInfo.post, fPanel, mountX, hYMid, doorZ);
                            }
                        } catch (eHng) {}
                    }
                }
            }
        }

        curX += modW;
    }

    EndBlock();

    ViewAll();
    SetCamera(p3dIsometric);
}

btnBuild.OnClick = function() {
    buildUpperRow();
};

btnFinish.OnClick = function() {
    buildUpperRow();
    Action.Commit();
    Action.Finish();
};

Prop.OnChange = function() {
    buildUpperRow();
};

buildUpperRow();
Action.Continue();
