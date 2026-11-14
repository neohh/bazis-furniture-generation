// ==============================================================================
// 15_Сборка шкафа по чертежу (База 1 с эластичностью + наполнение)
// Габариты: 1000 x 2660 x 450
// ==============================================================================

var thick = 16;
var targetW = 1000;
var targetH = 2660;
var targetD = 450;

// 1. Поиск фрагмента базы (шкаф тест модуля / шкаф база 1)
var FRAG_PATHS = [
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Шкафы\\шкаф тест модуля.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Шкафы\\шкаф база 1.fr3d',
    'C:\\Users\\maxim\\Downloads\\шкаф тест модуля.fr3d',
    'Z:\\Work\\генерация мебели\\Фрагменты\\Шкафы\\шкаф тест модуля.fr3d',
    'Z:\\Work\\генерация мебели\\Фрагменты\\Шкафы\\шкаф база 1.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\01_АКТУАЛЬНЫЙ_ШКАФ_3D\\шкаф тест модуля.fr3d'
];

var fragPath = '';
for (var i = 0; i < FRAG_PATHS.length; i++) {
    if (system.fileExists(FRAG_PATHS[i])) {
        fragPath = FRAG_PATHS[i];
        break;
    }
}

// Рекурсивный поиск блока с эластичностью
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
    // Если IsElastic не сработал, но ElasticResize существует у именованного блока
    if (typeof obj.ElasticResize === 'function' && obj.Name && obj.Name.indexOf('Рамка') === -1) {
        return obj;
    }
    return null;
}

// Границы для наполнения по умолчанию
var innerX1 = thick;
var innerX2 = targetW - thick;
var dnoTopY = 76;                       // цоколь 60 + ЛДСП 16
var roofBottomY = targetH - 65 - thick; // 2579 (под козырьком 65 мм)
var shelfD = targetD - 20;              // 430 мм (отступ 20 мм спереди под двери)
var shelfZ = 0;

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
    // Режим Б: Загрузка базы с эластичностью и растяжение до 1000 x 2660 x 450
    var cabinetBlock = AddBlock('Шкаф база (2660x1000x450)');
    var baseLoaded = false;

    if (fragPath !== '') {
        try {
            baseLoaded = cabinetBlock.Load(fragPath);
        } catch(eL) {
            baseLoaded = false;
        }
    }

    if (baseLoaded) {
        // Ищем эластичный блок (Блок1)
        var elBlock = findResizeBlock(cabinetBlock);
        if (elBlock) {
            try {
                elBlock.ElasticResize(NewVector(targetW, targetH, targetD));
                elBlock.Build();
            } catch(eR1) {
                try {
                    elBlock.ElasticResize(NewVector(targetW, targetH, elBlock.GSize ? elBlock.GSize.z : targetD));
                    elBlock.Build();
                } catch(eR2) {}
            }
        }
        cabinetBlock.Build();

        // Считываем реальные плоскости загруженной и растянутой базы
        function scanPanels(obj) {
            if (!obj) return;
            if (obj.AsPanel) {
                var p = obj.AsPanel;
                // Дно
                if (p.GSize.y <= 30 && p.GabMin.y >= 50 && p.GabMin.y <= 120) {
                    dnoTopY = p.GabMax.y;
                }
                // Крышка
                if (p.GSize.y <= 30 && p.GabMin.y > 2000 && p.GabMin.y < targetH - 10) {
                    roofBottomY = p.GabMin.y;
                }
                // Левая боковина
                if (p.GSize.x <= 30 && p.GabMin.x < 50) {
                    innerX1 = p.GabMax.x;
                }
                // Правая боковина
                if (p.GSize.x <= 30 && p.GabMax.x > targetW - 50) {
                    innerX2 = p.GabMin.x;
                }
            }
            if (obj.Count) {
                for (var c = 0; c < obj.Count; c++) {
                    scanPanels(obj.Objects ? obj.Objects[c] : obj[c]);
                }
            }
        }
        scanPanels(cabinetBlock);

    } else {
        // Резервное построение короба, если файл фрагмента не найден
        var leftSide = AddVertPanel(0, 0, targetD, targetH, 0);
        leftSide.Name = 'Боковина левая';
        var rightSide = AddVertPanel(0, 0, targetD, targetH, targetW - thick);
        rightSide.Name = 'Боковина правая';
        var frontSocle = AddFrontPanel(thick, 0, targetW - thick, 60, targetD - thick);
        frontSocle.Name = 'Цоколь передний';
        var rearSocle = AddFrontPanel(thick, 0, targetW - thick, 60, 80);
        rearSocle.Name = 'Цоколь задний';
        var bottom = AddHorizPanel(thick, 0, targetW - thick, targetD, 60);
        bottom.Name = 'Дно';
        var roofY = targetH - 65 - thick;
        var roof = AddHorizPanel(thick, 0, targetW - thick, targetD, roofY);
        roof.Name = 'Крышка';
        var visor = AddFrontPanel(thick, targetH - 65, targetW - thick, targetH, targetD - thick);
        visor.Name = 'Козырек';
    }
}

// 2. Внутреннее наполнение по чертежу
var mezzH = 450;        // Проем антресоли в свету (мм)
var rightNicheW = 600;  // Чистая ширина правой секции (мм)
var rightBotH = 1540;   // Чистая высота правой ниши под штангу (мм)
var leftBotH = 850;     // Чистая высота левой ниши под ящики (мм)

// Отметки деталей
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

// 5. Левая секция: 2 съемные полки с равным шагом ~380 мм (глубина 420 мм)
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

// Полкодержатели D5 для съемных полок
var shelfHolderPath = 'z:\\Work\\генерация мебели\\furn\\полкодержатель_d5.f3d';
if (system.fileExists(shelfHolderPath)) {
    try {
        var shObj = OpenFurniture(shelfHolderPath);
        if (shObj) {
            var shZ1 = shelfZ + 50;
            var shZ2 = shelfZ + shelfD - 60;
            shObj.Mount(leftShelf2, null, innerX1, leftShelf2Y, shZ1);
            shObj.Mount(leftShelf2, null, innerX1, leftShelf2Y, shZ2);
            shObj.Mount(leftShelf2, null, midPostX, leftShelf2Y, shZ1);
            shObj.Mount(leftShelf2, null, midPostX, leftShelf2Y, shZ2);

            shObj.Mount(leftShelf3, null, innerX1, leftShelf3Y, shZ1);
            shObj.Mount(leftShelf3, null, innerX1, leftShelf3Y, shZ2);
            shObj.Mount(leftShelf3, null, midPostX, leftShelf3Y, shZ1);
            shObj.Mount(leftShelf3, null, midPostX, leftShelf3Y, shZ2);
        }
    } catch(eSh) {}
}

EndBlock(); // Конец блока внутреннего наполнения

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
