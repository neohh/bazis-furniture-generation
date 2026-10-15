// ==============================================================================
// Точная калибровка эластичного ящика под планки 50х500 мм
// ==============================================================================

var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

NewModel();

// Габариты ниши
var nicheWidth = 600; 
var nicheHeight = 800;
var nicheDepth = 500;
var thick = 16;

// Боковины ниши
var leftPost = AddVertPanel(0, 0, nicheDepth, nicheHeight, 0);
leftPost.Name = 'Левая стойка';

var rightPost = AddVertPanel(0, 0, nicheDepth, nicheHeight, nicheWidth - thick);
rightPost.Name = 'Правая стойка';

var bottomPanel = AddHorizPanel(thick, 0, nicheWidth - thick, nicheDepth, 0);
bottomPanel.Name = 'Дно ниши';

// Загружаем ящик
var wrapper = AddBlock('Контейнер');
wrapper.Load(drawerPath);

var drawerBlock = null;
for (var i = 0; i < wrapper.Count; i++) {
    if (wrapper.Objects[i].Name === 'ящик НОВЫЙ') {
        drawerBlock = wrapper.Objects[i];
        break;
    }
}
if (!drawerBlock && wrapper.Count > 0) drawerBlock = wrapper.Objects[0];

// Базовые координаты металлических направляющих в исходном ящике:
var origGuideLeftX  = -3.589;  // внешняя грань левой направляющей
var origGuideRightX = 440.480; // внешняя грань правой направляющей (без учета крепежа/саморезов)
var origGuideSpan   = origGuideRightX - origGuideLeftX; // 444.069 мм
var origBlockWidth  = drawerBlock.GSize.x;              // 487.0 мм

// Чистая ширина проема между боковинами:
var clearOpening = nicheWidth - thick * 2; // 568 мм

// Справа 2 планки толщиной 16 мм, высотой 50 мм, глубиной 500 мм
var plankThick = 16;
var rightPlankWidth = 2 * plankThick; // 32 мм
var plankHeight = 50;

// Уровень низа ящика над дном (зазор 10 мм)
var drawerY = thick + 10;

// Строим обе планки справа:
var rightWallX = nicheWidth - thick; // 584 мм (внутренняя грань правой стойки)

// Планка 1 (прилегает к стойке)
var pl1 = AddVertPanel(drawerY, 0, nicheDepth, drawerY + plankHeight, rightWallX - 16);
pl1.Name = 'Планка правая 1 (16х50х500)';

// Планка 2 (прилегает к планке 1, внутренняя грань на X = rightWallX - 32)
var pl2 = AddVertPanel(drawerY, 0, nicheDepth, drawerY + plankHeight, rightWallX - 32);
pl2.Name = 'Планка правая 2 (16х50х500)';

// Целевое расстояние между внешней гранью левой направляющей и правой направляющей:
// Левая направляющая упирается в левую стойку: X = thick = 16 мм
// Правая направляющая упирается во вторую планку: X = rightWallX - 32 мм
var targetGuideSpan = (rightWallX - rightPlankWidth) - thick; // 568 - 32 = 536 мм

// Приращение растяжения:
var delta = targetGuideSpan - origGuideSpan;
var newBlockWidth = origBlockWidth + delta;

// Растягиваем ящик эластичностью:
drawerBlock.ElasticResize(NewVector(newBlockWidth, drawerBlock.GSize.y, drawerBlock.GSize.z));

// Точное смещение:
// Левая направляющая (была -3.589) должна встать ровно на X = thick (16.0)
var shiftX = thick - origGuideLeftX; // 16 - (-3.589) = 19.589
var shiftY = drawerY - drawerBlock.GabMin.y;
var shiftZ = 0 - drawerBlock.GabMin.z;

drawerBlock.Translate(NewVector(shiftX, shiftY, shiftZ));
drawerBlock.Build();

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
