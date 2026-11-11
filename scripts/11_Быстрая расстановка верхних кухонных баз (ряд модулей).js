/**
 * =============================================================================
 * Быстрая расстановка верхних кухонных баз (ряд навесных модулей)
 * Для БАЗИС-Мебельщик (8, 9, 10, 11, 2021-2024)
 * 
 * Назначение:
 * Быстрая генерация и параметрическая расстановка ряда верхних (навесных)
 * кухонных баз / шкафов с опциями дверей, петель и полок.
 * 
 * Параметры по умолчанию:
 * - Глубина корпусов D: 500 мм (настраивается: 300, 350, 400, 500 мм и т.д.)
 * - Ширина модулей W: 700 мм (индивидуально для каждого модуля в ряду)
 * - Высота корпусов H: 720 мм (настраивается: 600, 720, 800, 920 мм и т.д.)
 * - Высота навески над полом: 1450 мм (настраивается: 1400, 1450, 1500 мм)
 * 
 * Варианты дверей для каждого модуля:
 * 1. Без дверей (открытый модуль с полками)
 * 2. Вертикальная 1 дверь (распашная, петли слева)
 * 3. Вертикальная 1 дверь (распашная, петли справа)
 * 4. Вертикальные 2 двери (распашные: левая + правая)
 * 5. Горизонтальная 1 дверь (подъемная вверх на весь проем)
 * 6. Горизонтальные 2 двери (подъемные вверх, нижняя + верхняя)
 * 
 * Фурнитура:
 * - Кастомные петли "петля МОЯ" (привязка строго 70 мм от дна, 100 мм от верха)
 * - Полкодержатели d5
 * - Евровинты 7х50 для сборки корпуса
 * =============================================================================
 */

// -----------------------------------------------------------------------------
// 1. Поиск фурнитуры и крепежа
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

var CONFIRMAT_PATHS = [
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\евровинт_7х50.f3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\confirmat_7x50.f3d',
    'z:\\Work\\генерация мебели\\furn\\евровинт_7х50.f3d',
    'z:\\Work\\генерация мебели\\furn\\confirmat_7x50.f3d'
];

var SHELF_SUPPORT_PATHS = [
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\полкодержатель_d5.f3d',
    'z:\\Work\\генерация мебели\\furn\\полкодержатель_d5.f3d'
];

var hingePath = findFirstExistingFile(HINGE_PATHS);
var confirmatPath = findFirstExistingFile(CONFIRMAT_PATHS);
var shelfSupportPath = findFirstExistingFile(SHELF_SUPPORT_PATHS);

var hingeObj = null;
if (system.fileExists(hingePath)) {
    try { hingeObj = OpenFurniture(hingePath); } catch (eH) {}
}

var confirmatObj = null;
if (system.fileExists(confirmatPath)) {
    try { confirmatObj = OpenFurniture(confirmatPath); } catch (eC) {}
}

var shelfSupportObj = null;
if (system.fileExists(shelfSupportPath)) {
    try { shelfSupportObj = OpenFurniture(shelfSupportPath); } catch (eS) {}
}

// -----------------------------------------------------------------------------
// 2. Инициализация панели свойств Action.Properties
// -----------------------------------------------------------------------------
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

    var pSlotShelves = grSlot.NewCombo('Количество полок', '2 полки\n1 полка\n3 полки\nБез полок');
    pSlotShelves.ItemIndex = 0; // 2 полки по умолчанию

    var pSlotDoor = grSlot.NewCombo('Выбор дверей', doorOptions);
    // Предустановка: База 1 = 2 двери, База 2 = 2 двери, База 3 = 1 подъемная
    if (b < 2) pSlotDoor.ItemIndex = 3; // 2 двери
    else if (b === 2) pSlotDoor.ItemIndex = 4; // 1 горизонтальная вверх
    else pSlotDoor.ItemIndex = 3;

    baseSlots.push({
        group: grSlot,
        width: pSlotW,
        depth: pSlotD,
        height: pSlotH,
        shelves: pSlotShelves,
        door: pSlotDoor
    });
}

