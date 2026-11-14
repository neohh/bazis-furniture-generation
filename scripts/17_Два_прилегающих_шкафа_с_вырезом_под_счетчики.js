// ==============================================================================
// 17_Два_прилегающих_шкафа_с_вырезом_под_счетчики.js
// По проверенному алгоритму Скрипта 15:
// 1. Берет готовую базу "шкаф высокое дно без цоколя", растягивает эластичностью
//    до 880 x 2660 x 620 (ЛДСП 26 мм) + штанга
// 2. Берет готовую базу "шкаф база 1", растягивает эластичностью
//    до 1200 x 2660 x 600 (ЛДСП 16 мм, цоколь 60 мм)
// 3. Встраивает заднюю стенку ЛДСП 16 мм с отступом 50 мм от стены
// 4. Устанавливает полки: ниша 650 мм от дна, 3 ниши по 385 мм, ниша 700 мм от верха,
//    полки примыкают к задней стенке и НЕ проходят сквозь нее
// 5. Вырез под счетчики (Y=1250..1430, H=180 мм) в правой боковине
// ==============================================================================

// 1. Точка привязки
var basePt = null;
try {
    basePt = GetPoint('Укажите точку привязки комплекса (левый нижний угол) или Enter для (0,0,0):');
} catch(e) {}

if (!basePt) {
    basePt = NewVector(0, 0, 0);
}

var baseX = basePt.x;
var baseY = basePt.y;
var baseZ = basePt.z;

// 2. Поиск файлов фрагментов баз
function findFile(paths) {
    for (var i = 0; i < paths.length; i++) {
        try {
            if (system.fileExists(paths[i])) return paths[i];
        } catch(e) {}
    }
    return '';
}

var fragPath1 = findFile([
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Шкафы\\шкаф высокое дно без цоколя.fr3d',
    'Z:\\Work\\генерация мебели\\Фрагменты\\Шкафы\\шкаф высокое дно без цоколя.fr3d'
]);

var fragPath2 = findFile([
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Шкафы\\шкаф база 1.fr3d',
    'Z:\\Work\\генерация мебели\\Фрагменты\\Шкафы\\шкаф база 1.fr3d'
]);

// Рекурсивный поиск эластичного блока
function findResizeBlock(obj) {
    if (!obj) return null;
    if (typeof obj.ElasticResize === 'function') {
        var isEl = false;
        try {
            isEl = (typeof obj.IsElastic === 'function') ? obj.IsElastic() : !!obj.IsElastic;
        } catch(e) {}
        if (isEl) return obj;
    }
    if (obj.Count) {
        for (var c = 0; c < obj.Count; c++) {
            var child = obj.Objects ? obj.Objects[c] : obj[c];
            var f = findResizeBlock(child);
            if (f) return f;
        }
    }
    if (typeof obj.ElasticResize === 'function' && obj.Name && obj.Name.indexOf('Рамка') === -1) {
        return obj;
    }
    return null;
}

// ------------------------------------------------------------------------------
// ШКАФ 1: Левый модуль (ЛДСП 26 мм, 880 x 2660 x 620, высокое дно 600 мм)
// ------------------------------------------------------------------------------
var W1 = 880;
var H1 = 2660;
var D1 = 620;

var cab1 = AddBlock('Шкаф 1 (ЛДСП 26 мм, высокое дно)');
var loaded1 = false;
if (fragPath1 !== '') {
    try {
        loaded1 = cab1.Load(fragPath1);
    } catch(eL1) {
        loaded1 = false;
    }
}

if (loaded1) {
    var el1 = findResizeBlock(cab1);
    if (el1) {
        try {
            el1.ElasticResize(NewVector(W1, H1, D1));
            el1.Build();
        } catch(eR1) {}
    }
    cab1.Position = NewVector(baseX, baseY, baseZ);
    cab1.Build();

    // Задаем толщину 26 мм деталям каркаса
    function applyThick26(obj) {
        if (!obj) return;
        if (obj.AsPanel) {
            obj.AsPanel.Thickness = 26;
            obj.AsPanel.MaterialName = 'ЛДСП 26 мм';
        }
        if (obj.Count) {
            for (var c = 0; c < obj.Count; c++) {
                applyThick26(obj.Objects ? obj.Objects[c] : obj[c]);
            }
        }
    }
    applyThick26(cab1);
    cab1.Build();
} else {
    // Резервное построение короба 1 из 26 мм
    ActiveMaterial.Make('ЛДСП 26 мм', 26);
    var s1_left = AddVertPanel(baseX, baseY, baseZ, baseX + 26, baseY + H1, baseZ + D1);
    s1_left.Name = 'Боковина левая (26 мм)';
    var s1_right = AddVertPanel(baseX + W1 - 26, baseY, baseZ, baseX + W1, baseY + H1, baseZ + D1);
    s1_right.Name = 'Боковина правая (26 мм)';
    var s1_roof = AddHorizPanel(baseX + 26, baseZ, baseX + W1 - 26, baseZ + D1, baseY + H1 - 26);
    s1_roof.Name = 'Крышка (26 мм)';
    var s1_dno = AddHorizPanel(baseX + 26, baseZ, baseX + W1 - 26, baseZ + D1, baseY + 600);
    s1_dno.Name = 'Дно высокое (26 мм, проем 600)';
}

// Задняя стенка Шкафа 1 из ЛДСП
ActiveMaterial.Make('ЛДСП 26 мм', 26);
var backWall1 = AddFrontPanel(baseX + 26, baseY + 626, baseX + W1 - 26, baseY + H1 - 26, baseZ + 2);
backWall1.Name = 'Задняя стенка ЛДСП';

