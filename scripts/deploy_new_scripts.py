# -*- coding: utf-8 -*-
"""
Deploy all kitchen generation scripts:
1. 11_Быстрая расстановка верхних кухонных баз (ряд модулей).js
2. 12_Установка дверей на кухонные базы (распашные и подъемные).js
3. 13_Генератор верхнего кухонного модуля (короб).js
"""
import os
import subprocess

# ==============================================================================
# SCRIPT 3: Генератор верхнего кухонного модуля (короб)
# ==============================================================================
SCRIPT3_CODE = r'''/**
 * =============================================================================
 * Генератор базового короба верхнего кухонного модуля (навесного шкафа)
 * Для БАЗИС-Мебельщик (8, 9, 10, 11, 2021-2024)
 * 
 * Назначение:
 * Генерация чистого, идеально выверенного каркаса (короба) верхнего модуля
 * кухни без фасадов и лишней фурнитуры.
 * 
 * Вы можете:
 * 1. Запустить скрипт и получить чистый короб верхнего шкафа (700х500х720 мм).
 * 2. Расставить на нем свои евровинты, навесы и крепеж так, как вам нужно.
 * 3. Назначить плоскости эластичности по осям X, Y, Z.
 * 4. Сохранить его как фрагмент (например, "Верхняя база.fr3d"),
 *    после чего скрипт быстрой расстановки ряда баз будет автоматически
 *    растягивать вашу готовую модель!
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

var SHELF_SUPPORT_PATHS = [
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Полкодержатели\\полкодержатель_d5.f3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\полкодержатель_d5.f3d',
    'z:\\Work\\генерация мебели\\furn\\полкодержатель_d5.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Полкодержатели\\Полкодержатель D5 никель.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\Крепеж\\полкодержатель_d5.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фурнитура\\полкодержатель_d5.f3d'
];

var shelfSupportPath = findFirstExistingFile(SHELF_SUPPORT_PATHS);
var shelfSupportObj = null;
if (system.fileExists(shelfSupportPath)) {
    try { shelfSupportObj = OpenFurniture(shelfSupportPath); } catch (eS) {}
}

var Prop = Action.Properties;
Prop.Clear();

// [Группа 1: Габариты короба]
var grSize = Prop.NewGroup('1. Габариты короба (навесного шкафа)');

var pWidth = grSize.NewNumber('Ширина W, мм', 700);
pWidth.MinValue = 200;
pWidth.MaxValue = 1400;

var pDepth = grSize.NewNumber('Глубина D, мм', 500);
pDepth.MinValue = 200;
pDepth.MaxValue = 800;

var pHeight = grSize.NewNumber('Высота H, мм', 720);
pHeight.MinValue = 300;
pHeight.MaxValue = 1500;

var pThick = grSize.NewNumber('Толщина ЛДСП, мм', 16);
pThick.MinValue = 10;
pThick.MaxValue = 30;

// [Группа 2: Конструкция каркаса и полок]
var grConst = Prop.NewGroup('2. Конструкция каркаса');

var pTopBottomType = grConst.NewCombo('Дно и крышка', 
    'Вкладные между боковинами (стандарт навесных)\n' +
    'Накладные по высоте (боковины между дном и крышкой)'
);
pTopBottomType.ItemIndex = 0;

var pShelves = grConst.NewCombo('Полки съемные', '2 полки\n1 полка\n3 полки\nБез полок');
pShelves.ItemIndex = 0;
try { pShelves.Value = '2 полки'; } catch(e) {}

var pInstallShelfSupp = grConst.NewBool('Полкодержатели d5 под полки', true);

var pShelfRecess = grConst.NewNumber('Заглубление полок от переда, мм', 15);
pShelfRecess.MinValue = 0;
pShelfRecess.MaxValue = 50;

var pBackWall = grConst.NewCombo('Задняя стенка (ХДФ 4 мм)', 
    'Накладная сзади (отступ 2 мм от края)\n' +
    'Без задней стенки'
);
pBackWall.ItemIndex = 0;

// [Группа 3: Материалы и кромка]
var grMat = Prop.NewGroup('3. Материалы и кромка');
var pMatBody = grMat.NewMaterial('Материал корпуса (ЛДСП 16 мм)');
var pMatBack = grMat.NewMaterial('Материал задней стенки (ХДФ 4 мм)');
var pEdgeFront = grMat.NewButt('Кромка лицевая передняя (0.8 мм)');
var pEdgeBody = grMat.NewButt('Кромка корпусная (0.4 мм)');

// [Группа 4: Действия]
var grActions = Prop.NewGroup('4. Действия');
var btnBuild = grActions.NewButton('Сгенерировать короб');
var btnFinish = grActions.NewButton('Готово (сохранить)');

function buildCarcass() {
    DeleteNewObjects();

    pMatBody.SetActive();
    var thick = pThick.Value || ActiveMaterial.Thickness || 16;
    var W = pWidth.Value;
    var D = pDepth.Value;
    var H = pHeight.Value;

    var isInset = (pTopBottomType.ItemIndex === 0);
    var recess = pShelfRecess.Value;

    var boxBlock = BeginBlock('Короб верхнего модуля ' + W + 'x' + D + 'x' + H);

    // 1. Боковины
    var sideY1 = isInset ? 0 : thick;
    var sideY2 = isInset ? H : (H - thick);

    var levBok = AddVertPanel(0, sideY1, D, sideY2, 0);
    levBok.Name = 'Боковина левая';
    levBok.Thickness = thick;
    levBok.AddButt(pEdgeBody, 0);
    levBok.AddButt(pEdgeFront, 1);
    levBok.AddButt(pEdgeBody, 2);
    levBok.AddButt(pEdgeBody, 3);
    levBok.Build();

    var pravBok = AddVertPanel(0, sideY1, D, sideY2, W - thick);
    pravBok.Name = 'Боковина правая';
    pravBok.Thickness = thick;
    pravBok.AddButt(pEdgeBody, 0);
    pravBok.AddButt(pEdgeFront, 1);
    pravBok.AddButt(pEdgeBody, 2);
    pravBok.AddButt(pEdgeBody, 3);
    pravBok.Build();

    // 2. Дно и Крышка
    var horizX1 = isInset ? thick : 0;
    var horizX2 = isInset ? (W - thick) : W;

    var dno = AddHorizPanel(horizX1, 0, horizX2, D, 0);
    dno.Name = 'Дно';
    dno.Thickness = thick;
    dno.AddButt(pEdgeBody, 0);
    dno.AddButt(pEdgeFront, 1);
    dno.AddButt(pEdgeBody, 2);
    dno.AddButt(pEdgeBody, 3);
    dno.Build();

    var krishka = AddHorizPanel(horizX1, 0, horizX2, D, H - thick);
    krishka.Name = 'Крышка';
    krishka.Thickness = thick;
    krishka.AddButt(pEdgeBody, 0);
    krishka.AddButt(pEdgeFront, 1);
    krishka.AddButt(pEdgeBody, 2);
    krishka.AddButt(pEdgeBody, 3);
    krishka.Build();

    // 3. Задняя стенка
    if (pBackWall.ItemIndex === 0) {
        pMatBack.SetActive();
        var backWall = AddFrontPanel(2, 2, W - 2, H - 2, -4);
        backWall.Name = 'Задняя стенка (ХДФ)';
        backWall.Thickness = 4;
        backWall.Build();
    }

    // 4. Полки съемные
    var numShelves = 2;
    var shVal = pShelves.Value || '';
    if (pShelves.ItemIndex === 1 || shVal.indexOf('1') === 0) numShelves = 1;
    else if (pShelves.ItemIndex === 2 || shVal.indexOf('3') === 0) numShelves = 3;
    else if (pShelves.ItemIndex === 3 || shVal.indexOf('Без') === 0) numShelves = 0;

    if (numShelves > 0) {
        pMatBody.SetActive();
        var innerH = (H - thick) - thick;
        var shelfStep = innerH / (numShelves + 1);
        var shelfZ2 = D - recess;

        for (var s = 1; s <= numShelves; s++) {
            var shY = thick + s * shelfStep - thick / 2;
            var polka = AddHorizPanel(thick + 1, 0, W - thick - 1, shelfZ2, shY);
            polka.Name = 'Полка вкладная ' + s;
            polka.Thickness = thick;
            polka.AddButt(pEdgeBody, 1);
            polka.Build();

            if (pInstallShelfSupp.Value && shelfSupportObj) {
                var pY = polka.GabMin.y;
                var pZ1 = polka.GabMin.z + 64;
                var pZ2 = polka.GabMax.z - 40;
                if (pZ2 <= pZ1) {
                    pZ1 = polka.GabMin.z + 32;
                    pZ2 = polka.GabMax.z - 32;
                }
                try {
                    // В БАЗИС первый аргумент - горизонтальная полка, второй - вертикальная боковина
                    shelfSupportObj.Mount(polka, levBok, polka.GabMin.x, pY, pZ1);
                    shelfSupportObj.Mount(polka, pravBok, polka.GabMax.x, pY, pZ1);
                    shelfSupportObj.Mount(polka, levBok, polka.GabMin.x, pY, pZ2);
                    shelfSupportObj.Mount(polka, pravBok, polka.GabMax.x, pY, pZ2);
                } catch(eShM3) {}
            }
        }
    }

    EndBlock();

    ViewAll();
    SetCamera(p3dIsometric);
}

btnBuild.OnClick = function() {
    buildCarcass();
};

btnFinish.OnClick = function() {
    buildCarcass();
    Action.Commit();
    Action.Finish();
    alert('Короб верхнего модуля успешно сгенерирован!\n\n' +
          'Теперь вы можете расставить свои евровинты, навесы, настроить плоскости эластичности ' +
          'и сохранить как фрагмент "Верхняя база.fr3d".');
};

Prop.OnChange = function() {
    buildCarcass();
};

buildCarcass();
Action.Continue();
''';

