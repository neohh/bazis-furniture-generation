# -*- coding: utf-8 -*-
import os
import zipfile

with open(r"z:\Work\генерация мебели\scripts\Ведомость деталей и кромления.js", "r", encoding="cp1251") as f:
    code = f.read().replace('\r\n', '\n')

# 1. detectModelName
detect_fn = '''    function detectModelName() {
        // 1. Попытка из Model.FileName
        if (Model.FileName && typeof Model.FileName === 'string' && Model.FileName.length > 0) {
            var clean = Model.FileName.replace(/\\\\/g, '/');
            var parts = clean.split('/');
            var fn = parts[parts.length - 1];
            if (fn) {
                var stripped = fn.replace(/\\.[^/.]+$/, "");
                if (stripped && stripped.trim().length > 0) {
                    return stripped.trim();
                }
            }
        }
        // 2. Попытка из Model.Name
        if (Model.Name && typeof Model.Name === 'string' && Model.Name.trim().length > 0) {
            var mName = Model.Name.trim();
            if (mName !== 'Модель' && mName !== 'Model') {
                return mName;
            }
        }
        // 3. Попытка из имени первого крупного блока/сборки модели
        if (Model.Count && Model.Count > 0) {
            for (var i = 0; i < Model.Count; i++) {
                var obj = Model.Objects ? Model.Objects[i] : Model[i];
                if (obj && obj.Name && !obj.AsPanel && obj.Count > 0) {
                    var bName = obj.Name.trim();
                    if (bName && bName !== 'Блок' && bName !== 'Модель') {
                        return bName;
                    }
                }
            }
        }
        return 'Шкаф';
    }

    var prop = Action.Properties;'''

assert '    var prop = Action.Properties;' in code
code = code.replace('    var prop = Action.Properties;', detect_fn, 1)

# 2. nameProp
params_old = '''    var grParams = prop.NewGroup('Параметры таблицы');
    var marginProp = grParams.NewNumber('Запас на кромку (%)', 5);'''

params_new = '''    var grParams = prop.NewGroup('Параметры таблицы');
    var nameProp = grParams.NewString('Название модели / шкафа', detectModelName());
    var marginProp = grParams.NewNumber('Запас на кромку (%)', 5);'''

assert params_old in code
code = code.replace(params_old, params_new, 1)

# 3. generateReport call
gen_old = '''        if (isExcelExport) {
            exportToCSV(partsData, totalEdgeLengths, chosenStyles, marginPct);
            return;
        }

        generateHTMLReport(partsData, totalEdgeLengths, chosenStyles, marginPct, smartGroupProp.Value);'''

gen_new = '''        var modelName = (nameProp && nameProp.Value && nameProp.Value.trim().length > 0) ? nameProp.Value.trim() : detectModelName();

        if (isExcelExport) {
            exportToCSV(partsData, totalEdgeLengths, chosenStyles, marginPct, modelName);
            return;
        }

        generateHTMLReport(partsData, totalEdgeLengths, chosenStyles, marginPct, smartGroupProp.Value, modelName);'''

assert gen_old in code
code = code.replace(gen_old, gen_new, 1)

# 4. generateHTMLReport header
html_fn_old = '''    function generateHTMLReport(rawParts, edgeTotals, styles, marginPct, initialSmartGroup) {
        var modelName = 'Шкаф';
        if (Model.FileName) {
            var partsPath = Model.FileName.split('\\\\');
            modelName = partsPath[partsPath.length - 1];
        }'''

html_fn_new = '''    function generateHTMLReport(rawParts, edgeTotals, styles, marginPct, initialSmartGroup, modelName) {
        if (!modelName || modelName.trim().length === 0) {
            modelName = detectModelName();
        }'''

assert html_fn_old in code
code = code.replace(html_fn_old, html_fn_new, 1)

