// Тест правильного положения евровинта
NewModel();

var leftSide = AddVertPanel(0, 0, 560, 1000, 0); // пласть X: [0 .. 16]
var bottomFloor = AddHorizPanel(16, 0, 560, 560, 60); // торец упирается в X = 16

var fConfPath = 'z:\\Work\\генерация мебели\\furn\\confirmat_7x50.f3d';
var fConf = OpenFurniture(fConfPath);

alert('Тест вариантов:');

// Вариант А: bottomFloor, leftSide, x=16
fConf.Mount(bottomFloor, leftSide, 16, 68, 100);

// Вариант Б: bottomFloor, leftSide, x=0
fConf.Mount(bottomFloor, leftSide, 0, 68, 200);

// Вариант В: leftSide, bottomFloor, x=16
fConf.Mount(leftSide, bottomFloor, 16, 68, 300);

// Вариант Г: leftSide, bottomFloor, x=0
fConf.Mount(leftSide, bottomFloor, 0, 68, 400);

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