# ==============================================================================
# SCRIPT 1: Быстрая расстановка верхних кухонных баз (ряд модулей).js
# ==============================================================================
SCRIPT1_CODE = r'''/**
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
''';

# ==============================================================================
# SCRIPT 2: Установка дверей на кухонные базы (распашные и подъемные).js
# ==============================================================================
SCRIPT2_CODE = r'''/**
 * =============================================================================
 * Установка дверей на кухонные базы (распашные и подъемные)
 * Для БАЗИС-Мебельщик (8, 9, 10, 11, 2021-2024)
 * 
 * Универсальный скрипт установки фасадов на любые модули (нижние и верхние базы):
 * - Вертикальные распашные (1 дверь левая/правая, 2 двери) с петлями к боковинам
 * - Горизонтальные подъемные (1 дверь вверх, 2 двери вверх) с петлями к крышке
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

            // Стойка
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

            // Горизонтальная панель (дно / крышка)
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
          'Найдено стоек: ' + activePosts.length);
    Action.Finish();
}

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

yTiers.sort(function(a, b) { return a.refY - b.refY; });

var detectedModules = [];

for (var t = 0; t < yTiers.length; t++) {
    var tierPosts = yTiers[t].posts;
    tierPosts.sort(function(a, b) { return a.minX - b.minX; });

    var pIdx = 0;
    while (pIdx < tierPosts.length - 1) {
        var p1 = tierPosts[pIdx];
        var p2 = tierPosts[pIdx + 1];
        var spanW = p2.maxX - p1.minX;

        if (spanW >= 200 && spanW <= 1400) {
            var modMinY = Math.min(p1.minY, p2.minY);
            var modMaxY = Math.max(p1.maxY, p2.maxY);
            var modMaxZ = Math.max(p1.maxZ, p2.maxZ);
            var isUpper = (modMinY >= 900);

            var foundBottom = null;
            var minBottomY = 999999;
            var foundTop = null;
            var maxTopY = -999999;

            for (var h = 0; h < allHoriz.length; h++) {
                var hp = allHoriz[h];
                if (hp.minX >= p1.minX - 10 && hp.maxX <= p2.maxX + 10) {
                    if (hp.minY >= modMinY - 30 && hp.minY <= modMinY + 100) {
                        if (hp.minY < minBottomY) {
                            minBottomY = hp.minY;
                            foundBottom = hp;
                        }
                    }
                    if (hp.maxY <= modMaxY + 30 && hp.maxY >= modMaxY - 100) {
                        if (hp.maxY > maxTopY) {
                            maxTopY = hp.maxY;
                            foundTop = hp;
                        }
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
                bottomTopY: foundBottom ? foundBottom.maxY : (modMinY + 16),
                topPanel: foundTop ? foundTop.obj : null,
                topBotY: foundTop ? foundTop.minY : (modMaxY - 16)
            });

            pIdx += 2;
        } else {
            pIdx += 1;
        }
    }
}

if (detectedModules.length === 0) {
    alert('Не удалось сопоставить пары стоек в модули.');
    Action.Finish();
}

var Prop = Action.Properties;
Prop.Clear();

var doorList = [
    '0. Без дверей (пропустить модуль)',
    '1. Вертикальная 1 дверь (распашная, петли слева)',
    '2. Вертикальная 1 дверь (распашная, петли справа)',
    '3. Вертикальные 2 двери (распашные: левая + правая)',
    '4. Горизонтальная 1 дверь (подъемная вверх)',
    '5. Горизонтальные 2 двери (подъемные вверх)'
];
var doorOptions = doorList.join('\n');

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

var grHinges = Prop.NewGroup('2. Настройки петель ("петля МОЯ")');
var pInstallHinges = grHinges.NewBool('Монтировать петли на двери', true);
var pHingeBottomOffset = grHinges.NewNumber('Отступ нижней петли от дна, мм', 70);
var pHingeTopOffset = grHinges.NewNumber('Отступ верхней петли от верха, мм', 100);

var grMods = Prop.NewGroup('3. Список найденных модулей (' + detectedModules.length + ' шт)');
var modControls = [];

for (var m = 0; m < detectedModules.length; m++) {
    var mod = detectedModules[m];
    var grMod = grMods.NewGroup(mod.label);

    var w = mod.maxX - mod.minX;
    var defIdx = (w <= 500) ? 1 : 3;

    var pDoorChoice = grMod.NewCombo('Выбор дверей', doorOptions);
    pDoorChoice.ItemIndex = defIdx;
    try { pDoorChoice.Value = doorList[defIdx]; } catch(e) {}

    var defHang = mod.isUpper ? pDefaultUpperHang.Value : 0;
    var pHang = grMod.NewNumber('Свес снизу для этого модуля, мм', defHang);
    pHang.MinValue = 0;
    pHang.MaxValue = 60;

    modControls.push({
        doorChoice: pDoorChoice,
        hangBottom: pHang
    });
}

var grActions = Prop.NewGroup('4. Действия');
var btnBuild = grActions.NewButton('Установить выбранные двери');
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

function buildDoors() {
    DeleteNewObjects();

    pMatDoor.SetActive();

    var gap = pDoorGap.Value;
    var midGap = pMidGap.Value;
    var doorThick = pDoorThick.Value;
    var installHinges = pInstallHinges.Value && (hingeObj !== null);

    var totalDoorsCreated = 0;

    var mainBlock = BeginBlock('Установленные фасады кухни (' + detectedModules.length + ' модулей)');

    for (var m = 0; m < detectedModules.length; m++) {
        var mod = detectedModules[m];
        var ctrl = modControls[m];
        var choice = getDoorChoice(ctrl.doorChoice);

        if (choice === 0) continue;

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
            doorsToMake.push({
                name: 'Фасад (петли слева)',
                x1: doorX1, x2: doorX2,
                y1: doorY1, y2: doorY2,
                post: mod.leftPost,
                side: 'left'
            });
        } else if (choice === 2) {
            doorsToMake.push({
                name: 'Фасад (петли справа)',
                x1: doorX1, x2: doorX2,
                y1: doorY1, y2: doorY2,
                post: mod.rightPost,
                side: 'right'
            });
        } else if (choice === 3) {
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
            doorsToMake.push({
                name: 'Фасад подъемный (вверх)',
                x1: doorX1, x2: doorX2,
                y1: doorY1, y2: doorY2,
                post: mod.topPanel,
                side: 'up'
            });
        } else if (choice === 5) {
            var hSingle = (totalH - midGap) / 2;
            doorsToMake.push({
                name: 'Фасад подъемный нижний',
                x1: doorX1, x2: doorX2,
                y1: doorY1, y2: doorY1 + hSingle,
                post: null,
                side: 'lower_lift'
            });
            doorsToMake.push({
                name: 'Фасад подъемный верхний',
                x1: doorX1, x2: doorX2,
                y1: doorY2 - hSingle, y2: doorY2,
                post: mod.topPanel,
                side: 'up'
            });
        }

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

            if (installHinges && dInfo.post) {
                if (dInfo.side === 'up') {
                    var mountY = mod.topBotY || (mod.maxY - 16);
                    var hX1 = mod.minX + mod.thickL + 70;
                    var hX2 = mod.maxX - mod.thickR - 70;
                    try {
                        hingeObj.Mount(dInfo.post, fPanel, hX1, mountY, doorZ);
                        hingeObj.Mount(dInfo.post, fPanel, hX2, mountY, doorZ);
                        if ((mod.maxX - mod.minX) > 900) {
                            var hXMid = (mod.minX + mod.maxX) / 2;
                            hingeObj.Mount(dInfo.post, fPanel, hXMid, mountY, doorZ);
                        }
                    } catch (eHngUp) {}
                } else {
                    var mountX = (dInfo.side === 'left') ? (mod.minX + mod.thickL) : (mod.maxX - mod.thickR);
                    var hYBot = mod.bottomTopY + pHingeBottomOffset.Value;
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

    EndBlock();

    ViewAll();
    SetCamera(p3dIsometric);
    return totalDoorsCreated;
}

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

buildDoors();
Action.Continue();
''';