// [Группа 3: Настройки фасадов и петель]
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

// [Группа 4: Крепеж корпуса]
var grHardware = Prop.NewGroup('4. Крепеж и задняя стенка');
var pMountEuro = grHardware.NewBool('Евровинты 7х50 сборки корпуса', true);
var pMountShelfSupp = grHardware.NewBool('Полкодержатели d5 под полки', true);
var pBackWall = grHardware.NewCombo('Задняя стенка', 'ХДФ 4 мм накладная сзади\nБез задней стенки');
pBackWall.ItemIndex = 0;

// [Группа 5: Материалы и кромка]
var grMat = Prop.NewGroup('5. Материалы и кромка');
var pMatBody = grMat.NewMaterial('Материал корпуса (ЛДСП 16 мм)');
var pMatDoor = grMat.NewMaterial('Материал фасадов (МДФ / Фасадный ЛДСП)');
var pMatBack = grMat.NewMaterial('Материал задней стенки (ХДФ 4 мм)');
var pEdgeFront = grMat.NewButt('Кромка лицевая (0.8 мм)');
var pEdgeBody = grMat.NewButt('Кромка корпусная (0.4 мм)');

// [Группа 6: Действия]
var grActions = Prop.NewGroup('6. Действия');
var btnBuild = grActions.NewButton('Сгенерировать верхний ряд');
var btnFinish = grActions.NewButton('Готово (сохранить)');

