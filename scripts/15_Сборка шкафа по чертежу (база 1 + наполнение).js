// ==============================================================================
// 15_Сборка шкафа по чертежу (Шкаф 2660x1000x450 + База с крепежом + наполнение)
// ==============================================================================

var thick = 16;
var targetW = 1000;
var targetH = 2660;
var targetD = 450;

// 1. Поиск фурнитуры (как в вашей Базе 1: Rafix/VB, евровинты, полкодержатели)
function getFurn(paths) {
    for (var i = 0; i < paths.length; i++) {
        var p = paths[i];
        try {
            if (system.fileExists(p)) {
                var f = OpenFurniture(p);
                if (f) return f;
            }
        } catch(e) {}
    }
    return null;
}

var rafixFurn = getFurn([
    'z:\\Work\\генерация мебели\\furn\\стяжка_rafix_16.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\стяжка_rafix_16.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Крепеж\\Hafele RAFIX 20.fr3d'
]);

var euroFurn = getFurn([
    'z:\\Work\\генерация мебели\\furn\\eurovint_7x50.f3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\eurovint_7x50.f3d',
    'Евровинт 7х50 (Артикул 69)'
]);

var shelfHolderFurn = getFurn([
    'z:\\Work\\генерация мебели\\furn\\полкодержатель_d5.f3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\полкодержатель_d5.f3d'
]);

// 2. Определение границ каркаса
var innerX1 = thick;
var innerX2 = targetW - thick;
var dnoTopY = 76;                       // цоколь 60 + ЛДСП 16
var roofBottomY = targetH - 65 - thick; // 2579 (крышка под козырьком 65 мм)
var shelfD = targetD - 20;              // 430 мм
var shelfZ = 0;

var hasSelection = (Model.SelectionCount > 0);

if (hasSelection) {
    // Вписать в уже выделенный пользователем шкаф
    var sel = Model.Selections[0];
    if (sel && sel.GSize && sel.GSize.y > 500) {
        innerX1 = sel.GabMin.x + thick;
        innerX2 = sel.GabMax.x - thick;
        shelfZ = sel.GabMin.z;
        shelfD = (sel.GSize.z > 100) ? (sel.GSize.z - 20) : (targetD - 20);
        dnoTopY = sel.GabMin.y + 60 + thick;
        roofBottomY = sel.GabMax.y - 65 - thick;
    }
} else {
    // Построение базы с козырьком и установкой крепежа
    BeginBlock('Шкаф база 1 (2660x1000x450)');

    var leftSide = AddVertPanel(0, 0, targetD, targetH, 0);
    leftSide.Name = 'Боковина левая';
    leftSide.Thickness = thick;

    var rightSide = AddVertPanel(0, 0, targetD, targetH, targetW - thick);
    rightSide.Name = 'Боковина правая';
    rightSide.Thickness = thick;

    var frontSocle = AddFrontPanel(thick, 0, targetW - thick, 60, targetD - thick);
    frontSocle.Name = 'Цоколь передний';
    frontSocle.Thickness = thick;

    var rearSocle = AddFrontPanel(thick, 0, targetW - thick, 60, 80);
    rearSocle.Name = 'Цоколь задний';
    rearSocle.Thickness = thick;

    var bottom = AddHorizPanel(thick, 0, targetW - thick, targetD, 60);
    bottom.Name = 'Дно';
    bottom.Thickness = thick;

    var roofY = targetH - 65 - thick; // 2579
    var roof = AddHorizPanel(thick, 0, targetW - thick, targetD, roofY);
    roof.Name = 'Крышка';
    roof.Thickness = thick;

    var visor = AddFrontPanel(thick, targetH - 65, targetW - thick, targetH, targetD - thick);
    visor.Name = 'Козырек';
    visor.Thickness = thick;

    // --- УСТАНОВКА КРЕПЕЖА БАЗЫ (точно как в вашей базе 1) ---
    // 1. Евровинты на цоколь
    if (euroFurn) {
        try {
            euroFurn.Mount(leftSide, frontSocle, 0, 30, targetD - thick / 2);
            euroFurn.Mount(rightSide, frontSocle, targetW, 30, targetD - thick / 2);
            euroFurn.Mount(leftSide, rearSocle, 0, 30, 80 + thick / 2);
            euroFurn.Mount(rightSide, rearSocle, targetW, 30, 80 + thick / 2);
        } catch(eEuro) {}
    }

    // 2. Стяжки Rafix (VB) на дно и крышку
    if (rafixFurn) {
        try {
            var z1 = 60;
            var z2 = targetD - 60;
            // Дно (снизу)
            rafixFurn.Mount(bottom, leftSide, 16, 60, z1);
            rafixFurn.Mount(bottom, leftSide, 16, 60, z2);
            rafixFurn.Mount(bottom, rightSide, targetW - 16, 60, z1);
            rafixFurn.Mount(bottom, rightSide, targetW - 16, 60, z2);

            // Крышка (снизу)
            rafixFurn.Mount(roof, leftSide, 16, roofY, z1);
            rafixFurn.Mount(roof, leftSide, 16, roofY, z2);
            rafixFurn.Mount(roof, rightSide, targetW - 16, roofY, z1);
            rafixFurn.Mount(roof, rightSide, targetW - 16, roofY, z2);
        } catch(eRafix) {}
    }

    EndBlock(); // Конец блока базы
}

