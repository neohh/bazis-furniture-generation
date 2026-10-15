// Тест 5: прямое изменение Position или PositionX/PositionY/PositionZ
var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

var blk = AddBlock('Тестовый ящик');
blk.Load(drawerPath);

for (var i = 0; i < blk.Count; i++) {
    var obj = blk.Objects[i];
    obj.PositionX += 600;
    obj.PositionY += 100;
}
blk.Build();

alert('После PositionX += 600: \n' +
      'Новый GabMin = ' + blk.GabMin.x + ', ' + blk.GabMin.y + ', ' + blk.GabMin.z);
