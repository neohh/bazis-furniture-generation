// Проверка чистого горизонтального Евровинта 7х51
NewModel();

var leftSide = AddVertPanel(0, 0, 560, 1000, 0);
var bottomFloor = AddHorizPanel(16, 0, 500, 560, 60);

var euroPath = 'z:\\Work\\генерация мебели\\furn\\eurovint_7x51_horizontal.f3d';
var fEuro = OpenFurniture(euroPath);

// Ставим строго горизонтально: оба винта по проверенному вызову Вариант 2:
fEuro.Mount(leftSide, bottomFloor, 0, 68, 100);
fEuro.Mount(leftSide, bottomFloor, 0, 68, 460);

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