// ------------------------------------------------------------------------------
// ШКАФ 2: Правый шкаф (ЛДСП 16 мм, 1200 x 2660 x 600, цоколь 60 мм)
// ------------------------------------------------------------------------------
var W2 = 1200;
var H2 = 2660;
var D2 = 600;

var cab2 = AddBlock('Шкаф 2 (ЛДСП 16 мм, 1200x2660x600)');
var loaded2 = false;
if (fragPath2 !== '') {
    try {
        loaded2 = cab2.Load(fragPath2);
    } catch(eL2) {
        loaded2 = false;
    }
}

if (loaded2) {
    var el2 = findResizeBlock(cab2);
    if (el2) {
        try {
            el2.ElasticResize(NewVector(W2, H2, D2));
            el2.Build();
        } catch(eR2) {}
    }
    // Ставим шкаф 2 вплотную к шкафу 1
    cab2.Position = NewVector(baseX + W1, baseY, baseZ);
    cab2.Build();
} else {
    // Резервное построение базы 2, если файл не найден
    ActiveMaterial.Make('ЛДСП 16 мм', 16);
    var c2_x0 = baseX + W1;
    var s2_left = AddVertPanel(c2_x0, baseY, baseZ, c2_x0 + 16, baseY + H2, baseZ + D2);
    s2_left.Name = 'Боковина левая';
    var s2_right = AddVertPanel(c2_x0 + W2 - 16, baseY, baseZ, c2_x0 + W2, baseY + H2, baseZ + D2);
    s2_right.Name = 'Боковина правая';
    var s2_socle = AddFrontPanel(c2_x0 + 16, baseY, c2_x0 + W2 - 16, baseY + 60, baseZ + D2 - 25 - 16);
    s2_socle.Name = 'Цоколь H=60';
    var s2_bottom = AddHorizPanel(c2_x0 + 16, baseZ + 66, c2_x0 + W2 - 16, baseZ + D2, baseY + 60);
    s2_bottom.Name = 'Дно';
    var s2_roof = AddHorizPanel(c2_x0 + 16, baseZ + 66, c2_x0 + W2 - 16, baseZ + D2, baseY + H2 - 16);
    s2_roof.Name = 'Крышка';
}

// ------------------------------------------------------------------------------
// НАПОЛНЕНИЕ ШКАФА 2 (Задняя стенка ЛДСП 16 мм + полки без прохода сквозь нее)
// ------------------------------------------------------------------------------
ActiveMaterial.Make('ЛДСП 16 мм', 16);

var c2_innerX1 = baseX + W1 + 16;
var c2_innerX2 = baseX + W1 + W2 - 16;
var dnoTopY = baseY + 60 + 16;     // верх дна = 76 мм от пола
var roofBotY = baseY + H2 - 16;     // низ крышки = 2644 мм от пола

// 1. Отступ 50 мм от стены, задняя стенка ЛДСП 16 мм (на Z = baseZ + 50..66)
var backZ1 = baseZ + 50;
var backZ2 = baseZ + 50 + 16; // 66 мм
var backWall2 = AddFrontPanel(c2_innerX1, dnoTopY, c2_innerX2, roofBotY, backZ1);
backWall2.Name = 'Задняя стенка ЛДСП 16 мм (отступ 50 мм)';

// 2. Полки начинаются СТРОГО от передней пласти задней стенки (Z = 66)
//    и идут до передней кромки (Z = 600). Глубина полок = 534 мм.
//    Полки НЕ проходят сквозь заднюю стенку!
var shelfZ1 = backZ2;         // 66 мм
var shelfZ2 = baseZ + D2;     // 600 мм

// 3. Расчет уровней полок
// Полка 1: ниша 650 мм от дна в свету
var yShelf1 = dnoTopY + 650; // baseY + 726

// Полка 4: ниша 700 мм от верха в свету
var yShelf4 = roofBotY - 700 - 16; // baseY + 1928

// 2 промежуточные полки (3 равные ниши по 385 мм)
var spaceMid = yShelf4 - (yShelf1 + 16); // 1186 мм
var stepMid = (spaceMid - 2 * 16) / 3;   // ~385 мм
var yShelf2 = yShelf1 + 16 + stepMid;    // baseY + 1127
var yShelf3 = yShelf2 + 16 + stepMid;    // baseY + 1528

var sh1 = AddHorizPanel(c2_innerX1, shelfZ1, c2_innerX2, shelfZ2, yShelf1);
sh1.Name = 'Полка 1 силовая (ниша 650 от дна)';

var sh2 = AddHorizPanel(c2_innerX1, shelfZ1, c2_innerX2, shelfZ2, yShelf2);
sh2.Name = 'Полка 2 съемная (ниша 385)';

var sh3 = AddHorizPanel(c2_innerX1, shelfZ1, c2_innerX2, shelfZ2, yShelf3);
sh3.Name = 'Полка 3 съемная (ниша 385, над вырезом)';

var sh4 = AddHorizPanel(c2_innerX1, shelfZ1, c2_innerX2, shelfZ2, yShelf4);
sh4.Name = 'Полка 4 силовая (ниша 700 от верха)';

// 4. Окно выреза под счетчики в правой боковине (Y = 1250..1430, H = 180 мм)
var cutBox = AddBox(c2_innerX2 - 2, baseY + 1250, baseZ + 50, baseX + W1 + W2 + 2, baseY + 1430, baseZ + 370);
cutBox.Color = 0xd32f2f;
cutBox.Name = 'Вырез под счетчики (180x320 мм)';

// ------------------------------------------------------------------------------
// ЗАВЕРШЕНИЕ
// ------------------------------------------------------------------------------
try {
    Action.Commit();
} catch(eC) {}

try {
    ViewAll();
    SetCamera(p3dIsometric);
} catch(eV) {}
