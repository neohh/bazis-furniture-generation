// Интерактивный выбор и установка параметрического евровинта 7х51
NewModel();

var leftSide = AddVertPanel(0, 0, 560, 1000, 0); // X: [0 .. 16]
var bottomFloor = AddHorizPanel(16, 0, 560, 560, 60); // Y: [60 .. 76]

// 1. Открываем окно выбора фурнитуры прямо в интерфейсе Базиса!
var furnControl = Action.Properties.NewFurniture('Евровинт');
var furnVal = furnControl.Value;

// Вызываем диалог базы фурнитуры Базиса:
if (furnVal.Choose()) {
    // 2. Ставим выбранный вами евровинт строго горизонтально сквозь боковину в торец дна:
    var e1 = furnVal.Mount(leftSide, bottomFloor, 16, 68, 100);
    var e2 = furnVal.Mount(leftSide, bottomFloor, 16, 68, 460);

    // Сохраняем строку параметров этой фурнитуры для повторного использования:
    var savedStr = furnVal.EncodeToString();
    system.log('Furn string: ' + savedStr);

    Action.Commit();
    ViewAll();
    SetCamera(p3dIsometric);
} else {
    Action.Cancel();
}
