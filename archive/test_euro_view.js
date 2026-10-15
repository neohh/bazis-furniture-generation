// Тест создания евровинта в модели
NewModel();

var leftSide = AddVertPanel(0, 0, 560, 1000, 0); // X: [0 .. 16]
var bottomFloor = AddHorizPanel(16, 0, 560, 560, 60); // X: [16 .. 560]

// Используем файл евровинта, который у нас гарантированно работал на скриншоте:
var fConfPath = 'z:\\Work\\генерация мебели\\furn\\confirmat_7x50.f3d';
var euroFile = OpenFurniture(fConfPath);

// На скриншоте media_1790358874659.png идеально горизонтально сквозь боковину встал именно этот вызов:
// euroFile.Mount(leftSide, bottomFloor, 0, 68, 200);
var res1 = euroFile.Mount(leftSide, bottomFloor, 0, 68, 100);
var res2 = euroFile.Mount(leftSide, bottomFloor, 0, 68, 460);

alert('Результат вызова Mount:\n' +
      'res1: ' + (res1 ? res1.Name : 'null') + '\n' +
      'res2: ' + (res2 ? res2.Name : 'null') + '\n' +
      'Всего объектов в модели: ' + Model.Count);

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
