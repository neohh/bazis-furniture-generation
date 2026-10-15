// ==============================================================================
// Полная генерация шкафа со всеми доработками
// Габариты: H = 2500, W = 1000, D = 560, ЛДСП = 16 мм
// Цоколь: 60 мм (передний вровень, задний смещен на 80 мм вглубь)
// Ниша под ящики справа: 800 мм от дна
// В отсеке: 2 ящика С ПЛАНКАМИ, зазор снизу 10 мм, между фасадами 25 мм,
// фасады утоплены на 10 мм вглубь шкафа
// Верхние полки справа: на одинаковом расстоянии
// Крепеж: Конфирматы, Rafix/VB, полкодержатели D5 из fastener_presets.json
// ==============================================================================

NewModel();

var PRESETS_FILE = 'Z:\\Work\\генерация мебели\\fastener_presets.json';
var config = null;

try {
    var rawText = system.readTextFile(PRESETS_FILE);
    config = JSON.parse(rawText);
} catch (e) {
    alert('Не удалось прочитать ' + PRESETS_FILE + ': ' + e);
}

// Загрузка фурнитуры
var loadedFurn = {};
if (config && config.hardware) {
    for (var hKey in config.hardware) {
        var hItem = config.hardware[hKey];
        try {
            loadedFurn[hKey] = OpenFurniture(hItem.path);
        } catch (err) {
            system.log('Ошибка загрузки фурнитуры ' + hItem.path + ': ' + err);
        }
    }
}

function mountSchemePair(schemeName, panelWithFace, panelWithEdge, x, y, zStart, zEnd) {
    if (!config || !config.schemes) return;
    var scheme = config.schemes[schemeName];
    if (!scheme) return;
    var furnObj = loadedFurn[scheme.hardware];
    if (!furnObj) return;

    var offset = scheme.edgeOffset || 50;
    var z1 = zStart + offset;
    var z2 = zEnd - offset;

    furnObj.Mount(panelWithFace, panelWithEdge, x, y, z1);
    furnObj.Mount(panelWithFace, panelWithEdge, x, y, z2);
}

// ==============================================================================
// 1. ГЕОМЕТРИЧЕСКИЕ ПАРАМЕТРЫ ШКАФА
// ==============================================================================
var TotalHeight = 2500; // Высота (Y)
var TotalWidth  = 1000; // Ширина (X)
var TotalDepth  = 560;  // Глубина (Z)
var Thick       = 16;   // Толщина ЛДСП

var SocleHeight      = 60;  // Высота цоколя
var SocleBackOffset  = 80;  // Отступ заднего цоколя от задней кромки
var LeftSectionWidth = 600; // Чистый проем платяного отделения слева
var TopShelfSpace    = 400; // Чистый проем антресольной полки

// 1.1. БОКОВИНЫ (до пола)
var leftSide = AddVertPanel(0, 0, TotalDepth, TotalHeight, 0);
leftSide.Name = 'Боковина левая';

var rightSide = AddVertPanel(0, 0, TotalDepth, TotalHeight, TotalWidth - Thick);
rightSide.Name = 'Боковина правая';

// 1.2. ЦОКОЛИ (передний вровень спереди Z = TotalDepth - Thick, задний со смещением 80 мм от задней кромки Z = 80)
var frontSocle = AddFrontPanel(Thick, 0, TotalWidth - Thick, SocleHeight, TotalDepth - Thick);
frontSocle.Name = 'Цоколь передний';

var backSocle = AddFrontPanel(Thick, 0, TotalWidth - Thick, SocleHeight, SocleBackOffset);
backSocle.Name = 'Цоколь задний';

// 1.3. ДНО (лежит на цоколях, Y = SocleHeight)
var bottomFloor = AddHorizPanel(Thick, 0, TotalWidth - Thick, TotalDepth, SocleHeight);
bottomFloor.Name = 'Дно';

// 1.4. КРЫШКА
var topCeil = AddHorizPanel(Thick, 0, TotalWidth - Thick, TotalDepth, TotalHeight - Thick);
topCeil.Name = 'Крышка';

// 1.5. АНТРЕСОЛЬНАЯ ДЛИННАЯ ПОЛКА
var topShelfY = TotalHeight - Thick - TopShelfSpace - Thick;
var topLongShelf = AddHorizPanel(Thick, 0, TotalWidth - Thick, TotalDepth, topShelfY);
topLongShelf.Name = 'Полка антресольная';

