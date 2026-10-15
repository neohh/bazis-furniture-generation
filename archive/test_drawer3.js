// Тест 3: смещение внутренних объектов блока
var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

var blk = AddBlock('Тестовый ящик');
blk.Load(drawerPath);

var dx = 616 - blk.GabMin.x;
var dy = 100 - blk.GabMin.y;
var dz = 0 - blk.GabMin.z;

// Смещаем каждый объект внутри блока
for (var i = 0; i < blk.Count; i++) {
    var obj = blk.Objects[i];
    obj.Translate(Vector(dx, dy, dz));
}
blk.Build();

alert('После смещения внутренних объектов: \n' +
      'Количество объектов в блоке = ' + blk.Count + '\n' +
      'Новый GabMin = ' + blk.GabMin.x + ', ' + blk.GabMin.y + ', ' + blk.GabMin.z);
