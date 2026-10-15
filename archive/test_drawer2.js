// Тест 2: проверка работы TranslateGCS и смещения элементов внутри блока
var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

var blk = AddBlock('Тестовый ящик');
blk.Load(drawerPath);

// Смещаем блок на X = 616, Y = 100
var dx = 616 - blk.GabMin.x;
var dy = 100 - blk.GabMin.y;
var dz = 0 - blk.GabMin.z;

blk.TranslateGCS(Vector(dx, dy, dz));
blk.Build();

alert('После TranslateGCS: \n' +
      'Новый GabMin = ' + blk.GabMin.x + ', ' + blk.GabMin.y + ', ' + blk.GabMin.z);
