// Тест: правильный поворот параметрического Евровинта 7х50
NewModel();

var leftSide = AddVertPanel(0, 0, 560, 1000, 0);
var bottomFloor = AddHorizPanel(16, 0, 560, 560, 60);

var furnControl = Action.Properties.NewFurniture('Евровинт');
var furnVal = furnControl.Value;

if (furnVal.Choose()) {
    // Ставим в точку стыка:
    var v1 = furnVal.Mount(leftSide, bottomFloor, 16, 68, 100);
    var v2 = furnVal.Mount(leftSide, bottomFloor, 16, 68, 460);

    // Разворачиваем объект из вертикального (Y) в горизонтальный (X):
    // В Базисе v1.RotateZ(90) поворачивает локальную СК объекта на 90 градусов
    if (v1) {
        v1.RotateZ(90);
        v1.PositionX = 0;
        v1.PositionY = 68;
        v1.Build();
    }
    if (v2) {
        v2.RotateZ(90);
        v2.PositionX = 0;
        v2.PositionY = 68;
        v2.Build();
    }

    Action.Commit();
    ViewAll();
    SetCamera(p3dIsometric);
}
