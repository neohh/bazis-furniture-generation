// Тест 4: инспекция состава и типов объектов в ящике
var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

var blk = AddBlock('Тестовый ящик');
blk.Load(drawerPath);

var info = 'Всего объектов в блоке: ' + blk.Count + '\n';
for (var i = 0; i < blk.Count; i++) {
    var obj = blk.Objects[i];
    info += (i + 1) + '. ' + obj.Name + ' [' + (obj.AsPanel ? 'Панель' : (obj.AsList ? 'Блок/Список' : 'Другое')) + ']\n';
    if (i >= 7) {
        info += '...и еще ' + (blk.Count - i - 1) + ' объектов';
        break;
    }
}

alert(info);