// 3. Внутреннее наполнение строго по чертежу
var mezzH = 450;        // Проем антресоли в свету (мм)
var rightNicheW = 600;  // Чистая ширина правой секции (мм)
var rightBotH = 1540;   // Чистая высота правой ниши под штангу (мм)
var leftBotH = 850;     // Чистая высота левой ниши под ящики (мм)

var mezzShelfY = roofBottomY - mezzH - thick; // Y = 2113
var midPostX = innerX2 - rightNicheW - thick; // X = 368..384

BeginBlock('Внутреннее наполнение');

// 1. Антресольная полка (на всю ширину шкафа, глубина 430 мм)
var mezzShelf = AddHorizPanel(innerX1, shelfZ, innerX2, shelfZ + shelfD, mezzShelfY);
mezzShelf.Name = 'Полка антресольная';
mezzShelf.Thickness = thick;

// 2. Стойка средняя (от дна до антресоли, глубина 430 мм, высота 2037 мм)
var midPost = AddVertPanel(shelfZ, dnoTopY, shelfZ + shelfD, mezzShelfY, midPostX);
midPost.Name = 'Стойка средняя';
midPost.Thickness = thick;

// 3. Правая секция: полка над нишей 1540 мм (глубина 430 мм)
var rightShelfY = dnoTopY + rightBotH; // Y = 1616
var rightShelf = AddHorizPanel(midPostX + thick, shelfZ, innerX2, shelfZ + shelfD, rightShelfY);
rightShelf.Name = 'Полка правая над штангой';
rightShelf.Thickness = thick;

// 4. Левая секция: полка над нишей 850 мм (глубина 430 мм)
var leftShelf1Y = dnoTopY + leftBotH; // Y = 926
var leftShelf1 = AddHorizPanel(innerX1, shelfZ, midPostX, shelfZ + shelfD, leftShelf1Y);
leftShelf1.Name = 'Полка левая над нишей';
leftShelf1.Thickness = thick;

// 5. Левая секция: 2 съемные полки с равным шагом ~380 мм (глубина 420 мм)
var leftRemSpace = mezzShelfY - (leftShelf1Y + thick); // 2113 - 942 = 1171 мм
var shelfStep = (leftRemSpace - 2 * thick) / 3;        // ~379.7 мм

var leftShelf2Y = (leftShelf1Y + thick) + shelfStep;
var leftShelf2 = AddHorizPanel(innerX1, shelfZ, midPostX, shelfZ + shelfD - 10, leftShelf2Y);
leftShelf2.Name = 'Полка левая съемная 1';
leftShelf2.Thickness = thick;

var leftShelf3Y = (leftShelf2Y + thick) + shelfStep;
var leftShelf3 = AddHorizPanel(innerX1, shelfZ, midPostX, shelfZ + shelfD - 10, leftShelf3Y);
leftShelf3.Name = 'Полка левая съемная 2';
leftShelf3.Thickness = thick;

// Крепеж полок (полкодержатели D5 для съемных полок)
if (shelfHolderFurn) {
    try {
        var shZ1 = shelfZ + 50;
        var shZ2 = shelfZ + shelfD - 60;
        // Полка 1
        shelfHolderFurn.Mount(leftShelf2, null, innerX1, leftShelf2Y, shZ1);
        shelfHolderFurn.Mount(leftShelf2, null, innerX1, leftShelf2Y, shZ2);
        shelfHolderFurn.Mount(leftShelf2, null, midPostX, leftShelf2Y, shZ1);
        shelfHolderFurn.Mount(leftShelf2, null, midPostX, leftShelf2Y, shZ2);
        // Полка 2
        shelfHolderFurn.Mount(leftShelf3, null, innerX1, leftShelf3Y, shZ1);
        shelfHolderFurn.Mount(leftShelf3, null, innerX1, leftShelf3Y, shZ2);
        shelfHolderFurn.Mount(leftShelf3, null, midPostX, leftShelf3Y, shZ1);
        shelfHolderFurn.Mount(leftShelf3, null, midPostX, leftShelf3Y, shZ2);
    } catch(eSh) {}
}

EndBlock(); // Конец блока внутреннего наполнения

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
