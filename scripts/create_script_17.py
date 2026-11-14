# -*- coding: utf-8 -*-
import os

script_content = r'''// ==============================================================================
// 17_Два_прилегающих_шкафа_с_вырезом_под_счетчики.js
// Комплекс из двух шкафов общей шириной 2080 мм, высотой 2660 мм:
//   - Шкаф 1 (Левый): 880 x 2660 x 620 мм из ЛДСП 26 мм, высокое дно 600 мм, штанга
//   - Шкаф 2 (Правый): 1200 x 2660 x 600 мм из ЛДСП 16 мм, цоколь 60 мм,
//     ниша 650 мм от дна, 3 ниши по 385 мм, ниша 700 мм от верха,
//     вырез под счетчики (Y=1250..1430, H=180 мм) в правой боковине,
//     отступ полок сзади 50 мм под трубы/проводку.
// С интерактивным выбором точки привязки (GetPoint) и live-настройками в 3D.
// ==============================================================================

// 1. Поиск фурнитуры в базе
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
    'z:\\Work\\генерация мебели\\Фурнитура\\Стяжки эксцентриковые\\Rafix.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Крепеж\\Rafix.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Крепеж\\Стяжка эксцентриковая.f3d'
]);

var euroFurn = getFurn([
    'z:\\Work\\генерация мебели\\Фурнитура\\Евровинты\\Евровинт 7х50.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Крепеж\\Евровинт.f3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Крепеж\\Евровинт.f3d'
]);

// 2. Интерактивный выбор точки привязки
var basePt = GetPoint('Укажите точку привязки левого нижнего угла комплекса (X, Y, Z):');
if (!basePt) {
    basePt = NewVector(0, 0, 0);
}

// 3. Создание панели свойств (Action.Properties)
var grPos = Prop.NewGroup('1. Привязка и состав комплекса');
var pBuildMode = grPos.NewCombo('Что строить', 
    '1. Оба шкафа (комплекс 2080 мм)\n' +
    '2. Только Шкаф 1 (ЛДСП 26 мм, 880 мм)\n' +
    '3. Только Шкаф 2 (ЛДСП 16 мм, 1200 мм)'
);
pBuildMode.ItemIndex = 0;

var pDirX = grPos.NewCombo('Направление по X', 
    'Слева направо (+X)\n' +
    'Справа налево (-X)'
);
pDirX.ItemIndex = 0;

var pDirZ = grPos.NewCombo('Направление глубины (Z)', 
    'От стены вперед (+Z)\n' +
    'К стене назад (-Z)'
);
pDirZ.ItemIndex = 0;

var grShkaf2 = Prop.NewGroup('2. Параметры Шкафа 2 (1200 мм)');
var pDivider = grShkaf2.NewCombo('Конструкция полок Шкафа 2',
    'Цельные полки 1200 мм (по эскизу)\n' +
    'С перегородкой (2 секции по 576 мм)'
);
pDivider.ItemIndex = 0;

var pDoors = grShkaf2.NewCombo('Фасады Шкафа 2',
    'Без фасадов (каркас и полки)\n' +
    'Установить распашные фасады 16 мм'
);
pDoors.ItemIndex = 1;

var pCutoutD = grShkaf2.NewNumber('Глубина выреза счетчиков (мм)', 320);

var grActions = Prop.NewGroup('3. Завершение');
var btnFinish = grActions.NewButton('Зафиксировать построение');

// 4. Основная функция построения
function buildComposition() {
    DeleteNewObjects();

    var mode = pBuildMode.ItemIndex;
    var signX = (pDirX.ItemIndex === 0) ? 1 : -1;
    var signZ = (pDirZ.ItemIndex === 0) ? 1 : -1;

    var H = 2660;
    var W1 = 880;
    var D1 = 620;
    var W2 = 1200;
    var D2 = 600;

    var baseX = basePt.x;
    var baseY = basePt.y;
    var baseZ = basePt.z;

    BeginBlock('Комплекс шкафов 2080 мм');

    // -------------------------------------------------------------------------
    // ПОСТРОЕНИЕ ШКАФА 1 (Левый, ЛДСП 26 мм, W=880, D=620, высокое дно 600 мм)
    // -------------------------------------------------------------------------
    if (mode === 0 || mode === 1) {
        ActiveMaterial.Make('ЛДСП 26 мм', 26);
        var t26 = 26;
        var block1 = BeginBlock('Шкаф 1 (ЛДСП 26 мм, 880x2660x620)');

        var c1_xMin, c1_xMax, c1_zMin, c1_zMax;
        if (signX > 0) {
            c1_xMin = baseX;
            c1_xMax = baseX + W1;
        } else {
            c1_xMin = baseX - W1;
            c1_xMax = baseX;
        }

        if (signZ > 0) {
            c1_zMin = baseZ;
            c1_zMax = baseZ + D1;
        } else {
            c1_zMin = baseZ - D1;
            c1_zMax = baseZ;
        }

        var y0 = baseY;
        var yTop = baseY + H;

        // Левая боковина (26 мм)
        var s1_left = AddVertPanel(c1_xMin, y0, c1_zMin, c1_xMin + t26, yTop, c1_zMax);
        s1_left.Name = 'Боковина левая (26 мм)';

        // Правая боковина (26 мм)
        var s1_right = AddVertPanel(c1_xMax - t26, y0, c1_zMin, c1_xMax, yTop, c1_zMax);
        s1_right.Name = 'Боковина правая (26 мм)';

        // Верхняя крышка (26 мм)
        var s1_roof = AddHorizPanel(c1_xMin + t26, c1_zMin, c1_xMax - t26, c1_zMax, yTop - t26);
        s1_roof.Name = 'Крышка (26 мм)';

        // Высокое дно (26 мм, поднято на 600 мм от пола в свету)
        var yDno1 = y0 + 600;
        var s1_bottom = AddHorizPanel(c1_xMin + t26, c1_zMin, c1_xMax - t26, c1_zMax, yDno1);
        s1_bottom.Name = 'Дно высокое (26 мм, проем 600)';

        // Задняя стенка ЛДСП (внутренняя, закрывает нишу над дном)
        ActiveMaterial.Make('ЛДСП 16 мм', 16);
        var s1_back = AddFrontPanel(c1_xMin + t26, yDno1 + t26, c1_xMax - t26, yTop - t26, (signZ > 0) ? (c1_zMin + 2) : (c1_zMax - 18));
        s1_back.Name = 'Задняя стенка ЛДСП';

        // Штанга овальная под вешалки (Y = 2500 мм)
        ActiveMaterial.Make('Труба хромированная', 25);
        var yRod = y0 + 2500;
        var midZ1 = (c1_zMin + c1_zMax) / 2;
        var rod = AddExtrusion('Штанга овальная');
        var rodLine = AddLine3D(c1_xMin + t26, yRod, midZ1, c1_xMax - t26, yRod, midZ1);
        rodLine.Color = 0xc2185b;

        // Монтаж стяжек Rafix на дно и крышку
        if (rafixFurn) {
            try {
                var midZ = (c1_zMin + c1_zMax) / 2;
                rafixFurn.Mount(s1_bottom, s1_left, c1_xMin + t26, yDno1, midZ);
                rafixFurn.Mount(s1_bottom, s1_right, c1_xMax - t26, yDno1, midZ);
                rafixFurn.Mount(s1_roof, s1_left, c1_xMin + t26, yTop - t26, midZ);
                rafixFurn.Mount(s1_roof, s1_right, c1_xMax - t26, yTop - t26, midZ);
            } catch(eR1) {}
        }

        EndBlock();
    }

    // -------------------------------------------------------------------------
    // ПОСТРОЕНИЕ ШКАФА 2 (Правый, ЛДСП 16 мм, W=1200, D=600, цоколь 60 мм)
    // -------------------------------------------------------------------------
    if (mode === 0 || mode === 2) {
        ActiveMaterial.Make('ЛДСП 16 мм', 16);
        var t16 = 16;
        var block2 = BeginBlock('Шкаф 2 (ЛДСП 16 мм, 1200x2660x600)');

        // Смещение X для Шкафа 2: если строятся оба шкафа, он прилегает к Шкафу 1
        var c2_startX = baseX;
        if (mode === 0) {
            c2_startX = (signX > 0) ? (baseX + W1) : (baseX - W1);
        }

        var c2_xMin, c2_xMax, c2_zMin, c2_zMax;
        if (signX > 0) {
            c2_xMin = c2_startX;
            c2_xMax = c2_startX + W2;
        } else {
            c2_xMin = c2_startX - W2;
            c2_xMax = c2_startX;
        }

        if (signZ > 0) {
            c2_zMin = baseZ;
            c2_zMax = baseZ + D2;
        } else {
            c2_zMin = baseZ - D2;
            c2_zMax = baseZ;
        }

        var y0 = baseY;
        var yTop = baseY + H;

        // Отступ полок сзади 50 мм под трубы/проводку
        // Внутренние полки глубиной 550 мм
        var shelf_zMin, shelf_zMax;
        if (signZ > 0) {
            shelf_zMin = c2_zMin + 50; // от стены 50 мм
            shelf_zMax = c2_zMax;
        } else {
            shelf_zMin = c2_zMin;
            shelf_zMax = c2_zMax - 50;
        }

        // 1. Боковины (идут на полную глубину 600 мм до стены)
        var s2_left = AddVertPanel(c2_xMin, y0, c2_zMin, c2_xMin + t16, yTop, c2_zMax);
        s2_left.Name = 'Боковина левая';

        var s2_right = AddVertPanel(c2_xMax - t16, y0, c2_zMin, c2_xMax, yTop, c2_zMax);
        s2_right.Name = 'Боковина правая (с вырезом под счетчики)';

        // Вырез под счетчики в правой боковине: Y = 1250..1430, H = 180 мм
        var yCutBottom = y0 + 1250;
        var yCutTop = y0 + 1430;
        var cutDepth = pCutoutD.Value;
        if (cutDepth < 50) cutDepth = 320;

        // Маркер выреза под счетчики в блоке
        var cutMarker = AddBlock('Вырез под счетчики (180x' + cutDepth + ' мм)');
        var cutZ1, cutZ2;
        if (signZ > 0) {
            cutZ1 = c2_zMin + 50;
            cutZ2 = cutZ1 + cutDepth;
        } else {
            cutZ2 = c2_zMax - 50;
            cutZ1 = cutZ2 - cutDepth;
        }
        var cutBox = AddBox(c2_xMax - t16 - 2, yCutBottom, cutZ1, c2_xMax + 2, yCutTop, cutZ2);
        cutBox.Color = 0xd32f2f;
        cutBox.Name = 'Окно выреза под счетчики (180x' + cutDepth + ' мм)';

        // 2. Цоколь H = 60 мм (утоплен спереди на 25 мм)
        var zSocle;
        if (signZ > 0) {
            zSocle = c2_zMax - 25 - t16;
        } else {
            zSocle = c2_zMin + 25;
        }
        var socle = AddFrontPanel(c2_xMin + t16, y0, c2_xMax - t16, y0 + 60, zSocle);
        socle.Name = 'Цоколь H=60';

        // Дно шкафа (на высоте Y = 60..76 мм, глубина 550 мм с отступом 50 сзади)
        var yDno2 = y0 + 60;
        var s2_bottom = AddHorizPanel(c2_xMin + t16, shelf_zMin, c2_xMax - t16, shelf_zMax, yDno2);
        s2_bottom.Name = 'Дно';

        // Крышка верхняя (глубина 550 мм)
        var s2_roof = AddHorizPanel(c2_xMin + t16, shelf_zMin, c2_xMax - t16, shelf_zMax, yTop - t16);
        s2_roof.Name = 'Крышка';

        // 3. Раскладка полок по чертежу
        // Полка 1: от дна 650 мм в свету -> Y = yDno2 + 16 + 650 = y0 + 726 мм
        var yShelf1 = yDno2 + t16 + 650;
        // Полка 4 (антресольная): 700 мм в свету от верха -> Y = (yTop - 16) - 700 - 16 = y0 + 1928 мм
        var yShelf4 = (yTop - t16) - 700 - t16;
        // 2 промежуточные полки (3 равные ниши по 385 мм)
        var spaceMid = yShelf4 - (yShelf1 + t16); // 1928 - 742 = 1186 мм
        var nicheMid = (spaceMid - 2 * t16) / 3;  // 384.67 -> 385 мм
        var yShelf2 = yShelf1 + t16 + nicheMid;   // ~1127 мм
        var yShelf3 = yShelf2 + t16 + nicheMid;   // ~1528 мм

        var shelvesY = [
            { y: yShelf1, name: 'Полка 1 силовая (ниша 650 от дна)', isFixed: true },
            { y: yShelf2, name: 'Полка 2 съемная (ниша 385)', isFixed: false },
            { y: yShelf3, name: 'Полка 3 съемная (ниша 385, над вырезом)', isFixed: false },
            { y: yShelf4, name: 'Полка 4 силовая (ниша 700 от верха)', isFixed: true }
        ];

        var hasDivider = (pDivider.ItemIndex === 1);
        var dividerX = (c2_xMin + c2_xMax) / 2;

        if (hasDivider) {
            // Вертикальная перегородка между Полкой 1 и Полкой 4
            var divider = AddVertPanel(dividerX - t16/2, yShelf1 + t16, shelf_zMin, dividerX + t16/2, yShelf4, shelf_zMax);
            divider.Name = 'Перегородка вертикальная';
        }

        for (var si = 0; si < shelvesY.length; si++) {
            var sh = shelvesY[si];
            var shY = Math.round(sh.y);

            if (hasDivider && !sh.isFixed) {
                // Две секции полок: левая и правая
                var shLeft = AddHorizPanel(c2_xMin + t16, shelf_zMin, dividerX - t16/2, shelf_zMax, shY);
                shLeft.Name = sh.name + ' (левая)';
                var shRight = AddHorizPanel(dividerX + t16/2, shelf_zMin, c2_xMax - t16, shelf_zMax, shY);
                shRight.Name = sh.name + ' (правая)';
            } else {
                // Цельная полка во всю ширину
                var shPan = AddHorizPanel(c2_xMin + t16, shelf_zMin, c2_xMax - t16, shelf_zMax, shY);
                shPan.Name = sh.name;

                // Монтаж крепежа
                if (sh.isFixed && rafixFurn) {
                    try {
                        var midZ2 = (shelf_zMin + shelf_zMax) / 2;
                        rafixFurn.Mount(shPan, s2_left, c2_xMin + t16, shY, midZ2);
                        rafixFurn.Mount(shPan, s2_right, c2_xMax - t16, shY, midZ2);
                    } catch(eRf) {}
                }
            }
        }

        // Монтаж крепежа на дно и крышку
        if (rafixFurn) {
            try {
                var midZ2 = (shelf_zMin + shelf_zMax) / 2;
                rafixFurn.Mount(s2_bottom, s2_left, c2_xMin + t16, yDno2, midZ2);
                rafixFurn.Mount(s2_bottom, s2_right, c2_xMax - t16, yDno2, midZ2);
                rafixFurn.Mount(s2_roof, s2_left, c2_xMin + t16, yTop - t16, midZ2);
                rafixFurn.Mount(s2_roof, s2_right, c2_xMax - t16, yTop - t16, midZ2);
            } catch(eR2) {}
        }

        // Монтаж евровинтов на цоколь
        if (euroFurn) {
            try {
                euroFurn.Mount(socle, s2_left, c2_xMin + t16, y0 + 30, zSocle);
                euroFurn.Mount(socle, s2_right, c2_xMax - t16, y0 + 30, zSocle);
            } catch(eE2) {}
        }

        // 4. Опциональная установка фасадов
        if (pDoors.ItemIndex === 1) {
            ActiveMaterial.Make('Фасад ЛДСП 16 мм', 16);
            var zDoor = (signZ > 0) ? (c2_zMax + 2) : (c2_zMin - 18);
            var doorMidX = (c2_xMin + c2_xMax) / 2;

            // Нижние основные двери (высота от цоколя до антресольной полки: yDno2..yShelf4)
            var doorMainL = AddFrontPanel(c2_xMin + 2, yDno2 + 2, doorMidX - 1, yShelf4 + t16 - 2, zDoor);
            doorMainL.Name = 'Фасад основной левый';
            var doorMainR = AddFrontPanel(doorMidX + 1, yDno2 + 2, c2_xMax - 2, yShelf4 + t16 - 2, zDoor);
            doorMainR.Name = 'Фасад основной правый';

            // Верхние антресольные двери
            var doorTopL = AddFrontPanel(c2_xMin + 2, yShelf4 + t16 + 2, doorMidX - 1, yTop - 2, zDoor);
            doorTopL.Name = 'Фасад антресоли левый';
            var doorTopR = AddFrontPanel(doorMidX + 1, yShelf4 + t16 + 2, c2_xMax - 2, yTop - 2, zDoor);
            doorTopR.Name = 'Фасад антресоли правый';
        }

        EndBlock();
    }

    EndBlock();
}

// 5. Обработчики событий live-preview
Prop.OnChange = function() {
    buildComposition();
};

btnFinish.OnClick = function() {
    Action.Finish();
};

// Первичное построение при запуске
buildComposition();
Action.Continue();
'''

target_path = r"z:\Work\генерация мебели\scripts\17_Два_прилегающих_шкафа_с_вырезом_под_счетчики.js"
with open(target_path, 'w', encoding='cp1251', errors='replace') as f:
    f.write(script_content)

print(f"Script 17 successfully created: {target_path} ({len(script_content)} bytes)")