# ==============================================================================
# Save files in CP1251 encoding to all target directories
# ==============================================================================
DEST_DIRS = [
    r'z:\Work\генерация мебели\scripts',
    r'C:\Users\maxim\OneDrive\Документы\Bazis\Scripts\Генерация мебели',
    r'C:\Users\maxim\OneDrive\Документы\Bazis\Scripts',
    r'C:\Users\maxim\OneDrive\Desktop\ПРОЕКТ_ШКАФ_И_БАЗИС\04_РАБОЧИЕ_СКРИПТЫ_БАЗИС'
]

FILES = [
    ('11_Быстрая расстановка верхних кухонных баз (ряд модулей).js', SCRIPT1_CODE),
    ('Быстрая расстановка верхних кухонных баз (ряд модулей).js', SCRIPT1_CODE),
    ('12_Установка дверей на кухонные базы (распашные и подъемные).js', SCRIPT2_CODE),
    ('Установка дверей на кухонные базы (распашные и подъемные).js', SCRIPT2_CODE),
    ('13_Генератор верхнего кухонного модуля (короб).js', SCRIPT3_CODE),
    ('Генератор верхнего кухонного модуля (короб).js', SCRIPT3_CODE),
]

for d in DEST_DIRS:
    if not os.path.exists(d):
        try:
            os.makedirs(d)
        except:
            pass
    for fname, code in FILES:
        path = os.path.join(d, fname)
        try:
            with open(path, 'w', encoding='cp1251') as f:
                f.write(code)
            print(f'Successfully wrote: {path} ({os.path.getsize(path)} bytes)')
        except Exception as e:
            print(f'Error writing {path}: {e}')

# Verify syntax
for fname, code in [
    ('11_Быстрая расстановка верхних кухонных баз (ряд модулей).js', SCRIPT1_CODE),
    ('12_Установка дверей на кухонные базы (распашные и подъемные).js', SCRIPT2_CODE),
    ('13_Генератор верхнего кухонного модуля (короб).js', SCRIPT3_CODE)
]:
    p = os.path.join(DEST_DIRS[0], fname)
    res = subprocess.run(['node', '--check', p], capture_output=True, text=True)
    if res.returncode == 0:
        print(f'Syntax check PASSED for: {fname}')
    else:
        print(f'Syntax ERROR in {fname}: {res.stderr}')