// -----------------------------------------------------------------------------
// 3. Основная функция генерации ряда верхних баз
// -----------------------------------------------------------------------------
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

    var isEuro = pMountEuro.Value;
    var isShelfSupp = pMountShelfSupp.Value;
    var hasBackWall = (pBackWall.ItemIndex === 0);
    var installHinges = pInstallHinges.Value && (hingeObj !== null);

    // Управление видимостью слотов
    for (var s = 0; s < MAX_BASES; s++) {
        baseSlots[s].group.Visible = (s < num);
    }

    // Определение толщины корпуса
    pMatBody.SetActive();
    var thick = ActiveMaterial.Thickness;
    if (!thick || thick <= 0) thick = 16;

    var curX = startX;

    // Главный блок всего верхнего ряда
    var rowBlock = BeginBlock('Ряд верхних баз (' + num + ' модулей)');

    for (var i = 0; i < num; i++) {
        var bNum = i + 1;
        var slot = baseSlots[i];

        var modW = slot.width.Value || defW;
        var modD = (slot.depth.Value > 0) ? slot.depth.Value : defD;
        var modH = (slot.height.Value > 0) ? slot.height.Value : defH;
        var doorChoice = slot.door.ItemIndex;

        // Блок отдельной базы
        var modBlock = BeginBlock('Верхняя база ' + bNum + ' (' + modW + 'x' + modD + 'x' + modH + ')');

        pMatBody.SetActive();

        var xL = curX;
        var xR = curX + modW;
        var yB = startY;
        var yT = startY + modH;
        var zBack = startZ;
        var zFront = startZ + modD;

        // 1. Боковины (левая и правая накладные по высоте)
        // AddVertPanel(z1, y1, z2, y2, x)
        var levBok = AddVertPanel(zBack, yB, zFront, yT, xL);
        levBok.Name = 'Боковина левая';
        levBok.AddButt(pEdgeBody, 0);  // низ
        levBok.AddButt(pEdgeFront, 1); // перед
        levBok.AddButt(pEdgeBody, 2);  // верх
        levBok.AddButt(pEdgeBody, 3);  // зад
        levBok.Build();

        var pravBok = AddVertPanel(zBack, yB, zFront, yT, xR - thick);
        pravBok.Name = 'Боковина правая';
        pravBok.AddButt(pEdgeBody, 0);
        pravBok.AddButt(pEdgeFront, 1);
        pravBok.AddButt(pEdgeBody, 2);
        pravBok.AddButt(pEdgeBody, 3);
        pravBok.Build();

        // 2. Дно и Крышка (вкладные между боковинами)
        // AddHorizPanel(x1, z1, x2, z2, y)
        var dno = AddHorizPanel(xL + thick, zBack, xR - thick, zFront, yB);
        dno.Name = 'Дно';
        dno.AddButt(pEdgeBody, 0);  // левый
        dno.AddButt(pEdgeFront, 1); // передний
        dno.AddButt(pEdgeBody, 2);  // правый
        dno.AddButt(pEdgeBody, 3);  // задний
        dno.Build();

        var krishka = AddHorizPanel(xL + thick, zBack, xR - thick, zFront, yT - thick);
        krishka.Name = 'Крышка';
        krishka.AddButt(pEdgeBody, 0);
        krishka.AddButt(pEdgeFront, 1);
        krishka.AddButt(pEdgeBody, 2);
        krishka.AddButt(pEdgeBody, 3);
        krishka.Build();

        // 3. Евровинты каркаса (по 2 на дно и крышку с каждой стороны)
        if (isEuro && confirmatObj) {
            var zConfFront = zFront - 50;
            var zConfBack = zBack + 50;
            var yDnoConf = yB + thick / 2;
            var yKriConf = yT - thick / 2;

            try {
                // Дно
                confirmatObj.Mount(levBok, dno, xL, yDnoConf, zConfFront);
                confirmatObj.Mount(levBok, dno, xL, yDnoConf, zConfBack);
                confirmatObj.Mount(pravBok, dno, xR, yDnoConf, zConfFront);
                confirmatObj.Mount(pravBok, dno, xR, yDnoConf, zConfBack);
                // Крышка
                confirmatObj.Mount(levBok, krishka, xL, yKriConf, zConfFront);
                confirmatObj.Mount(levBok, krishka, xL, yKriConf, zConfBack);
                confirmatObj.Mount(pravBok, krishka, xR, yKriConf, zConfFront);
                confirmatObj.Mount(pravBok, krishka, xR, yKriConf, zConfBack);
            } catch (eCnf) {}
        }

        // 4. Задняя стенка (ХДФ 4 мм)
        if (hasBackWall) {
            pMatBack.SetActive();
            // AddFrontPanel(x1, y1, x2, y2, z)
            var backWall = AddFrontPanel(xL + 2, yB + 2, xR - 2, yT - 2, zBack - 4);
            backWall.Name = 'Задняя стенка (ХДФ)';
            backWall.Thickness = 4;
            backWall.Build();
        }

        // 5. Полки вкладные
        var numShelves = 2;
        if (slot.shelves.ItemIndex === 1) numShelves = 1;
        else if (slot.shelves.ItemIndex === 2) numShelves = 3;
        else if (slot.shelves.ItemIndex === 3) numShelves = 0;

        if (numShelves > 0) {
            pMatBody.SetActive();
            var innerH = (yT - thick) - (yB + thick);
            var shelfStep = innerH / (numShelves + 1);
            var shelfZFront = zFront - 15; // отступ 15 мм от фасада

            for (var sh = 1; sh <= numShelves; sh++) {
                var shY = yB + thick + sh * shelfStep - thick / 2;
                var polka = AddHorizPanel(xL + thick + 1, zBack, xR - thick - 1, shelfZFront, shY);
                polka.Name = 'Полка вкладная ' + sh;
                polka.AddButt(pEdgeBody, 1); // передний торец
                polka.Build();

                // Полкодержатели (по 4 шт на полку)
                if (isShelfSupp && shelfSupportObj) {
                    var shZ1 = zBack + 50;
                    var shZ2 = shelfZFront - 50;
                    try {
                        shelfSupportObj.Mount(levBok, polka, xL + thick, shY, shZ1);
                        shelfSupportObj.Mount(levBok, polka, xL + thick, shY, shZ2);
                        shelfSupportObj.Mount(pravBok, polka, xR - thick, shY, shZ1);
                        shelfSupportObj.Mount(pravBok, polka, xR - thick, shY, shZ2);
                    } catch (eSh) {}
                }
            }
        }

        // 6. Двери и фасады (если выбраны)
        if (doorChoice > 0) {
            pMatDoor.SetActive();

            var doorX1 = xL + gap;
            var doorX2 = xR - gap;
            var doorY1 = yB - bottomHang; // свес снизу для захвата рукой
            var doorY2 = yT - gap;
            var doorZ = zFront;

            var totalW = doorX2 - doorX1;
            var totalH = doorY2 - doorY1;

            var doorsToCreate = [];

            if (doorChoice === 1) {
                // 1 вертикальная дверь (петли слева)
                doorsToCreate.push({
                    name: 'Фасад (петли слева)',
                    x1: doorX1, x2: doorX2,
                    y1: doorY1, y2: doorY2,
                    post: levBok,
                    side: 'left'
                });
            } else if (doorChoice === 2) {
                // 1 вертикальная дверь (петли справа)
                doorsToCreate.push({
                    name: 'Фасад (петли справа)',
                    x1: doorX1, x2: doorX2,
                    y1: doorY1, y2: doorY2,
                    post: pravBok,
                    side: 'right'
                });
            } else if (doorChoice === 3) {
                // 2 вертикальные двери (левая + правая)
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
                // 1 горизонтальная дверь (вверх)
                doorsToCreate.push({
                    name: 'Фасад подъемный',
                    x1: doorX1, x2: doorX2,
                    y1: doorY1, y2: doorY2,
                    post: null,
                    side: 'up'
                });
            } else if (doorChoice === 5) {
                // 2 горизонтальные двери (нижняя + верхняя)
                var hSingle = (totalH - midGap) / 2;
                doorsToCreate.push({
                    name: 'Фасад подъемный нижний',
                    x1: doorX1, x2: doorX2,
                    y1: doorY1, y2: doorY1 + hSingle,
                    post: null,
                    side: 'up'
                });
                doorsToCreate.push({
                    name: 'Фасад подъемный верхний',
                    x1: doorX1, x2: doorX2,
                    y1: doorY2 - hSingle, y2: doorY2,
                    post: null,
                    side: 'up'
                });
            }

            // Создание фасадов и установка петель
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

                // Монтаж петель "петля МОЯ" для распашных дверей
                if (installHinges && dInfo.post) {
                    var mountX = (dInfo.side === 'left') ? (xL + thick) : (xR - thick);
                    // Строго 70 мм от верхней пласти дна
                    var hYBot = yB + thick + pHingeBottomOffset.Value;
                    // 100 мм от верхнего края двери
                    var hYTop = dInfo.y2 - pHingeTopOffset.Value;

                    if (hYTop <= hYBot) hYTop = hYBot + 100;

                    try {
                        hingeObj.Mount(dInfo.post, fPanel, mountX, hYBot, doorZ);
                        hingeObj.Mount(dInfo.post, fPanel, mountX, hYTop, doorZ);

                        // 3-я петля при высоте более 900 мм
                        if ((dInfo.y2 - dInfo.y1) > 900) {
                            var hYMid = (hYBot + hYTop) / 2;
                            hingeObj.Mount(dInfo.post, fPanel, mountX, hYMid, doorZ);
                        }
                    } catch (eHng) {}
                }
            }
        }

        EndBlock(); // Конец блока модуля

        curX += modW; // Смещение к следующей базе
    }

    EndBlock(); // Конец главного блока ряда

    ViewAll();
    SetCamera(p3dIsometric);
}

// Привязка действий
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

// Первый автоматический запуск
buildUpperRow();
Action.Continue();