# 5. Toolbar button + subtitle
toolbar_end_old = '''        html.push('<div class="tb-group">');
        html.push('<label class="tb-label" style="cursor:pointer;"><input type="checkbox" id="chkSmartGroup" checked onchange="toggleSmartGroup(this.checked)"> Умное объединение полок</label>');
        html.push('</div>');

        html.push('</div>'); // .toolbar

        html.push('<div class="page-box density-compact" id="pageBox">');
        html.push('<div class="title-bar">');
        html.push('<h1 class="title">Ведомость деталей и кромления</h1>');
        html.push('<div class="subtitle">Модель: <strong>' + modelName + '</strong> | Дата: ' + dateStr + '</div>');
        html.push('</div>');'''

sub_new = '''        html.push('<div class="tb-group">');
        html.push('<label class="tb-label" style="cursor:pointer;"><input type="checkbox" id="chkSmartGroup" checked onchange="toggleSmartGroup(this.checked)"> Умное объединение полок</label>');
        html.push('</div>');

        html.push('<div class="tb-group">');
        html.push('<button class="tb-btn tb-btn-preset" onclick="editTitlePrompt()" title="Нажмите, чтобы переименовать изделие">Изменить название</button>');
        html.push('</div>');

        html.push('</div>'); // .toolbar

        html.push('<div class="page-box density-compact" id="pageBox">');
        html.push('<div class="title-bar">');
        html.push('<h1 class="title">Ведомость деталей и кромления</h1>');
        html.push('<div class="subtitle">Модель: <strong id="modelTitle" contenteditable="true" spellcheck="false" title="Нажмите, чтобы отредактировать название прямо на листе" style="border-bottom: 1.5px dashed #0284c7; cursor: text; padding: 1px 6px; border-radius: 4px; background: rgba(2, 132, 199, 0.08); color: #0369a1;">' + modelName + '</strong> | Дата: ' + dateStr + '</div>');
        html.push('</div>');'''

assert toolbar_end_old in code
code = code.replace(toolbar_end_old, sub_new, 1)

# 6. JS handlers
render_start_old = '''        html.push('var rawData = ' + jsonRaw + ';');
        html.push('var stylesMap = ' + jsonStyles + ';');'''

render_start_new = '''        html.push('var rawData = ' + jsonRaw + ';');
        html.push('var stylesMap = ' + jsonStyles + ';');

        html.push('function editTitlePrompt() {');
        html.push('  var el = document.getElementById("modelTitle");');
        html.push('  var current = el ? el.innerText.trim() : "";');
        html.push('  var res = prompt("Введите название модели / шкафа для ведомости:", current);');
        html.push('  if (res !== null && res.trim().length > 0) {');
        html.push('    if (el) el.innerText = res.trim();');
        html.push('    document.title = "Ведомость деталей и кромления - " + res.trim();');
        html.push('  }');
        html.push('}');

        html.push('document.addEventListener("DOMContentLoaded", function() {');
        html.push('  var titleEl = document.getElementById("modelTitle");');
        html.push('  if (titleEl) {');
        html.push('    titleEl.addEventListener("input", function() {');
        html.push('      document.title = "Ведомость деталей и кромления - " + titleEl.innerText.trim();');
        html.push('    });');
        html.push('  }');
        html.push('});');'''

assert render_start_old in code
code = code.replace(render_start_old, render_start_new, 1)

# 7. downloadPNG filename
dl_old = '''        html.push('        link.download = "Ведомость_деталей_кромления.png";');'''
dl_new = '''        html.push('        var tEl = document.getElementById("modelTitle");');
        html.push('        var tSanitized = (tEl ? tEl.innerText.trim() : "").replace(/[\\\\/:*?"<>|]/g, "_");');
        html.push('        link.download = "Ведомость_" + (tSanitized ? tSanitized : "деталей_кромления") + ".png";');'''

assert dl_old in code
code = code.replace(dl_old, dl_new, 1)

