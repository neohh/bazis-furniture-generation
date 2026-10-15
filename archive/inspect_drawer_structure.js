// Inspect internal structure and elasticity of loaded drawer
var drawerPath = 'C:\\Users\\maxim\\Downloads\\ящик НОВЫЙ.f3d';

NewModel();
var blk = AddBlock('Проверочный ящик');
blk.Load(drawerPath);

function checkBlock(obj, indent) {
    var info = indent + obj.Name + ' [' + obj.constructor.name + ']';
    if (obj.IsElastic) {
        info += ' | IsElastic=' + obj.IsElastic();
    }
    if (obj.Elastic) {
        info += ' | Elastic prop=' + obj.Elastic;
    }
    if (obj.Elasticity) {
        info += ' | Elasticity obj=' + obj.Elasticity;
    }
    var res = [info];
    if (obj.Count) {
        for (var i = 0; i < obj.Count; i++) {
            res = res.concat(checkBlock(obj.Objects[i], indent + '  '));
        }
    }
    return res;
}

var lines = checkBlock(blk, '');
alert(lines.slice(0, 15).join('\n'));
