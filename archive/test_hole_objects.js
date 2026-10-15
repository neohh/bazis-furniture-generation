// Тест правильного горизонтального евровинта
NewModel();

var leftSide = AddVertPanel(0, 0, 560, 1000, 0);
var bottomFloor = AddHorizPanel(16, 0, 560, 560, 60);

var fConfPath = 'z:\\Work\\furn\\confirmat_7x50.f3d';
var fConf = OpenFurniture(fConfPath);

// В test_4_conf_variants.js два дальних горизонтальных - это Вариант В (Z=300) и Вариант Г (Z=400):
// panel1 = leftSide, panel2 = bottomFloor !
var e1 = fConf.Mount(leftSide, bottomFloor, 16, 68, 300);
var e2 = fConf.Mount(leftSide, bottomFloor, 0, 68, 400);

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
