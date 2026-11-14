// ==============================================================================
// 17_Два_прилегающих_шкафа_с_вырезом_под_счетчики.js
// Комплекс из двух прилегающих шкафов: общий габарит 2080 x 2660 x 620 мм
//
// 1. Шкаф 1 (левый): 880 x 2660 x 620 мм, ЛДСП 26 мм
//    - Высокое дно: чистый проем снизу ровно 600 мм
//    - Построен с идеальной точностью из панелей 26 мм (без щелей и нахлестов)
//    - Задняя стенка ЛДСП 26 мм: встроена в проем встык
//    - Штанга овальная 30х15 на высоте 2500 мм
//
// 2. Шкаф 2 (правый): 1200 x 2660 x 600 мм, ЛДСП 16 мм
//    - Корпус: берет проверенный эластичный "шкаф базовый.fr3d" (или точный аналог),
//      растягивает эластичностью до 1200 x 2660 x 600 мм
//    - Правая боковина сплошная (без выреза под счетчик)
//    - Задняя стенка: ЛДСП 16 мм с отступом 50 мм от задней стены (Z = 50..66 мм)
//    - Полки (4 шт.): глубина 534 мм (Z = 66..600 мм), примыкают к пласти задней стенки
//    - Высоты ниш в свету:
//      * Нижняя ниша: 650 мм от дна (Y = 726 мм)
//      * Верхняя ниша (антресоль): 700 мм от крышки (Y = 1928 мм)
//      * 2 промежуточные полки с равным шагом ~385 мм (Y = 1127 мм и Y = 1528 мм)
// ==============================================================================

// 1. Точка привязки
var basePt = null;
try {
    Action.Hint = 'Укажите точку привязки комплекса (левый нижний угол) или Enter для (0,0,0)';
    basePt = GetPoint('Укажите точку привязки комплекса (Enter для 0,0,0):');
} catch(ePt) {}

if (!basePt || isNaN(basePt.x)) {
    basePt = NewVector(0, 0, 0);
}

// 2. Поиск файлов фрагментов и фурнитуры
function findFile(paths) {
    for (var i = 0; i < paths.length; i++) {
        try {
            if (system.fileExists(paths[i])) return paths[i];
        } catch(e) {}
    }
    return '';
}

function getFurn(paths) {
    for (var i = 0; i < paths.length; i++) {
        try {
            if (system.fileExists(paths[i])) {
                var f = OpenFurniture(paths[i]);
                if (f) return f;
            }
        } catch(e) {}
    }
    return null;
}

var fragPath2 = findFile([
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Шкафы\\шкаф базовый.fr3d',
    'z:\\Work\\генерация мебели\\Фрагменты\\Шкафы\\шкаф базовый.fr3d',
    'C:\\Users\\maxim\\Downloads\\шкаф базовый.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Шкафы\\шкаф база 1.fr3d',
    'Z:\\Work\\генерация мебели\\Фрагменты\\Шкафы\\шкаф база 1.fr3d'
]);

var rafixFurn = getFurn([
    'z:\\Work\\генерация мебели\\furn\\стяжка_rafix_16.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\05_ФУРНИТУРА_И_НОЖКИ_ДЛЯ_КУХНИ\\Петли_и_крепеж\\стяжка_rafix_16.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Крепеж\\Hafele RAFIX 20.fr3d'
]);

var euroFurn = getFurn([
    'z:\\Work\\генерация мебели\\furn\\евровинт_7x50.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Крепеж\\Евровинт 7х50.fr3d'
]);

var rodFurn = getFurn([
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Наполнение\\Штанга овальная.fr3d',
    'Z:\\Work\\генерация мебели\\furn\\штанга_овальная.fr3d'
]);

// Поиск эластичного блока
function findResizeBlock(obj) {
    if (!obj) return null;
    if (obj.ElasticResize) return obj;
    if (obj.Count) {
        for (var i = 0; i < obj.Count; i++) {
            var child = obj.Objects ? obj.Objects[i] : obj[i];
            var found = findResizeBlock(child);
            if (found) return found;
        }
    }
    return null;
}

// 3. Панель свойств (Action.Properties)
var Prop = null;
try {
    Prop = Action.Properties;
    Prop.Clear();
} catch(ePr) {}

