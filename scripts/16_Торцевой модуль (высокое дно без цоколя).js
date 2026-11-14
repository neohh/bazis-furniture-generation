// ==============================================================================
// 16_Торцевой модуль (высокое дно без цоколя) 200 x 466 x 2660
// С интерактивным выбором точки привязки и направления в 3D
// ==============================================================================

var thick = 16;
var W = 466;  // 450 + 16 (стыкуется с глубиной шкафа)
var H = 2660; // общая высота
var D = 200;  // глубина стеллажа

// 1. Поиск фурнитуры Rafix (VB)
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

// 2. Интерактивный клик точки привязки
var basePt = NewVector(0, 0, 0);
try {
    Action.Hint = 'Кликните на угол шкафа (точку привязки) или нажмите Enter для (0, 0, 0)';
    var pt = GetPoint('Укажите точку привязки шкафа (Enter для 0,0,0)');
    if (pt && !isNaN(pt.x)) {
        basePt = NewVector(pt.x, pt.y, pt.z);
    }
} catch(ePt) {}

// 3. Формирование панели свойств Action.Properties
var Prop = Action.Properties;
Prop.Clear();

var grPos = Prop.NewGroup('1. Расположение и ориентация');

var pOrient = grPos.NewCombo('Ориентация модуля', 
    'Вдоль оси Z (по торцу шкафа, ширина 466 по Z, глубина 200 по X)\n' +
    'Вдоль оси X (по фасаду шкафа, ширина 466 по X, глубина 200 по Z)'
);
pOrient.ItemIndex = 0;

var pDirW = grPos.NewCombo('Направление ширины (466 мм)', 
    'Вперед / Вправо (+)\n' +
    'Назад / Влево (-)'
);
pDirW.ItemIndex = 0;

var pDirD = grPos.NewCombo('Направление глубины (200 мм)', 
    'Вправо / Вперед (+)\n' +
    'Влево / Назад (-)'
);
pDirD.ItemIndex = 0;

var grInfo = Prop.NewGroup('2. Параметры изделия');
var pWInfo = grInfo.NewString('Ширина W (габарит)', W + ' мм (450 + 16)');
pWInfo.Enabled = false;
var pHInfo = grInfo.NewString('Высота H (габарит)', H + ' мм');
pHInfo.Enabled = false;
var pDInfo = grInfo.NewString('Глубина D (габарит)', D + ' мм');
pDInfo.Enabled = false;

var grActions = Prop.NewGroup('3. Завершение');
var btnFinish = grActions.NewButton('Зафиксировать модуль');

