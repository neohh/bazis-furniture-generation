// Точный тест обоих вариантов
NewModel();

var leftSide = AddVertPanel(0, 0, 560, 1000, 0);
var bottomFloor = AddHorizPanel(16, 0, 500, 560, 60);

var fConfPath = 'z:\\Work\\confirmat_7x50.f3d';
var fConf = OpenFurniture(fConfPath);

// Вариант 1 (который дал горизонтальный винт на Z=200):
var c2 = fConf.Mount(leftSide, bottomFloor, 0, 68, 200);

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
