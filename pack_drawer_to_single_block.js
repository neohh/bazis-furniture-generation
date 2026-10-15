// ==============================================================================
// Скрипт: Объединение всей фурнитуры и ящика в единый эластичный БЛОК
// ==============================================================================

var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

NewModel();
LoadModel(drawerPath);

// Проверяем: если в корне модели лежат разрозненные элементы (Model.Count > 1),
// объединяем их все в один общий блок
alert('Элементов в корне модели: ' + Model.Count);

// Выделяем всё и создаем общий блок
SelectAll();

// Создаем единый контейнер "ящик НОВЫЙ"
var mainBlock = AddBlock('ящик НОВЫЙ');

// Переносим все объекты из модели внутрь единого блока
var objsToMove = [];
for (var i = 0; i < Model.Count; i++) {
    var o = Model.Objects[i];
    if (o !== mainBlock) {
        objsToMove.push(o);
    }
}

for (var j = 0; j < objsToMove.length; j++) {
    objsToMove[j].Owner = mainBlock;
}

mainBlock.Build();
Action.Commit();

// Сохраняем модель с правильной структурой (всё внутри единого блока)
SaveModel(drawerPath);

ViewAll();
SetCamera(p3dIsometric);

alert('Готово!\nВсе детали и фурнитура теперь собраны в ЕДИНЫЙ блок: "' + mainBlock.Name + '".\n' +
      'Теперь эластичность накладывается на ВЕСЬ этот блок целиком!');