// 4. Функция построения модуля
function buildModule() {
    DeleteNewObjects();

    var orient = pOrient.ItemIndex; // 0 - вдоль Z, 1 - вдоль X
    var dirW = pDirW.ItemIndex;     // 0 - плюс, 1 - минус
    var dirD = pDirD.ItemIndex;     // 0 - плюс, 1 - минус

    var xMin, xMax, zMin, zMax;
    var yMin = basePt.y;
    var yMax = yMin + H;

    if (orient === 0) {
        // Ширина 466 мм вдоль Z, глубина 200 мм вдоль X
        if (dirW === 0) {
            zMin = basePt.z;
            zMax = basePt.z + W;
        } else {
            zMin = basePt.z - W;
            zMax = basePt.z;
        }
        if (dirD === 0) {
            xMin = basePt.x;
            xMax = basePt.x + D;
        } else {
            xMin = basePt.x - D;
            xMax = basePt.x;
        }
    } else {
        // Ширина 466 мм вдоль X, глубина 200 мм вдоль Z
        if (dirW === 0) {
            xMin = basePt.x;
            xMax = basePt.x + W;
        } else {
            xMin = basePt.x - W;
            xMax = basePt.x;
        }
        if (dirD === 0) {
            zMin = basePt.z;
            zMax = basePt.z + D;
        } else {
            zMin = basePt.z - D;
            zMax = basePt.z;
        }
    }

    BeginBlock('Торцевой модуль (высокое дно без цоколя)');

    // 1. БАЗОВЫЙ КОРПУС
    var side1, side2, bottom, roof;

    if (orient === 0) {
        // Боковины поперек Z (по оси X)
        side1 = AddFrontPanel(xMin, yMin, xMax, yMax, zMin);
        side1.Name = 'Боковина 1';
        side1.Thickness = thick;

        side2 = AddFrontPanel(xMin, yMin, xMax, yMax, zMax - thick);
        side2.Name = 'Боковина 2';
        side2.Thickness = thick;

        // Высокое дно (поднято на 300 мм от пола)
        var yDno = yMin + 300;
        bottom = AddHorizPanel(xMin, zMin + thick, xMax, zMax - thick, yDno);
        bottom.Name = 'Дно (высокое 300 мм)';
        bottom.Thickness = thick;

        // Крышка впотай
        var yRoof = yMax - thick;
        roof = AddHorizPanel(xMin, zMin + thick, xMax, zMax - thick, yRoof);
        roof.Name = 'Крышка';
        roof.Thickness = thick;

        // 2. ВНУТРЕННЕЕ НАПОЛНЕНИЕ ПО ЭСКИЗУ
        // Полка 1 (верхняя, ниша 300 мм в свету)
        var yShelf1 = yRoof - 300 - thick; // yMax - 16 - 300 - 16
        var shelf1 = AddHorizPanel(xMin, zMin + thick, xMax, zMax - thick, yShelf1);
        shelf1.Name = 'Полка верхняя 1 (проем 300)';
        shelf1.Thickness = thick;

        // Полка 2 (вторая сверху, ниша 300 мм в свету)
        var yShelf2 = yShelf1 - 300 - thick;
        var shelf2 = AddHorizPanel(xMin, zMin + thick, xMax, zMax - thick, yShelf2);
        shelf2.Name = 'Полка верхняя 2 (проем 300)';
        shelf2.Thickness = thick;

        // Монтаж стяжек Rafix (VB)
        if (rafixFurn) {
            try {
                var midX = (xMin + xMax) / 2;
                // Дно
                rafixFurn.Mount(bottom, side1, midX, yDno, zMin + thick);
                rafixFurn.Mount(bottom, side2, midX, yDno, zMax - thick);
                // Крышка
                rafixFurn.Mount(roof, side1, midX, yRoof, zMin + thick);
                rafixFurn.Mount(roof, side2, midX, yRoof, zMax - thick);
                // Полка 1
                rafixFurn.Mount(shelf1, side1, midX, yShelf1, zMin + thick);
                rafixFurn.Mount(shelf1, side2, midX, yShelf1, zMax - thick);
                // Полка 2
                rafixFurn.Mount(shelf2, side1, midX, yShelf2, zMin + thick);
                rafixFurn.Mount(shelf2, side2, midX, yShelf2, zMax - thick);
            } catch(eM) {}
        }

    } else {
        // Боковины вдоль Z (по оси X)
        side1 = AddVertPanel(zMin, yMin, zMax, yMax, xMin);
        side1.Name = 'Боковина левая';
        side1.Thickness = thick;

        side2 = AddVertPanel(zMin, yMin, zMax, yMax, xMax - thick);
        side2.Name = 'Боковина правая';
        side2.Thickness = thick;

        // Высокое дно (поднято на 300 мм от пола)
        var yDno = yMin + 300;
        bottom = AddHorizPanel(xMin + thick, zMin, xMax - thick, zMax, yDno);
        bottom.Name = 'Дно (высокое 300 мм)';
        bottom.Thickness = thick;

        // Крышка впотай
        var yRoof = yMax - thick;
        roof = AddHorizPanel(xMin + thick, zMin, xMax - thick, zMax, yRoof);
        roof.Name = 'Крышка';
        roof.Thickness = thick;

        // 2. ВНУТРЕННЕЕ НАПОЛНЕНИЕ ПО ЭСКИЗУ
        var yShelf1 = yRoof - 300 - thick;
        var shelf1 = AddHorizPanel(xMin + thick, zMin, xMax - thick, zMax, yShelf1);
        shelf1.Name = 'Полка верхняя 1 (проем 300)';
        shelf1.Thickness = thick;

        var yShelf2 = yShelf1 - 300 - thick;
        var shelf2 = AddHorizPanel(xMin + thick, zMin, xMax - thick, zMax, yShelf2);
        shelf2.Name = 'Полка верхняя 2 (проем 300)';
        shelf2.Thickness = thick;

        // Монтаж стяжек Rafix (VB)
        if (rafixFurn) {
            try {
                var midZ = (zMin + zMax) / 2;
                // Дно
                rafixFurn.Mount(bottom, side1, xMin + thick, yDno, midZ);
                rafixFurn.Mount(bottom, side2, xMax - thick, yDno, midZ);
                // Крышка
                rafixFurn.Mount(roof, side1, xMin + thick, yRoof, midZ);
                rafixFurn.Mount(roof, side2, xMax - thick, yRoof, midZ);
                // Полка 1
                rafixFurn.Mount(shelf1, side1, xMin + thick, yShelf1, midZ);
                rafixFurn.Mount(shelf1, side2, xMax - thick, yShelf1, midZ);
                // Полка 2
                rafixFurn.Mount(shelf2, side1, xMin + thick, yShelf2, midZ);
                rafixFurn.Mount(shelf2, side2, xMax - thick, yShelf2, midZ);
            } catch(eM2) {}
        }
    }

    EndBlock();

    ViewAll();
    SetCamera(p3dIsometric);
}

// Обработчики событий интерфейса
Prop.OnChange = function() {
    buildModule();
};

btnFinish.OnClick = function() {
    buildModule();
    Action.Commit();
    Action.Finish();
};

// Первичное построение при запуске
buildModule();
Action.Continue();
