// Тест правильного направления конфирмата
var fConfPath = 'z:\\Work\\генерация мебели\\furn\\confirmat_7x50.f3d';
var fConf = OpenFurniture(fConfPath);

NewModel();

var leftSide = AddVertPanel(0, 0, 560, 1000, 0); // X: [0 .. 16]
var bottomFloor = AddHorizPanel(16, 0, 500, 560, 60); // Y: [60 .. 76]

alert('Пробуем вариант 1 (как было раньше: bottomFloor, leftSide):');
// Вариант 1 (раньше): panel1 = bottomFloor, panel2 = leftSide
var c1 = fConf.Mount(bottomFloor, leftSide, 16, 68, 100);

alert('Пробуем вариант 2: leftSide, bottomFloor на X=0:');
var c2 = fConf.Mount(leftSide, bottomFloor, 0, 68, 200);

Action.Commit();
ViewAll();
