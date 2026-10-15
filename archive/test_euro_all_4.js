// Тест: перебор ориентаций Евровинта 7х50 (Артикул 69)
NewModel();

var leftSide = AddVertPanel(0, 0, 560, 1000, 0); // X: [0 .. 16]
var bottomFloor = AddHorizPanel(16, 0, 560, 560, 60); // X: [16 .. 560], Y: [60 .. 76]

var euro = OpenFurniture('Евровинт 7х50 (Артикул 69)');

// 1. Попытка на наружной пласти боковины X=0 (винт входит по оси X):
euro.Mount(bottomFloor, leftSide, 0, 68, 100);

// 2. Попытка на стыке X=16:
euro.Mount(bottomFloor, leftSide, 16, 68, 200);

// 3. Обратный порядок: leftSide, bottomFloor на X=0:
euro.Mount(leftSide, bottomFloor, 0, 68, 300);

// 4. Обратный порядок: leftSide, bottomFloor на X=16:
euro.Mount(leftSide, bottomFloor, 16, 68, 400);

Action.Commit();
ViewAll();
SetCamera(p3dIsometric);