// 1.6. СРЕДНЯЯ СТОЙКА-РАЗДЕЛИТЕЛЬ
var midX = Thick + LeftSectionWidth; // 16 + 600 = 616 мм
var midPostYStart = SocleHeight + Thick; // 60 + 16 = 76 мм (поверхность дна)
var midPostYEnd   = topShelfY;

var midPost = AddVertPanel(0, midPostYStart, TotalDepth, midPostYEnd, midX);
midPost.Name = 'Стойка средняя';

// 1.7. ПОЛКИ СПРАВА
var rightXStart = midX + Thick;       // 616 + 16 = 632 мм
var rightXEnd   = TotalWidth - Thick; // 1000 - 16 = 984 мм
var rightNicheClearWidth = rightXEnd - rightXStart; // 352 мм

// Нижняя правая полка (от дна на высоте 800 мм чистого отсека):
var bottomDrawerSectionH = 800;
var firstShelfY = midPostYStart + bottomDrawerSectionH; // 76 + 800 = 876 мм
var rightShelf1 = AddHorizPanel(rightXStart, 0, rightXEnd, TotalDepth, firstShelfY);
rightShelf1.Name = 'Полка правая 1 (над ящиками)';

// Верхние полки справа (от первой полки до антресоли - делятся на равные секции):
// На эскизе пользователя: 3 съемные полки (образуют 4 равных проема)
var upperSectionYStart = firstShelfY + Thick;
var upperSectionYEnd   = topShelfY;
var upperSectionHeight = upperSectionYEnd - upperSectionYStart;
var upperShelvesCount  = 3; // 3 полки = 4 равных отсека
var shelfClearSpace    = (upperSectionHeight - upperShelvesCount * Thick) / (upperShelvesCount + 1);

var rightShelves = [{ panel: rightShelf1, y: firstShelfY, isFixed: true }];
var curShelfY = upperSectionYStart;
for (var s = 1; s <= upperShelvesCount; s++) {
    curShelfY += shelfClearSpace;
    var sh = AddHorizPanel(rightXStart, 0, rightXEnd, TotalDepth, curShelfY);
    sh.Name = 'Полка правая ' + (s + 1);
    rightShelves.push({ panel: sh, y: curShelfY, isFixed: false });
    curShelfY += Thick;
}

// ==============================================================================
// 2. УСТАНОВКА 2 ВЫДВИЖНЫХ ЯЩИКОВ С ПЛАНКАМИ В ОТСЕК 800 ММ
// ==============================================================================
var drawerPreset = config && config.drawers ? config.drawers['box_with_planks'] : null;
var drawerPath   = drawerPreset ? drawerPreset.path : 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

var drawerCount  = 2;   // ровно 2 ящика
var gapBottom    = 10;  // 10 мм от дна до нижнего среза первого фасада
var gapBetween   = 25;  // 25 мм между фасадами
var facadeIndent = 10;  // фасад утоплен на 10 мм вглубь от передней кромки

// Рассчитываем высоту фасадов для 2 ящиков под проем 800 мм:
// Чистый проем 800 мм, зазор сверху тоже 25 мм:
var totalGaps = gapBottom + gapBetween + gapBetween; // 10 + 25 + 25 = 60 мм
var eachFacadeH = Math.floor((bottomDrawerSectionH - totalGaps) / drawerCount); // (800 - 60) / 2 = 370 мм

// Исходные координаты блока ящика с планками:
var origGuideLeftX  = -3.589;
var origGuideRightX = 440.480;
var origGuideSpan   = origGuideRightX - origGuideLeftX; // 444.069 мм
var origBlockWidth  = 487.0;
var origBlockHeight = 325.0;

// Планки справа: 2 шт. по 16 мм = 32 мм
var plankCount = 2;
var plankThick = 16;
var rightPlanksTotal = plankCount * plankThick; // 32 мм
var plankHeight = 50;
var plankDepth  = 500;

// Чистое расстояние между левой стойкой и внутренней гранью планки:
var targetGuideSpan = (rightNicheClearWidth - rightPlanksTotal); // 352 - 32 = 320 мм
var deltaSpan = targetGuideSpan - origGuideSpan;
var targetBlockWidth = origBlockWidth + deltaSpan;

// Передняя кромка шкафа: Z = TotalDepth (560 мм)
// Фасад утапливается на 10 мм: наружная грань фасада = TotalDepth - facadeIndent = 550 мм
var shiftZ = TotalDepth - facadeIndent;

var curFacadeBottomY = midPostYStart + gapBottom;

