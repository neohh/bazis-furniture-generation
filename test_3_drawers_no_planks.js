// ==============================================================================
// Тестовая сцена: 3 ящика БЕЗ планок с идеальными зазорами:
// 1. Снизу от дна: РОВНО 10 мм
// 2. Между фасадами: РОВНО 25 мм
// 3. Фасад утоплен вглубь на 10 мм относительно передней кромки боковины
// ==============================================================================

var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик БЕЗ_ПЛАНОК.f3d';

NewModel();

var nicheWidth = 600;  
var nicheHeight = 1000;
var nicheDepth = 500;
var thick = 16;

// Боковины и дно ниши (Z: от 0 до 500 мм, передняя кромка шкафа на Z = 500 мм)
var leftPost = AddVertPanel(0, 0, nicheDepth, nicheHeight, 0);
leftPost.Name = 'Левая стойка';

var rightPost = AddVertPanel(0, 0, nicheDepth, nicheHeight, nicheWidth - thick);
rightPost.Name = 'Правая стойка';

var bottomPanel = AddHorizPanel(thick, 0, nicheWidth - thick, nicheDepth, 0);
bottomPanel.Name = 'Дно ниши';

var clearWidth = (nicheWidth - thick) - thick; // 568 мм
var drawerCount = 3;

// ПАРАМЕТРЫ ФАСАДОВ:
var gapBottom = 10;     // ровно 10 мм от дна до первого фасада
var gapBetween = 25;    // ровно 25 мм между фасадами
var facadeHeight = 200; // высота каждого фасада
var facadeIndent = 10;  // углубление фасада внутрь шкафа (10 мм)

// Базовые параметры ящика:
var origGuideLeftX  = -3.589;
var origGuideRightX = 440.480;
var origGuideSpan   = origGuideRightX - origGuideLeftX; // 444.069 мм
var origBlockWidth  = 452.0;
var origBlockHeight = 325.0;

// Растягиваем по ширине ровно под проем:
var deltaSpan = clearWidth - origGuideSpan;
var targetBlockWidth = origBlockWidth + deltaSpan;

// Передняя кромка шкафа находится на Z = nicheDepth (500 мм).
// Мы хотим, чтобы передняя грань фасада стояла на Z = nicheDepth - facadeIndent = 490 мм.
// В исходном файле ящика передняя грань фасада находится на GabMax.z = 0.0.
// Значит, смещение по Z = (nicheDepth - facadeIndent) - 0.0 = 490 мм!
var shiftZ = (nicheDepth - facadeIndent);

var currentFacadeBottomY = thick + gapBottom;

for (var i = 0; i < drawerCount; i++) {
    var wrapper = AddBlock('Контейнер_Ящик_' + (i + 1));
    wrapper.Load(drawerPath);

    var dBlock = null;
    for (var k = 0; k < wrapper.Count; k++) {
        if (wrapper.Objects[k].Name === 'ящик НОВЫЙ') {
            dBlock = wrapper.Objects[k];
            break;
        }
    }
    if (!dBlock && wrapper.Count > 0) dBlock = wrapper.Objects[0];

    // Растягиваем ящик эластичностью по ширине
    dBlock.ElasticResize(NewVector(targetBlockWidth, origBlockHeight, dBlock.GSize.z));

    // Находим фасад ящика
    var facadeObj = null;
    for (var m = 0; m < dBlock.Count; m++) {
        if (dBlock.Objects[m].Name === 'Фасад ящика' && dBlock.Objects[m].GSize.y > 50) {
            facadeObj = dBlock.Objects[m];
            break;
        }
    }

    var localFacadeBottom = facadeObj ? facadeObj.GabMin.y : 0;
    var localFacadeH = facadeObj ? facadeObj.GSize.y : facadeHeight;

    // Смещение X: левая направляющая упирается в стойку
    var shiftX = thick - origGuideLeftX;
    // Смещение Y: низ фасада ровно на currentFacadeBottomY
    var shiftY = currentFacadeBottomY - localFacadeBottom;

    dBlock.Translate(NewVector(shiftX, shiftY, shiftZ));
    dBlock.Build();

    currentFacadeBottomY += localFacadeH + gapBetween;
}

// Ставим верхнюю полку ниши над верхним фасадом с зазором 25 мм для симметрии
var topShelfY = currentFacadeBottomY;
var topShelf = AddHorizPanel(thick, 0, nicheWidth - thick, nicheDepth, topShelfY);
topShelf.Name = 'Полка над ящиками';

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