# 8. savePath
save_old = '''        var savePath = '';
        if (Model.FileName) {
            savePath = Model.FileName.replace(/\\.[^/.]+$/, "") + "_ведомость_деталей.html";
        } else {
            savePath = 'C:\\\\Users\\\\maxim\\\\OneDrive\\\\Desktop\\\\Ведомость_деталей_и_кромления.html';
        }'''

save_new = '''        var safeModelName = modelName.replace(/[\\\\/:*?"<>|]/g, "_");
        var savePath = '';
        if (Model.FileName) {
            savePath = Model.FileName.replace(/\\.[^/.]+$/, "") + "_ведомость_деталей.html";
        } else {
            savePath = 'C:\\\\Users\\\\maxim\\\\OneDrive\\\\Desktop\\\\Ведомость_' + safeModelName + '.html';
        }'''

assert save_old in code
code = code.replace(save_old, save_new, 1)

# 9. CSV export
csv_old = '''    function exportToCSV(parts, edgeTotals, styles, marginPct) {
        var csvLines = [];
        csvLines.push('Поз.;Длина;Ширина;Кол-во;Кромка_Длина;Кромка_Ширина');'''

csv_new = '''    function exportToCSV(parts, edgeTotals, styles, marginPct, modelName) {
        var csvLines = [];
        csvLines.push('Изделие: ' + modelName);
        csvLines.push('Поз.;Длина;Ширина;Кол-во;Кромка_Длина;Кромка_Ширина');'''

assert csv_old in code
code = code.replace(csv_old, csv_new, 1)

csv_save_old = '''        var csvPath = '';
        if (Model.FileName) {
            csvPath = Model.FileName.replace(/\\.[^/.]+$/, "") + "_ведомость_деталей.csv";
        } else {
            csvPath = 'C:\\\\Users\\\\maxim\\\\OneDrive\\\\Desktop\\\\Ведомость_деталей_и_кромления.csv';
        }'''

csv_save_new = '''        var safeModelName = (modelName || 'деталей').replace(/[\\\\/:*?"<>|]/g, "_");
        var csvPath = '';
        if (Model.FileName) {
            csvPath = Model.FileName.replace(/\\.[^/.]+$/, "") + "_ведомость_деталей.csv";
        } else {
            csvPath = 'C:\\\\Users\\\\maxim\\\\OneDrive\\\\Desktop\\\\Ведомость_' + safeModelName + '.csv';
        }'''

assert csv_save_old in code
code = code.replace(csv_save_old, csv_save_new, 1)

# Final code with Windows CRLF
final_code = code.replace('\n', '\r\n')

# Write to all destinations in CP1251
dest_dirs = [
    r"z:\Work\генерация мебели\scripts",
    r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts",
    r"C:\Users\maxim\OneDrive\Документы\Bazis\Scripts\Генерация мебели",
    r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts",
    r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ\Bazis_Documents\Scripts\Генерация мебели"
]

script_filename = "Ведомость деталей и кромления.js"

for d in dest_dirs:
    os.makedirs(d, exist_ok=True)
    p = os.path.join(d, script_filename)
    with open(p, "w", encoding="cp1251") as f:
        f.write(final_code)
    print(f"Written {script_filename} to {p}")

# Rebuild БАЗИС_ЛАЙТ.zip cleanly
desktop_folder = r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ"
zip_path = r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ.zip"
temp_zip = r"C:\Users\maxim\Desktop\БАЗИС_ЛАЙТ_tmp.zip"

if os.path.exists(desktop_folder):
    file_count = 0
    with zipfile.ZipFile(temp_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(desktop_folder):
            for f in files:
                full_path = os.path.join(root, f)
                arcname = os.path.relpath(full_path, desktop_folder)
                zf.write(full_path, arcname)
                file_count += 1
    os.replace(temp_zip, zip_path)
    print(f"Cleanly updated БАЗИС_ЛАЙТ.zip ({file_count} files)")

print("All tasks completed successfully!")
