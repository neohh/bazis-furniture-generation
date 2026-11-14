// ==============================================================================
// 15_Сборка шкафа по чертежу (Шкаф 2660x1000x450 + внутреннее наполнение)
// ==============================================================================

var thick = 16;
var targetW = 1000;
var targetH = 2660;
var targetD = 450;

// Границы для наполнения по умолчанию (под габариты 1000 x 2660 x 450)
var innerX1 = thick;
var innerX2 = targetW - thick;
var dnoTopY = 76;                       // цоколь 60 + ЛДСП 16
var roofBottomY = targetH - 65 - thick; // 2579 (под козырьком 65 мм)
var shelfD = targetD - 20;              // 430 мм (отступ 20 мм спереди под двери)
var shelfZ = 0;

// 1. Проверяем: выделен ли шкаф в модели?
var hasSelection = (Model.SelectionCount > 0);

if (hasSelection) {
    // Режим А: Вписать наполнение в УЖЕ выделенный в модели шкаф
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
    // Режим Б: Шкаф не выделен — строим готовый корпус 1000 x 2660 x 450
    // (цоколь 60 мм, козырек 65 мм, дно, крышка, боковины)
    BeginBlock('Шкаф по чертежу (2660x1000x450)');

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

    var roofY = targetH - 65 - thick;
    var roof = AddHorizPanel(thick, 0, targetW - thick, targetD, roofY);
    roof.Name = 'Крышка';
    roof.Thickness = thick;

    var visor = AddFrontPanel(thick, targetH - 65, targetW - thick, targetH, targetD - thick);
    visor.Name = 'Козырек';
    visor.Thickness = thick;

    innerX1 = thick;
    innerX2 = targetW - thick;
    dnoTopY = 76;
    roofBottomY = roofY;
    shelfD = targetD - 20;
    shelfZ = 0;
}

// 2. Внутреннее наполнение строго по чертежу
var mezzH = 450;        // Проем антресоли в свету (мм)
var rightNicheW = 600;  // Чистая ширина правой секции (мм)
var rightBotH = 1540;   // Чистая высота правой ниши под штангу (мм)
var leftBotH = 850;     // Чистая высота левой ниши под ящики (мм)

// Отметки
var mezzShelfY = roofBottomY - mezzH - thick;
var midPostX = innerX2 - rightNicheW - thick;

BeginBlock('Внутреннее наполнение');

// 1. Антресольная полка (на всю ширину шкафа, глубина 430 мм)
var mezzShelf = AddHorizPanel(innerX1, shelfZ, innerX2, shelfZ + shelfD, mezzShelfY);
mezzShelf.Name = 'Полка антресольная';
mezzShelf.Thickness = thick;

// 2. Стойка средняя (от дна до антресоли, глубина 430 мм)
var midPost = AddVertPanel(shelfZ, dnoTopY, shelfZ + shelfD, mezzShelfY, midPostX);
midPost.Name = 'Стойка средняя';
midPost.Thickness = thick;

// 3. Правая секция: полка над нишей 1540 мм (глубина 430 мм)
var rightShelfY = dnoTopY + rightBotH;
var rightShelf = AddHorizPanel(midPostX + thick, shelfZ, innerX2, shelfZ + shelfD, rightShelfY);
rightShelf.Name = 'Полка правая над штангой';
rightShelf.Thickness = thick;

// 4. Левая секция: полка над нишей 850 мм (глубина 430 мм)
var leftShelf1Y = dnoTopY + leftBotH;
var leftShelf1 = AddHorizPanel(innerX1, shelfZ, midPostX, shelfZ + shelfD, leftShelf1Y);
leftShelf1.Name = 'Полка левая над нишей';
leftShelf1.Thickness = thick;

// 5. Левая секция: 2 съемные полки с шагом ~401 мм (глубина 420 мм с отступом 10 мм)
var leftRemSpace = mezzShelfY - (leftShelf1Y + thick);
var shelfStep = (leftRemSpace - 2 * thick) / 3;

var leftShelf2Y = (leftShelf1Y + thick) + shelfStep;
var leftShelf2 = AddHorizPanel(innerX1, shelfZ, midPostX, shelfZ + shelfD - 10, leftShelf2Y);
leftShelf2.Name = 'Полка левая съемная 1';
leftShelf2.Thickness = thick;

var leftShelf3Y = (leftShelf2Y + thick) + shelfStep;
var leftShelf3 = AddHorizPanel(innerX1, shelfZ, midPostX, shelfZ + shelfD - 10, leftShelf3Y);
leftShelf3.Name = 'Полка левая съемная 2';
leftShelf3.Thickness = thick;

EndBlock();

if (!hasSelection) {
    EndBlock(); // закрываем общий блок шкафа
}

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
