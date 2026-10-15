// ==============================================================================
// Тест проверки эластичности сохраненного ящика
// ==============================================================================

var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

// Создаем чистую тестовую модель
NewModel();

// Тестовая ниша шириной 600 мм (проем 568 мм)
var nicheWidth = 600;
var nicheHeight = 800;
var nicheDepth = 500;
var thick = 16;

var leftPanel = AddVertPanel(0, 0, nicheDepth, nicheHeight, 0);
leftPanel.Name = 'Левая боковина';

var rightPanel = AddVertPanel(0, 0, nicheDepth, nicheHeight, nicheWidth - thick);
rightPanel.Name = 'Правая боковина';

var bottomPanel = AddHorizPanel(thick, 0, nicheWidth - thick, nicheDepth, 0);
bottomPanel.Name = 'Дно';

// Загружаем ящик
var wrapper = AddBlock('Контейнер');
wrapper.Load(drawerPath);

// Находим блок 'ящик НОВЫЙ'
var drawerBlock = null;
for (var i = 0; i < wrapper.Count; i++) {
    if (wrapper.Objects[i].Name === 'ящик НОВЫЙ') {
        drawerBlock = wrapper.Objects[i];
        break;
    }
}
if (!drawerBlock && wrapper.Count > 0) {
    drawerBlock = wrapper.Objects[0];
}

var clearWidth = nicheWidth - thick * 2; // 568 мм

// Растягиваем эластичный ящик ровно под ширину проема!
drawerBlock.ElasticResize(NewVector(clearWidth, drawerBlock.GSize.y, drawerBlock.GSize.z));

// Позиционируем ящик в проем между боковинами
var dx = thick - drawerBlock.GabMin.x;
var dy = thick + 20 - drawerBlock.GabMin.y;
var dz = 0 - drawerBlock.GabMin.z;
drawerBlock.Translate(NewVector(dx, dy, dz));

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
