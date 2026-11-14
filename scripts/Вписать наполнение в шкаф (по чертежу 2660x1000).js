// ==============================================================================
// Вписать наполнение шкафа (по чертежу: H=2660, W=1000, секции 352 / 600)
// Для БАЗИС-Мебельщик
// ==============================================================================

var thick = 16;

// 1. Определение габаритов базового шкафа
var leftX = 0;
var rightX = 1000;
var dnoTopY = 76;       // Верх пласти дна (цоколь 60 + ЛДСП 16)
var roofBottomY = 2644; // Низ пласти крышки (H=2660 - 16)
var shelfD = 430;       // Глубина полок (с отступом 20 мм под фасады/купе)
var shelfZ = 0;         // Начало от задней стенки

// Если в Базисе выделен шкаф — считываем его реальные габариты и положение
if (Model.SelectionCount > 0) {
    var sel = Model.Selections[0];
    if (sel) {
        leftX = sel.GabMin.x;
        rightX = sel.GabMax.x;
        if (sel.GSize.z > 100) {
            shelfD = sel.GSize.z - 20;
            shelfZ = sel.GabMin.z;
        }
        // Если выделенный блок имеет дно и крышку
        if (sel.GSize.y > 1000) {
            dnoTopY = sel.GabMin.y + 60 + thick;
            roofBottomY = sel.GabMax.y - thick;
        }
    }
}

var innerLeft = leftX + thick;
var innerRight = rightX - thick;

// 2. Параметры наполнения строго по чертежу пользователя:
var mezzH = 450;        // Проем антресоли в свету (мм)
var rightNicheW = 600;  // Чистая ширина правой секции (мм)
var rightBotH = 1540;   // Чистая высота правой платяной ниши (мм)
var leftBotH = 850;     // Чистая высота левой ниши под ящики (мм)

// 3. Вычисление отметок деталей:
// Антресольная полка (на всю ширину шкафа)
var mezzShelfY = roofBottomY - mezzH - thick; // Y = 2178

// Средняя стойка: правая секция 600 мм в свету
var midPostX = innerRight - rightNicheW - thick; // X = 368..384
var leftNicheW = midPostX - innerLeft;           // 352 мм

// Группа наполнения
BeginBlock('Внутреннее наполнение');

// 1. Антресольная полка (жесткая)
var mezzShelf = AddHorizPanel(innerLeft, shelfZ, innerRight, shelfZ + shelfD, mezzShelfY);
mezzShelf.Name = 'Полка антресольная';
mezzShelf.Thickness = thick;

// 2. Средняя стойка (от дна до антресоли)
var midPost = AddVertPanel(shelfZ, dnoTopY, shelfZ + shelfD, mezzShelfY, midPostX);
midPost.Name = 'Стойка средняя';
midPost.Thickness = thick;

// 3. Правая секция (W = 600 мм):
// Полка над штангой (жесткая, высота ниши 1540 мм)
var rightShelfY = dnoTopY + rightBotH; // Y = 1616
var rightShelf = AddHorizPanel(midPostX + thick, shelfZ, innerRight, shelfZ + shelfD, rightShelfY);
rightShelf.Name = 'Полка правая над штангой';
rightShelf.Thickness = thick;

// 4. Левая секция (W = 352 мм):
// Полка над нижней нишей 850 мм (жесткая)
var leftShelf1Y = dnoTopY + leftBotH; // Y = 926
var leftShelf1 = AddHorizPanel(innerLeft, shelfZ, midPostX, shelfZ + shelfD, leftShelf1Y);
leftShelf1.Name = 'Полка левая над нишей';
leftShelf1.Thickness = thick;

// Оставшееся пространство до антресоли: делим 2 съемными полками на 3 равных проема
var leftRemSpace = mezzShelfY - (leftShelf1Y + thick); // 2178 - 942 = 1236 мм
var shelfStep = (leftRemSpace - 2 * thick) / 3;        // 401.3 мм

// Полка съемная 1
var leftShelf2Y = (leftShelf1Y + thick) + shelfStep;
var leftShelf2 = AddHorizPanel(innerLeft, shelfZ, midPostX, shelfZ + shelfD - 10, leftShelf2Y);
leftShelf2.Name = 'Полка левая съемная 1';
leftShelf2.Thickness = thick;

// Полка съемная 2
var leftShelf3Y = (leftShelf2Y + thick) + shelfStep;
var leftShelf3 = AddHorizPanel(innerLeft, shelfZ, midPostX, shelfZ + shelfD - 10, leftShelf3Y);
leftShelf3.Name = 'Полка левая съемная 2';
leftShelf3.Thickness = thick;

EndBlock();

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