for (var d = 0; d < drawerCount; d++) {
    // 2.1. Строим 2 планки справа на уровне направляющих данного ящика:
    var plankYStart = curFacadeBottomY;
    var plankYEnd   = plankYStart + plankHeight;

    // Планка 1 (прилегает к правой боковине шкафа)
    var p1 = AddVertPanel(TotalDepth - plankDepth, plankYStart, TotalDepth, plankYEnd, rightXEnd - 16);
    p1.Name = 'Планка правая 1 (16х50х500) ящика ' + (d + 1);

    // Планка 2 (внутренняя)
    var p2 = AddVertPanel(TotalDepth - plankDepth, plankYStart, TotalDepth, plankYEnd, rightXEnd - 32);
    p2.Name = 'Планка правая 2 (16х50х500) ящика ' + (d + 1);

    // 2.2. Загружаем и растягиваем ящик:
    var wrapper = AddBlock('Контейнер_Ящик_' + (d + 1));
    wrapper.Load(drawerPath);

    var dBlock = null;
    for (var k = 0; k < wrapper.Count; k++) {
        if (wrapper.Objects[k].Name === 'ящик НОВЫЙ') {
            dBlock = wrapper.Objects[k];
            break;
        }
    }
    if (!dBlock && wrapper.Count > 0) dBlock = wrapper.Objects[0];

    // Растягиваем блок ящика по ширине
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
    var localFacadeH = facadeObj ? facadeObj.GSize.y : eachFacadeH;

    // Позиционирование:
    // Левая направляющая упирается в среднюю стойку: X = rightXStart
    var shiftX = rightXStart - origGuideLeftX;
    // Низ фасада встает точно на curFacadeBottomY
    var shiftY = curFacadeBottomY - localFacadeBottom;

    dBlock.Translate(NewVector(shiftX, shiftY, shiftZ));
    dBlock.Build();

    curFacadeBottomY += localFacadeH + gapBetween;
}

// ==============================================================================
// 3. РАССТАНОВКА КРЕПЕЖА ПО ПРЕСЕТАМ ИЗ ФАЙЛА
// ==============================================================================

// 3.1. Дно и Крышка к боковинам (Конфирматы 7х50)
// Вкручиваются строго снаружи сквозь боковину в торец дна/крышки:
// Левая боковина: X = 0 (снаружи)
// Правая боковина: X = TotalWidth (снаружи)
mountSchemePair('CONFIRMAT', leftSide, bottomFloor, 0, SocleHeight + Thick / 2, 0, TotalDepth);
mountSchemePair('CONFIRMAT', rightSide, bottomFloor, TotalWidth, SocleHeight + Thick / 2, 0, TotalDepth);

mountSchemePair('CONFIRMAT', leftSide, topCeil, 0, TotalHeight - Thick / 2, 0, TotalDepth);
mountSchemePair('CONFIRMAT', rightSide, topCeil, TotalWidth, TotalHeight - Thick / 2, 0, TotalDepth);

// 3.2. Антресольная полка к боковинам (VB / Rafix строго СНИЗУ полки)
// Для нижней плоскости полки: Y = topShelfY (а не середина плиты)
mountSchemePair('VB', topLongShelf, leftSide, Thick, topShelfY, 0, TotalDepth);
mountSchemePair('VB', topLongShelf, rightSide, TotalWidth - Thick, topShelfY, 0, TotalDepth);

// 3.3. Средняя стойка (одностороннее крепление на VB / Rafix)
mountSchemePair('VB', midPost, bottomFloor, midX, midPostYStart, 0, TotalDepth);
mountSchemePair('VB', midPost, topLongShelf, midX, midPostYEnd, 0, TotalDepth);

// 3.4. Правая полка 1 (над ящиками) крепится жестко на VB строго СНИЗУ полки:
// Для нижней плоскости полки: Y = firstShelfY
mountSchemePair('VB', rightShelf1, midPost, rightXStart, firstShelfY, 0, TotalDepth);
mountSchemePair('VB', rightShelf1, rightSide, rightXEnd, firstShelfY, 0, TotalDepth);

// 3.5. Верхние съемные полки справа (Полкодержатели D5 никель):
for (var s = 1; s < rightShelves.length; s++) {
    var item = rightShelves[s];
    mountSchemePair('SHELF_HOLDER', item.panel, midPost, rightXStart, item.y, 0, TotalDepth);
    mountSchemePair('SHELF_HOLDER', item.panel, rightSide, rightXEnd, item.y, 0, TotalDepth);
}

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