var pBuildMode = null;
var pDirX = null;
var pDirZ = null;

if (Prop) {
    var grPos = Prop.NewGroup('1. Состав комплекса и привязка');
    pBuildMode = grPos.NewCombo('Что строить',
        '1. Оба шкафа (комплекс 2080 мм)\n' +
        '2. Только Шкаф 1 (ЛДСП 26 мм, 880 мм)\n' +
        '3. Только Шкаф 2 (ЛДСП 16 мм, 1200 мм)'
    );
    pBuildMode.ItemIndex = 0;

    pDirX = grPos.NewCombo('Направление по X', 'Вправо (+)\nВлево (-)');
    pDirX.ItemIndex = 0;

    pDirZ = grPos.NewCombo('Направление по Z', 'Вперед к зрителю (+)\nНазад (-)');
    pDirZ.ItemIndex = 0;
}

// 4. Основная функция построения
function buildComplex() {
    var bMode = pBuildMode ? pBuildMode.ItemIndex : 0;
    var signX = (pDirX && pDirX.ItemIndex === 1) ? -1 : 1;
    var signZ = (pDirZ && pDirZ.ItemIndex === 1) ? -1 : 1;

    var baseX = basePt.x;
    var baseY = basePt.y;
    var baseZ = basePt.z;

    var totalBlock = BeginBlock('Комплекс 2080 (ЛДСП 26 мм + 16 мм)');

    // ==========================================================================
    // ШКАФ 1: Левый шкаф (ЛДСП 26 мм, 880 x 2660 x 620 мм)
    // Высокое дно: чистый проем снизу 600 мм
    // ==========================================================================
    if (bMode === 0 || bMode === 1) {
        var W1 = 880;
        var H1 = 2660;
        var D1 = 620;
        var t26 = 26;

        var c1_xMin = (signX > 0) ? baseX : (baseX - W1);
        var c1_xMax = (signX > 0) ? (baseX + W1) : baseX;

        var c1_zMin = (signZ > 0) ? baseZ : (baseZ - D1);
        var c1_zMax = (signZ > 0) ? (baseZ + D1) : baseZ;

        var y0 = baseY;
        var yTop = baseY + H1;

        BeginBlock('Шкаф 1 (ЛДСП 26 мм, 880x2660x620)');

        ActiveMaterial.Make('ЛДСП 26 мм', t26);

        // 1. Левая боковина (26 мм): от xMin до xMin + 26
        var s1_left = AddVertPanel(c1_zMin, y0, c1_zMax, yTop, c1_xMin);
        s1_left.Name = 'Боковина левая (26 мм)';

        // 2. Правая боковина (26 мм): от xMax - 26 до xMax
        var s1_right = AddVertPanel(c1_zMin, y0, c1_zMax, yTop, c1_xMax - t26);
        s1_right.Name = 'Боковина правая (26 мм)';

        // Внутренний проем между боковинами
        var innerX1 = c1_xMin + t26;
        var innerX2 = c1_xMax - t26;

        // 3. Крышка (26 мм): лежит строго между боковинами, заподлицо сверху
        var roofY = yTop - t26;
        var s1_roof = AddHorizPanel(innerX1, c1_zMin, innerX2, c1_zMax, roofY);
        s1_roof.Name = 'Крышка (26 мм)';

        // 4. Дно высокое (26 мм): чистый проем снизу ровно 600 мм
        var dnoY = y0 + 600;
        var s1_dno = AddHorizPanel(innerX1, c1_zMin, innerX2, c1_zMax, dnoY);
        s1_dno.Name = 'Дно высокое (26 мм, проем 600 мм)';

        // 5. Задняя стенка ЛДСП: стоит на дне (y = dnoY + 26), упирается в крышку (y = roofY),
        //    встроена встык между боковинами (innerX1..innerX2)
        var backY1 = dnoY + t26;
        var backY2 = roofY;
        var s1_back = AddFrontPanel(innerX1, backY1, innerX2, backY2, c1_zMin);
        s1_back.Name = 'Задняя стенка ЛДСП 26 мм';

        // 6. Штанга овальная 30х15
        var rodY = y0 + 2500;
        var rodZ = (c1_zMin + c1_zMax) / 2;
        if (rodFurn) {
            try {
                rodFurn.Mount(s1_left, s1_right, innerX1, rodY, rodZ);
            } catch(eRod) {}
        }

        // Крепеж крышки и дна (евровинты / стяжки)
        if (euroFurn) {
            try {
                euroFurn.Mount(s1_dno, s1_left, innerX1, dnoY + 13, c1_zMin + 80);
                euroFurn.Mount(s1_dno, s1_left, innerX1, dnoY + 13, c1_zMax - 80);
                euroFurn.Mount(s1_dno, s1_right, innerX2, dnoY + 13, c1_zMin + 80);
                euroFurn.Mount(s1_dno, s1_right, innerX2, dnoY + 13, c1_zMax - 80);

                euroFurn.Mount(s1_roof, s1_left, innerX1, roofY + 13, c1_zMin + 80);
                euroFurn.Mount(s1_roof, s1_left, innerX1, roofY + 13, c1_zMax - 80);
                euroFurn.Mount(s1_roof, s1_right, innerX2, roofY + 13, c1_zMin + 80);
                euroFurn.Mount(s1_roof, s1_right, innerX2, roofY + 13, c1_zMax - 80);
            } catch(eEu1) {}
        }

        EndBlock();
    }

    // ==========================================================================
    // ШКАФ 2: Правый шкаф (ЛДСП 16 мм, 1200 x 2660 x 600 мм, цоколь 60 мм)
    // Использует проверенный "шкаф базовый.fr3d" через эластичность!
    // ==========================================================================
    if (bMode === 0 || bMode === 2) {
        var W2 = 1200;
        var H2 = 2660;
        var D2 = 600;
        var t16 = 16;

        var offsetX = (bMode === 0) ? (signX > 0 ? 880 : -880) : 0;
        var c2_startX = baseX + offsetX;

        var c2_xMin = (signX > 0) ? c2_startX : (c2_startX - W2);
        var c2_xMax = (signX > 0) ? (c2_startX + W2) : c2_startX;

        var c2_zMin = (signZ > 0) ? baseZ : (baseZ - D2);
        var c2_zMax = (signZ > 0) ? (baseZ + D2) : baseZ;

        var c2_y0 = baseY;
        var c2_yTop = baseY + H2;

        BeginBlock('Шкаф 2 (ЛДСП 16 мм, 1200x2660x600)');

        var loadedBase = false;
        var cab2 = AddBlock('Базовый корпус шкафа 2');

        if (fragPath2 !== '') {
            try {
                loadedBase = cab2.Load(fragPath2);
            } catch(eL2) {
                loadedBase = false;
            }
        }

        if (loadedBase) {
            var rObj = findResizeBlock(cab2);
            if (rObj) {
                try {
                    rObj.ElasticResize(NewVector(W2, H2, D2));
                    rObj.Build();
                } catch(eR2) {}
            }
            cab2.Position = NewVector(c2_xMin, c2_y0, c2_zMin);
            cab2.Build();
        } else {
            // Резервное построение корпуса шкафа 2
            ActiveMaterial.Make('ЛДСП 16 мм', t16);

            var s2_left = AddVertPanel(c2_zMin, c2_y0, c2_zMax, c2_yTop, c2_xMin);
            s2_left.Name = 'Боковина левая';

            var s2_right = AddVertPanel(c2_zMin, c2_y0, c2_zMax, c2_yTop, c2_xMax - t16);
            s2_right.Name = 'Боковина правая (сплошная)';

            var socleFrontZ = (signZ > 0) ? (c2_zMax - 25 - t16) : (c2_zMin + 25);
            var s2_socleFront = AddFrontPanel(c2_xMin + t16, c2_y0, c2_xMax - t16, c2_y0 + 60, socleFrontZ);
            s2_socleFront.Name = 'Цоколь передний H=60';

            var socleRearZ = (signZ > 0) ? (c2_zMin + 80) : (c2_zMax - 80 - t16);
            var s2_socleRear = AddFrontPanel(c2_xMin + t16, c2_y0, c2_xMax - t16, c2_y0 + 60, socleRearZ);
            s2_socleRear.Name = 'Цоколь задний H=60';

            var s2_bottom = AddHorizPanel(c2_xMin + t16, c2_zMin, c2_xMax - t16, c2_zMax, c2_y0 + 60);
            s2_bottom.Name = 'Дно';

            var s2_roof = AddHorizPanel(c2_xMin + t16, c2_zMin, c2_xMax - t16, c2_zMax, c2_yTop - t16);
            s2_roof.Name = 'Крышка';
        }

        // Внутреннее наполнение Шкафа 2
        ActiveMaterial.Make('ЛДСП 16 мм', t16);

        var c2_innerX1 = c2_xMin + t16;
        var c2_innerX2 = c2_xMax - t16;
        var dnoTopY = c2_y0 + 60 + t16;    // верх дна = 76 мм от пола
        var roofBotY = c2_yTop - t16;        // низ крышки = 2644 мм от пола

        // 1. Задняя стенка ЛДСП 16 мм с отступом 50 мм от задней стены
        var backZ1 = (signZ > 0) ? (c2_zMin + 50) : (c2_zMax - 50 - t16);
        var backWall2 = AddFrontPanel(c2_innerX1, dnoTopY, c2_innerX2, roofBotY, backZ1);
        backWall2.Name = 'Задняя стенка ЛДСП 16 мм (отступ 50 мм)';

        // 2. Полки: глубина 534 мм от передней пласти задней стенки (Z = 66 мм) до передней кромки (Z = 600 мм)
        //    Полки НЕ проходят сквозь заднюю стенку!
        var shelfZ1 = (signZ > 0) ? (c2_zMin + 50 + t16) : c2_zMin;
        var shelfZ2 = (signZ > 0) ? c2_zMax : (c2_zMax - 50 - t16);

        // Высоты полок в свету:
        // Полка 1 (силовая): чистая ниша 650 мм от дна
        var yShelf1 = dnoTopY + 650; // baseY + 726 мм

        // Полка 4 (силовая): чистая ниша 700 мм от крышки
        var yShelf4 = roofBotY - 700 - t16; // baseY + 1928 мм

        // Полки 2 и 3: равный шаг между полками 1 и 4 (~385 мм в свету)
        var spaceMid = yShelf4 - (yShelf1 + t16); // 1186 мм
        var stepMid = (spaceMid - 2 * t16) / 3;   // ~385 мм
        var yShelf2 = yShelf1 + t16 + stepMid;    // baseY + 1127 мм
        var yShelf3 = yShelf2 + t16 + stepMid;    // baseY + 1528 мм

        var sh1 = AddHorizPanel(c2_innerX1, shelfZ1, c2_innerX2, shelfZ2, yShelf1);
        sh1.Name = 'Полка 1 силовая (ниша 650 мм от дна)';

        var sh2 = AddHorizPanel(c2_innerX1, shelfZ1, c2_innerX2, shelfZ2, yShelf2);
        sh2.Name = 'Полка 2 съемная (ниша 385 мм)';

        var sh3 = AddHorizPanel(c2_innerX1, shelfZ1, c2_innerX2, shelfZ2, yShelf3);
        sh3.Name = 'Полка 3 съемная (ниша 385 мм)';

        var sh4 = AddHorizPanel(c2_innerX1, shelfZ1, c2_innerX2, shelfZ2, yShelf4);
        sh4.Name = 'Полка 4 силовая (антресоль 700 мм от верха)';

        // Монтаж стяжек Rafix на полки шкафа 2
        if (rafixFurn) {
            try {
                var midZ = (shelfZ1 + shelfZ2) / 2;
                rafixFurn.Mount(sh1, null, c2_innerX1, yShelf1, midZ);
                rafixFurn.Mount(sh1, null, c2_innerX2, yShelf1, midZ);
                rafixFurn.Mount(sh4, null, c2_innerX1, yShelf4, midZ);
                rafixFurn.Mount(sh4, null, c2_innerX2, yShelf4, midZ);
            } catch(eRf2) {}
        }

        EndBlock();
    }

    EndBlock();

    try {
        Action.Commit();
    } catch(eC) {}

    try {
        ViewAll();
        SetCamera(p3dIsometric);
    } catch(eV) {}
}

// Запуск построения
buildComplex();

// Обработка изменений в панели свойств
if (Prop) {
    Prop.OnChange = function() {
        buildComplex();
    };
}
