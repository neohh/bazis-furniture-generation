/**
 * =============================================================================
 * Быстрая расстановка верхних кухонных баз (ряд навесных модулей)
 * Для БАЗИС-Мебельщик (8, 9, 10, 11, 2021-2024)
 * 
 * Расстановка ряда навесных шкафов на основе эластичного мастер-фрагмента
 * "Верхняя база.fr3d" (созданного пользователем с евровинтами и эластичностью)
 * или параметрического каркаса с опциями полок и дверей.
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

var SHELF_SUPPORT_PATHS = [
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Полкодержатели\\полкодержатель_d5.f3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\полкодержатель_d5.f3d',
    'z:\\Work\\генерация мебели\\furn\\полкодержатель_d5.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Полкодержатели\\Полкодержатель D5 никель.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Крепеж\\полкодержатель_d5.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\полкодержатель_d5.f3d'
];

var upperFragPath = findFirstExistingFile(UPPER_BASE_PATHS);
var hingePath = findFirstExistingFile(HINGE_PATHS);
var shelfSupportPath = findFirstExistingFile(SHELF_SUPPORT_PATHS);

var hingeObj = null;
if (system.fileExists(hingePath)) {
    try { hingeObj = OpenFurniture(hingePath); } catch (eH) {}
}

var shelfSupportObj = null;
if (system.fileExists(shelfSupportPath)) {
    try { shelfSupportObj = OpenFurniture(shelfSupportPath); } catch (eS) {}
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

var doorList = [
    '0. Без дверей (открытые полки)',
    '1. Вертикальная 1 дверь (распашная, петли слева)',
    '2. Вертикальная 1 дверь (распашная, петли справа)',
    '3. Вертикальные 2 двери (распашные: левая + правая)',
    '4. Горизонтальная 1 дверь (подъемная вверх)',
    '5. Горизонтальные 2 двери (подъемные вверх)'
];
var doorOptions = doorList.join('\n');

var shelfList = [
    '2 полки',
    '1 полка',
    '3 полки',
    'Без полок'
];
var shelfOptions = shelfList.join('\n');

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

    // Выбор количества полок
    var pSlotShelves = grSlot.NewCombo('Количество полок', shelfOptions);
    pSlotShelves.ItemIndex = 0;
    try { pSlotShelves.Value = shelfList[0]; } catch(e) {}

    // Выбор дверей
    var defDoorIdx = (b < 2) ? 3 : ((b === 2) ? 4 : 3);
    var pSlotDoor = grSlot.NewCombo('Выбор дверей', doorOptions);
    pSlotDoor.ItemIndex = defDoorIdx;
    try { pSlotDoor.Value = doorList[defDoorIdx]; } catch(e) {}

    baseSlots.push({
        group: grSlot,
        width: pSlotW,
        depth: pSlotD,
        height: pSlotH,
        shelves: pSlotShelves,
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
var pInstallShelfSupp = grDoors.NewBool('Полкодержатели d5 под полки', true);
var pHingeBottomOffset = grDoors.NewNumber('Отступ нижней петли от дна, мм', 70);
var pHingeTopOffset = grDoors.NewNumber('Отступ верхней петли от верха, мм', 100);

// [Группа 4: Материалы и кромка]
var grMat = Prop.NewGroup('4. Материалы и кромка');
var pMatBody = grMat.NewMaterial('Материал корпуса и полок (ЛДСП 16 мм)');
var pMatDoor = grMat.NewMaterial('Материал фасадов (МДФ / Фасадный ЛДСП)');
var pEdgeFront = grMat.NewButt('Кромка лицевая фасада (0.8 мм)');
var pEdgeBody = grMat.NewButt('Кромка полок и корпуса (0.4 мм)');

// [Группа 5: Действия]
var grActions = Prop.NewGroup('5. Действия');
var btnBuild = grActions.NewButton('Сгенерировать верхний ряд');
var btnFinish = grActions.NewButton('Готово (сохранить)');

function getDoorChoice(combo) {
    if (combo && combo.Value) {
        var v = combo.Value.trim();
        for (var i = 0; i < doorList.length; i++) {
            if (v === doorList[i] || v.indexOf(doorList[i].substring(0, 3)) === 0) {
                return i;
            }
        }
    }
    return (combo && typeof combo.ItemIndex !== 'undefined') ? combo.ItemIndex : 3;
}

function getShelfCount(combo) {
    if (combo && combo.Value) {
        var v = combo.Value.trim();
        if (v.indexOf('1') === 0) return 1;
        if (v.indexOf('3') === 0) return 3;
        if (v.indexOf('Без') === 0 || v.indexOf('0') === 0) return 0;
        return 2;
    }
    var idx = (combo && typeof combo.ItemIndex !== 'undefined') ? combo.ItemIndex : 0;
    if (idx === 1) return 1;
    if (idx === 2) return 3;
    if (idx === 3) return 0;
    return 2;
}

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

    pMatBody.SetActive();
    var thick = ActiveMaterial.Thickness || 16;
    if (!thick || thick <= 0) thick = 16;

    var curX = startX;
    var hasFragment = (upperFragPath && system.fileExists(upperFragPath));

    var rowBlock = BeginBlock('Ряд верхних баз (' + num + ' модулей)');

    for (var i = 0; i < num; i++) {
        var bNum = i + 1;
        var slot = baseSlots[i];

        var modW = slot.width.Value || defW;
        var modD = (slot.depth.Value > 0) ? slot.depth.Value : defD;
        var modH = (slot.height.Value > 0) ? slot.height.Value : defH;
        var doorChoice = getDoorChoice(slot.door);
        var numShelves = getShelfCount(slot.shelves);

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
        var backWall = null;

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
            // Эластичное масштабирование фрагмента
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

            // Позиционирование в ряду
            var box = getPanelBox(modBlock);
            var shiftX = xL - box.minX;
            var shiftY = yB - box.minY;
            var shiftZ = zBack - box.minZ;

            modBlock.Position = NewVector(modBlock.Position.x + shiftX, modBlock.Position.y + shiftY, modBlock.Position.z + shiftZ);
            modBlock.Build();

            // Поиск боковин, крышки, дна и задней стенки внутри загруженного модуля
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
                        // Задняя стенка (ХДФ / ДВП / задняя панель)
                        if (szZ <= 10 && szX > (modW * 0.5) && szY > (modH * 0.5)) {
                            if (!backWall || obj.GabMin.z < backWall.GabMin.z) backWall = obj;
                        }
                    }
                    if (obj && obj.Count && obj.Count > 0) findPanels(obj);
                }
            }
            findPanels(modBlock);
        } else {
            // Fallback: параметрическая сборка
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

            backWall = AddFrontPanel(xL + 2, yB + 2, xR - 2, yT - 2, zBack - 4);
            backWall.Name = 'Задняя стенка (ХДФ)';
            backWall.Thickness = 4;
            backWall.Build();
        }

        // Реальные геометрические плоскости корпуса по осям X, Y, Z
        var carcassFrontZ = levBok ? levBok.GabMax.z : (pravBok ? pravBok.GabMax.z : zFront);
        var carcassInnerBackZ = zBack;
        if (backWall) {
            carcassInnerBackZ = backWall.GabMax.z;
        } else if (dno) {
            carcassInnerBackZ = dno.GabMin.z;
        } else if (levBok) {
            carcassInnerBackZ = levBok.GabMin.z;
        }

        var carcassLeftX = levBok ? levBok.GabMin.x : xL;
        var carcassRightX = pravBok ? pravBok.GabMax.x : xR;
        var carcassBottomY = dno ? dno.GabMin.y : yB;
        var carcassTopY = krishka ? krishka.GabMax.y : yT;

        // Полки вкладные
        if (numShelves > 0) {
            pMatBody.SetActive();
            var innerX1 = levBok ? (levBok.GabMax.x + 1) : (carcassLeftX + thick + 1);
            var innerX2 = pravBok ? (pravBok.GabMin.x - 1) : (carcassRightX - thick - 1);
            var innerY1 = dno ? (dno.GabMax.y + 1) : (carcassBottomY + thick + 1);
            var innerY2 = krishka ? (krishka.GabMin.y - 1) : (carcassTopY - thick - 1);
            var innerH = innerY2 - innerY1;
            var shelfStep = innerH / (numShelves + 1);
            
            // ВАЖНО: Полка начинается за задней стенкой (+1 мм внутри) и заканчивается за 15 мм до фасада!
            var shelfZBack = carcassInnerBackZ + 1;
            var shelfZFront = carcassFrontZ - 15;

            var mountSupp = pInstallShelfSupp.Value && (shelfSupportObj !== null) && (levBok !== null) && (pravBok !== null);

            for (var sh = 1; sh <= numShelves; sh++) {
                var shY = innerY1 + sh * shelfStep - thick / 2;
                var polka = AddHorizPanel(innerX1, shelfZBack, innerX2, shelfZFront, shY);
                polka.Name = 'Полка вкладная ' + sh;
                polka.Thickness = thick;
                polka.AddButt(pEdgeBody, 1);
                polka.Build();

                if (mountSupp) {
                    var pY = polka.GabMin.y;
                    var pZ1 = polka.GabMin.z + 64;
                    var pZ2 = polka.GabMax.z - 40;
                    if (pZ2 <= pZ1) {
                        pZ1 = polka.GabMin.z + 32;
                        pZ2 = polka.GabMax.z - 32;
                    }
                    try {
                        // ВАЖНО: В БАЗИС первый аргумент - ГОРИЗОНТАЛЬНАЯ полка (polka),
                        // второй аргумент - ВЕРТИКАЛЬНАЯ боковина (levBok / pravBok).
                        shelfSupportObj.Mount(polka, levBok, polka.GabMin.x, pY, pZ1);
                        shelfSupportObj.Mount(polka, pravBok, polka.GabMax.x, pY, pZ1);
                        shelfSupportObj.Mount(polka, levBok, polka.GabMin.x, pY, pZ2);
                        shelfSupportObj.Mount(polka, pravBok, polka.GabMax.x, pY, pZ2);
                    } catch(eShM) {}
                }
            }
        }

        // Двери и фасады
        if (doorChoice > 0) {
            pMatDoor.SetActive();

            var doorX1 = carcassLeftX + gap;
            var doorX2 = carcassRightX - gap;
            var doorY1 = carcassBottomY - bottomHang;
            var doorY2 = carcassTopY - gap;
            var doorZ = carcassFrontZ; // ВАЖНО: строго по лицевой грани боковин!

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
                        var mountY = krishka ? krishka.GabMin.y : (carcassTopY - 16);
                        var hX1 = (levBok ? levBok.GabMax.x : (carcassLeftX + 16)) + 70;
                        var hX2 = (pravBok ? pravBok.GabMin.x : (carcassRightX - 16)) - 70;
                        try {
                            hingeObj.Mount(dInfo.post, fPanel, hX1, mountY, doorZ);
                            hingeObj.Mount(dInfo.post, fPanel, hX2, mountY, doorZ);
                            if (modW > 900) {
                                var hXMid = (carcassLeftX + carcassRightX) / 2;
                                hingeObj.Mount(dInfo.post, fPanel, hXMid, mountY, doorZ);
                            }
                        } catch (eHngUp) {}
                    } else {
                        // Распашные петли к боковинам
                        var mountX = (dInfo.side === 'left') ? (levBok ? levBok.GabMax.x : (carcassLeftX + 16)) : (pravBok ? pravBok.GabMin.x : (carcassRightX - 16));
                        var baseBottomY = dno ? dno.GabMax.y : (carcassBottomY + 16);
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
