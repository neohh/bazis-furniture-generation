// ==============================================================================
// Тестовый скрипт проверки вставки и позиционирования блока ящика
// ==============================================================================

var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

var blk = AddBlock('Тестовый ящик');
blk.Load(drawerPath);

alert('После загрузки: \n' +
      'GabMin = ' + blk.GabMin.x + ', ' + blk.GabMin.y + ', ' + blk.GabMin.z + '\n' +
      'GMin = ' + blk.GMin.x + ', ' + blk.GMin.y + ', ' + blk.GMin.z + '\n' +
      'GSize = ' + blk.GSize.x + ', ' + blk.GSize.y + ', ' + blk.GSize.z + '\n' +
      'IsElastic = ' + (blk.IsElastic ? blk.IsElastic() : 'нет метода'));

// Пробуем сместить на X = 600, Y = 100
blk.Position = Vector(616, 100, 0);
blk.Build();

alert('После установки Position: \n' +
      'Position = ' + blk.Position.x + ', ' + blk.Position.y + ', ' + blk.Position.z + '\n' +
      'GabMin = ' + blk.GabMin.x + ', ' + blk.GabMin.y + ', ' + blk.GabMin.z);
