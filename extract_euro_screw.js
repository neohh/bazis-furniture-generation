// Извлечение евровинта 7х50 прямо из ящика в отдельный файл
var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';
var savePath = 'z:\\Work\\генерация мебели\\furn\\евровинт_7х50_69.f3d';

NewModel();
var wrapper = AddBlock('Контейнер');
wrapper.Load(drawerPath);

var dBlock = wrapper.Objects[0];
var euroVint = null;

function findEuro(obj) {
    if (!obj) return;
    if (obj.Name && obj.Name.indexOf('Евровинт 7х50') !== -1) {
        euroVint = obj;
        return;
    }
    if (obj.Count) {
        for (var i = 0; i < obj.Count; i++) {
            findEuro(obj.Objects[i]);
            if (euroVint) return;
        }
    }
}
findEuro(dBlock);

alert('Найден евровинт: ' + (euroVint ? (euroVint.Name + ' [' + euroVint.constructor.name + ']') : 'нет'));

if (euroVint) {
    // Создаем чистую модель и сохраняем именно этот крепеж
    NewModel();
    var copyObj = euroVint.Clone();
    copyObj.Owner = Model;
    Action.Commit();
    // Сохраняем модель
    Save(savePath);
    alert('Евровинт сохранен в: ' + savePath);
}
