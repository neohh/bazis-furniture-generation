// ==============================================================================
// 15_Сборка шкафа по чертежу (Шкаф база 1 + внутреннее наполнение)
// ==============================================================================

var thick = 16;

// 1. Целевые габариты шкафа по чертежу
var targetW = 1000;
var targetH = 2660;
var targetD = 560;

// 2. Поиск фрагмента "шкаф база 1.fr3d"
var FRAG_PATHS = [
    'C:\\Users\\maxim\\OneDrive\\Документы\\Bazis\\Фрагменты\\Шкафы\\шкаф база 1.fr3d',
    'Z:\\Work\\генерация мебели\\Фрагменты\\Шкафы\\шкаф база 1.fr3d',
    'C:\\Users\\maxim\\OneDrive\\Desktop\\ПРОЕКТ_ШКАФ_И_БАЗИС\\01_АКТУАЛЬНЫЙ_ШКАФ_3D\\шкаф база 1.fr3d'
];

var fragPath = '';
for (var i = 0; i < FRAG_PATHS.length; i++) {
    if (system.fileExists(FRAG_PATHS[i])) {
        fragPath = FRAG_PATHS[i];
        break;
    }
}

// 3. Загрузка и эластичное масштабирование базы
var cabinetBlock = AddBlock('Шкаф по чертежу (2660x1000)');
var baseLoaded = false;

if (fragPath !== '') {
    try {
        baseLoaded = cabinetBlock.Load(fragPath);
    } catch (e) {
        baseLoaded = false;
    }
}

if (baseLoaded) {
    // Растягиваем эластичный блок базы до целевых габаритов W=1000, H=2660, D=560
    var resizeObj = cabinetBlock;
    if (cabinetBlock.Count > 0 && cabinetBlock[0]) {
        resizeObj = cabinetBlock[0];
    }
    resizeObj.ElasticResize(NewVector(targetW, targetH, targetD));
    cabinetBlock.Build();
} else {
    // Если фрагмент не найден, строим базовый короб шкафа напрямую
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

// 4. Определение чистых внутренних границ каркаса
var innerX1 = thick;
var innerX2 = targetW - thick;
var dnoTopY = 76;                       // цоколь 60 + ЛДСП 16
var roofBottomY = targetH - 65 - thick; // под козырьком
var shelfD = targetD - 20;              // 20 мм отступ под фасады/купе
var shelfZ = 0;

// Сканируем загруженную базу для точной привязки к реальным плоскостям
function scanPanels(obj) {
    if (!obj) return;
    if (obj.AsPanel) {
        var p = obj.AsPanel;
        if (p.GSize.y <= 30 && p.GabMin.y >= 50 && p.GabMin.y <= 120) {
            dnoTopY = p.GabMax.y;
        }
        if (p.GSize.y <= 30 && p.GabMin.y > 2000 && p.GabMin.y < targetH - 30) {
            roofBottomY = p.GabMin.y;
        }
        if (p.GSize.x <= 30 && p.GabMin.x < 50) {
            innerX1 = p.GabMax.x;
        }
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

// 5. Построение внутреннего наполнения по чертежу
var mezzH = 450;        // Проем антресоли в свету
var rightNicheW = 600;  // Чистая ширина правой секции
var rightBotH = 1540;   // Чистая высота правой ниши под штангу
var leftBotH = 850;     // Чистая высота левой ниши под ящики

var mezzShelfY = roofBottomY - mezzH - thick;
var midPostX = innerX2 - rightNicheW - thick;

BeginBlock('Внутреннее наполнение');

// Антресольная полка (на всю ширину шкафа)
var mezzShelf = AddHorizPanel(innerX1, shelfZ, innerX2, shelfZ + shelfD, mezzShelfY);
mezzShelf.Name = 'Полка антресольная';
mezzShelf.Thickness = thick;

// Стойка средняя (от дна до антресоли)
var midPost = AddVertPanel(shelfZ, dnoTopY, shelfZ + shelfD, mezzShelfY, midPostX);
midPost.Name = 'Стойка средняя';
midPost.Thickness = thick;

// Правая секция: полка над нишей 1540 мм
var rightShelfY = dnoTopY + rightBotH;
var rightShelf = AddHorizPanel(midPostX + thick, shelfZ, innerX2, shelfZ + shelfD, rightShelfY);
rightShelf.Name = 'Полка правая над штангой';
rightShelf.Thickness = thick;

// Левая секция: полка над нишей 850 мм
var leftShelf1Y = dnoTopY + leftBotH;
var leftShelf1 = AddHorizPanel(innerX1, shelfZ, midPostX, shelfZ + shelfD, leftShelf1Y);
leftShelf1.Name = 'Полка левая над нишей';
leftShelf1.Thickness = thick;

// Левая секция: 2 съемные полки с равным шагом ~401 мм
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

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
