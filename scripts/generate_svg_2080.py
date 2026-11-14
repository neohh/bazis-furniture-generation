# -*- coding: utf-8 -*-
import os

def generate_svg():
    target_dir = r"z:\Work\генерация мебели\Модели\Шкафы"
    os.makedirs(target_dir, exist_ok=True)
    svg_file = os.path.join(target_dir, "чертеж_двух_шкафов_2080.svg")

    # Coordinates in SVG (Y=0 is floor at SVG Y=2750, Y=2660 is ceiling at SVG Y=90)
    H = 2660
    W_total = 2080

    def sy(y):
        return 2750 - y

    svg = []
    svg.append('<?xml version="1.0" encoding="utf-8"?>')
    svg.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-250 -320 4450 3300" width="100%" height="100%" style="background-color: #ffffff; font-family: \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;">')
    svg.append('  <defs>')
    
    # Patterns
    svg.append('''    <!-- Каркас ЛДСП 16 мм -->
    <pattern id="hatch-carcass" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="#f8f9fa" />
      <line x1="0" y1="0" x2="0" y2="16" stroke="#7f8c8d" stroke-width="2.5" />
    </pattern>
    <!-- Каркас ЛДСП 26 мм -->
    <pattern id="hatch-thick26" width="20" height="20" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <rect width="20" height="20" fill="#f1f8e9" />
      <line x1="0" y1="0" x2="0" y2="20" stroke="#33691e" stroke-width="3.5" />
    </pattern>
    <!-- Полки жесткие фиолетовые -->
    <pattern id="hatch-fixed" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="#f3e5f5" />
      <line x1="0" y1="0" x2="0" y2="16" stroke="#7b1fa2" stroke-width="2.5" />
    </pattern>
    <!-- Полки съемные оранжевые -->
    <pattern id="hatch-removable" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <rect width="16" height="16" fill="#fff3e0" />
      <line x1="0" y1="0" x2="0" y2="16" stroke="#ef6c00" stroke-width="2.5" />
    </pattern>
    <!-- Зона выреза под счетчики -->
    <pattern id="hatch-cutout" width="12" height="12" patternTransform="rotate(-45 0 0)" patternUnits="userSpaceOnUse">
      <rect width="12" height="12" fill="#ffebee" />
      <line x1="0" y1="0" x2="0" y2="12" stroke="#e53935" stroke-width="2" />
    </pattern>
    <!-- Задний отступ 50 мм -->
    <pattern id="hatch-gap" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
      <rect width="10" height="10" fill="#eceff1" />
      <line x1="0" y1="0" x2="0" y2="10" stroke="#90a4ae" stroke-width="1.5" />
    </pattern>

    <!-- Маркеры стрелок -->
    <marker id="arrow-start-red" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M9,0 L0,3 L9,6 z" fill="#d32f2f" />
    </marker>
    <marker id="arrow-end-red" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L9,3 L0,6 z" fill="#d32f2f" />
    </marker>
    <marker id="arrow-start-amber" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M9,0 L0,3 L9,6 z" fill="#f57c00" />
    </marker>
    <marker id="arrow-end-amber" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L9,3 L0,6 z" fill="#f57c00" />
    </marker>
    <marker id="arrow-start-blue" markerWidth="10" markerHeight="10" refX="0" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M9,0 L0,3 L9,6 z" fill="#1565c0" />
    </marker>
    <marker id="arrow-end-blue" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L9,3 L0,6 z" fill="#1565c0" />
    </marker>''')
    svg.append('  </defs>\n')

    # Header Title Banner
    svg.append('  <!-- ==================== ШАПКА ПРОЕКТА ==================== -->')
    svg.append('  <rect x="-200" y="-280" width="4350" height="120" fill="#1a237e" rx="8" />')
    svg.append('  <text x="-150" y="-210" fill="#ffffff" font-size="40" font-weight="bold">КОМПЛЕКС ИЗ ДВУХ ШКАФОВ (L=2080 мм, H=2660 мм) С ВЫРЕЗОМ ПОД СЧЕТЧИКИ</text>')
    svg.append('  <text x="-150" y="-175" fill="#9fa8da" font-size="22">Модуль 1 (ЛДСП 26 мм, высокое дно 600) | Ниша 1200 мм | Модуль 2 (ЛДСП 16 мм, цоколь 150, вырез счетчиков Y=1250..1430)</text>\n')

    # Floor and Ceiling reference lines
    svg.append('  <!-- Пол и Потолок -->')
    svg.append(f'  <line x1="-150" y1="{sy(0)}" x2="3100" y2="{sy(0)}" stroke="#37474f" stroke-width="4" />')
    svg.append(f'  <text x="-150" y="{sy(0) + 35}" fill="#37474f" font-size="22" font-weight="bold">УРОВЕНЬ ЧИСТОГО ПОЛА (Y = 0)</text>')
    svg.append(f'  <line x1="-150" y1="{sy(2660)}" x2="3100" y2="{sy(2660)}" stroke="#78909c" stroke-width="2" stroke-dasharray="10,6" />')
    svg.append(f'  <text x="-150" y="{sy(2660) - 20}" fill="#78909c" font-size="22" font-weight="bold">ПОТОЛОК (H = 2660 мм)</text>\n')

    # =========================================================================
    # VIEW 1: FRONT ELEVATION (ВИД СПЕРЕДИ)
    # Composition: Cabinet 1 (X: 0..180), Gap (X: 180..1380), Cabinet 2 (X: 1380..2080)
    # =========================================================================
    svg.append('  <!-- ==================== ВИД СПЕРЕДИ (ГЛАВНЫЙ ВИД) ==================== -->')
    svg.append('  <g id="view-front">')
    svg.append(f'    <text x="0" y="{sy(2660) - 100}" fill="#0d47a1" font-size="28" font-weight="bold">1. ВИД СПЕРЕДИ: ОБЩАЯ КОМПОЗИЦИЯ (L = 2080 мм)</text>')

    # Cabinet 1 (Option A: W=180, per strict formula 2080 - 1200 - 700 = 180)
    c1_x = 0
    c1_w = 180
    t26 = 26
    c1_inner_w = c1_w - 2 * t26 # 128 mm

    svg.append('    <!-- ШКАФ 1 (ЛЕВЫЙ ПОРТАЛ / СТЕЛЛАЖ): ЛДСП 26 мм, высокое дно 600 мм -->')
    svg.append('    <g id="cabinet-1">')
    # Background panel (ЛДСП back)
    svg.append(f'      <rect x="{c1_x + t26}" y="{sy(2634)}" width="{c1_inner_w}" height="{2634 - 626}" fill="#e8f5e9" stroke="#81c784" stroke-width="1.5" />')
    svg.append(f'      <text x="{c1_x + c1_w/2}" y="{sy(1600)}" fill="#2e7d32" font-size="16" font-weight="bold" text-anchor="middle" transform="rotate(-90 {c1_x + c1_w/2} {sy(1600)})">Задняя стенка ЛДСП</text>')
    
    # Left side (26 mm)
    svg.append(f'      <rect x="{c1_x}" y="{sy(2660)}" width="{t26}" height="2660" fill="url(#hatch-thick26)" stroke="#1b5e20" stroke-width="2" />')
    # Right side (26 mm)
    svg.append(f'      <rect x="{c1_x + c1_w - t26}" y="{sy(2660)}" width="{t26}" height="2660" fill="url(#hatch-thick26)" stroke="#1b5e20" stroke-width="2" />')
    # Top panel (26 mm)
    svg.append(f'      <rect x="{c1_x + t26}" y="{sy(2660)}" width="{c1_inner_w}" height="{t26}" fill="url(#hatch-thick26)" stroke="#1b5e20" stroke-width="2" />')
    # Raised bottom panel (26 mm at Y = 600..626)
    svg.append(f'      <rect x="{c1_x + t26}" y="{sy(626)}" width="{c1_inner_w}" height="{t26}" fill="url(#hatch-thick26)" stroke="#1b5e20" stroke-width="2" />')
    
    # Clothes rail / rod
    svg.append(f'      <line x1="{c1_x + t26}" y1="{sy(2500)}" x2="{c1_x + c1_w - t26}" y2="{sy(2500)}" stroke="#c2185b" stroke-width="5" />')
    svg.append(f'      <circle cx="{c1_x + t26 + 10}" cy="{sy(2500)}" r="6" fill="#c2185b" />')
    svg.append(f'      <circle cx="{c1_x + c1_w - t26 - 10}" cy="{sy(2500)}" r="6" fill="#c2185b" />')
    
    # Open bottom niche 600 mm
    svg.append(f'      <rect x="{c1_x + t26}" y="{sy(600)}" width="{c1_inner_w}" height="600" fill="#fafafa" stroke="#cfd8dc" stroke-dasharray="6,4" />')
    svg.append(f'      <text x="{c1_x + c1_w/2}" y="{sy(300)}" fill="#546e7a" font-size="16" font-weight="bold" text-anchor="middle" transform="rotate(-90 {c1_x + c1_w/2} {sy(300)})">Ниша 600 мм</text>')
    svg.append('    </g>\n')

    # Dimension lines for Cabinet 1
    svg.append(f'    <line x1="{c1_x}" y1="{sy(2660) - 40}" x2="{c1_x + c1_w}" y2="{sy(2660) - 40}" stroke="#d32f2f" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{c1_x + c1_w/2}" y="{sy(2660) - 50}" fill="#d32f2f" font-size="20" font-weight="bold" text-anchor="middle">180</text>')
    # Bottom clear opening 600
    svg.append(f'    <line x1="{c1_x - 40}" y1="{sy(0)}" x2="{c1_x - 40}" y2="{sy(600)}" stroke="#d32f2f" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{c1_x - 50}" y="{sy(300)}" fill="#d32f2f" font-size="20" font-weight="bold" text-anchor="end">600</text>')
    # Panel thickness 26
    svg.append(f'    <text x="{c1_x + 13}" y="{sy(2660) - 10}" fill="#1b5e20" font-size="14" font-weight="bold" text-anchor="middle">26</text>')
    svg.append(f'    <text x="{c1_x + c1_w - 13}" y="{sy(2660) - 10}" fill="#1b5e20" font-size="14" font-weight="bold" text-anchor="middle">26</text>')

    # NICHE / GAP = 1200 mm
    gap_x1 = c1_w
    gap_x2 = c1_w + 1200 # 1380
    svg.append('    <!-- ПРОЕМ / НИША МЕЖДУ ШКАФАМИ = 1200 мм -->')
    svg.append('    <g id="gap-niche">')
    svg.append(f'      <rect x="{gap_x1}" y="{sy(2660)}" width="1200" height="2660" fill="#fcfcfc" stroke="#b0bec5" stroke-dasharray="8,8" />')
    svg.append(f'      <text x="{gap_x1 + 600}" y="{sy(1330)}" fill="#78909c" font-size="32" font-weight="bold" text-anchor="middle">ПРОЕМ / НИША (1200 мм)</text>')
    svg.append(f'      <text x="{gap_x1 + 600}" y="{sy(1270)}" fill="#90a4ae" font-size="20" text-anchor="middle">(Рабочая зона / стол / проход / вешалка)</text>')
    svg.append(f'      <line x1="{gap_x1}" y1="{sy(2660) - 40}" x2="{gap_x2}" y2="{sy(2660) - 40}" stroke="#d32f2f" stroke-width="2.5" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'      <text x="{gap_x1 + 600}" y="{sy(2660) - 50}" fill="#d32f2f" font-size="24" font-weight="bold" text-anchor="middle">1200</text>')
    svg.append('    </g>\n')

    # CABINET 2: W=700, H=2660, ЛДСП 16 мм, Socle 150, Mezzanine 2100, 3 shelves, meter cutout
    c2_x = 1380
    c2_w = 700
    t16 = 16
    c2_inner_w = c2_w - 2 * t16 # 668 mm

    svg.append('    <!-- ШКАФ 2 (ПРАВЫЙ ШКАФ 700 мм): ЛДСП 16 мм, цоколь 150, вырез счетчиков -->')
    svg.append('    <g id="cabinet-2">')
    # Left side (16 мм)
    svg.append(f'      <rect x="{c2_x}" y="{sy(2660)}" width="{t16}" height="2660" fill="url(#hatch-carcass)" stroke="#2c3e50" stroke-width="2" />')
    # Right side (16 мм)
    svg.append(f'      <rect x="{c2_x + c2_w - t16}" y="{sy(2660)}" width="{t16}" height="2660" fill="url(#hatch-carcass)" stroke="#2c3e50" stroke-width="2" />')
    # Top roof (16 мм)
    svg.append(f'      <rect x="{c2_x + t16}" y="{sy(2660)}" width="{c2_inner_w}" height="{t16}" fill="url(#hatch-carcass)" stroke="#2c3e50" stroke-width="2" />')
    # Socle (150 mm)
    svg.append(f'      <rect x="{c2_x + t16}" y="{sy(150)}" width="{c2_inner_w}" height="150" fill="#cfd8dc" stroke="#455a64" stroke-width="1.5" />')
    svg.append(f'      <text x="{c2_x + c2_w/2}" y="{sy(75) + 6}" fill="#37474f" font-size="18" font-weight="bold" text-anchor="middle">Цоколь H=150 (отступ 30 мм)</text>')
    # Bottom panel (16 mm at Y=150..166)
    svg.append(f'      <rect x="{c2_x + t16}" y="{sy(166)}" width="{c2_inner_w}" height="{t16}" fill="url(#hatch-carcass)" stroke="#2c3e50" stroke-width="2" />')
    
    # Mezzanine fixed shelf (Y=2100..2116)
    svg.append(f'      <rect x="{c2_x + t16}" y="{sy(2116)}" width="{c2_inner_w}" height="{t16}" fill="url(#hatch-fixed)" stroke="#4a148c" stroke-width="2" />')
    svg.append(f'      <line x1="{c2_x + t16}" y1="{sy(2116)}" x2="{c2_x + c2_w - t16}" y2="{sy(2644)}" stroke="#ba68c8" stroke-width="1.5" stroke-dasharray="8,6" />')
    svg.append(f'      <text x="{c2_x + c2_w/2}" y="{sy(2380)}" fill="#6a1b9a" font-size="22" font-weight="bold" text-anchor="middle">Антресоль (свет: 528 мм)</text>')
    
    # 3 Shelves:
    s1_y = 638
    s2_y = 1125
    s3_y = 1613
    for sy_pos, num in [(s1_y, 1), (s2_y, 2), (s3_y, 3)]:
        svg.append(f'      <rect x="{c2_x + t16}" y="{sy(sy_pos + t16)}" width="{c2_inner_w}" height="{t16}" fill="url(#hatch-removable)" stroke="#e65100" stroke-width="2" />')
        svg.append(f'      <text x="{c2_x + t16 + 10}" y="{sy(sy_pos + 4)}" fill="#1565c0" font-size="14" font-weight="bold">п</text>')
        svg.append(f'      <text x="{c2_x + c2_w - t16 - 20}" y="{sy(sy_pos + 4)}" fill="#1565c0" font-size="14" font-weight="bold">п</text>')
    
    # Utility meter cutout projection in Front View
    svg.append(f'      <rect x="{c2_x + c2_w - t16 - 150}" y="{sy(1430)}" width="150" height="180" fill="url(#hatch-cutout)" stroke="#d32f2f" stroke-width="2.5" stroke-dasharray="6,4" />')
    svg.append(f'      <text x="{c2_x + c2_w - t16 - 75}" y="{sy(1350)}" fill="#d32f2f" font-size="15" font-weight="bold" text-anchor="middle">ВЫРЕЗ ПОД</text>')
    svg.append(f'      <text x="{c2_x + c2_w - t16 - 75}" y="{sy(1330)}" fill="#d32f2f" font-size="15" font-weight="bold" text-anchor="middle">СЧЕТЧИКИ</text>')
    svg.append(f'      <text x="{c2_x + c2_w - t16 - 75}" y="{sy(1310)}" fill="#d32f2f" font-size="13" font-weight="bold" text-anchor="middle">180×(глубина)</text>')
    
    # Clearances
    svg.append(f'      <text x="{c2_x + c2_w - 200}" y="{sy(1190)}" fill="#2e7d32" font-size="14" font-weight="bold">Зазор до полки: 109 мм ✓</text>')
    svg.append(f'      <text x="{c2_x + c2_w - 200}" y="{sy(1510)}" fill="#2e7d32" font-size="14" font-weight="bold">Зазор до полки: 183 мм ✓</text>')
    svg.append('    </g>\n')

    # Dimensions for Cabinet 2
    svg.append(f'    <line x1="{c2_x}" y1="{sy(2660) - 40}" x2="{c2_x + c2_w}" y2="{sy(2660) - 40}" stroke="#d32f2f" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{c2_x + c2_w/2}" y="{sy(2660) - 50}" fill="#d32f2f" font-size="20" font-weight="bold" text-anchor="middle">700</text>')
    # Socle height 150
    svg.append(f'    <line x1="{c2_x + c2_w + 35}" y1="{sy(0)}" x2="{c2_x + c2_w + 35}" y2="{sy(150)}" stroke="#d32f2f" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{c2_x + c2_w + 45}" y="{sy(75) + 6}" fill="#d32f2f" font-size="18" font-weight="bold">150</text>')
    # Cutout bottom 1250
    svg.append(f'    <line x1="{c2_x + c2_w + 80}" y1="{sy(0)}" x2="{c2_x + c2_w + 80}" y2="{sy(1250)}" stroke="#d32f2f" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{c2_x + c2_w + 90}" y="{sy(625)}" fill="#d32f2f" font-size="18" font-weight="bold">1250 (низ выреза)</text>')
    # Cutout height 180
    svg.append(f'    <line x1="{c2_x + c2_w + 35}" y1="{sy(1250)}" x2="{c2_x + c2_w + 35}" y2="{sy(1430)}" stroke="#d32f2f" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{c2_x + c2_w + 45}" y="{sy(1340) + 6}" fill="#d32f2f" font-size="18" font-weight="bold">180</text>')
    
    # Vertical niche openings in Cabinet 2
    niches = [
        (166, 638, "472 мм (в свету)"),
        (654, 1125, "471 мм (в свету)"),
        (1141, 1613, "472 мм (в свету)"),
        (1629, 2100, "471 мм (в свету)"),
        (2116, 2644, "528 мм (антресоль)")
    ]
    for y1, y2, lbl in niches:
        mid_y = (y1 + y2) / 2
        svg.append(f'      <line x1="{c2_x + 50}" y1="{sy(y1)}" x2="{c2_x + 50}" y2="{sy(y2)}" stroke="#f57c00" stroke-width="1.8" stroke-dasharray="6,4" marker-start="url(#arrow-start-amber)" marker-end="url(#arrow-end-amber)" />')
        svg.append(f'      <text x="{c2_x + 65}" y="{sy(mid_y) + 6}" fill="#e65100" font-size="16" font-weight="bold">{lbl}</text>')

    # Total width dimension 2080 at the bottom
    svg.append('    <!-- ОБЩИЙ РАЗМЕР ПО ПОЛУ = 2080 мм -->')
    svg.append(f'    <line x1="0" y1="{sy(-70)}" x2="{W_total}" y2="{sy(-70)}" stroke="#d32f2f" stroke-width="3" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{W_total/2}" y="{sy(-70) + 35}" fill="#d32f2f" font-size="28" font-weight="bold" text-anchor="middle">ОБЩИЙ ГАБАРИТ КОМПОЗИЦИИ = 2080 мм</text>')
    svg.append('  </g>\n')

    # =========================================================================
    # VIEW 2: RIGHT SIDE SECTION OF CABINET 2 (ВИД СПРАВА / РАЗРЕЗ)
    # Depth = 600 mm, Height = 2660 mm, showing 50 mm rear setback and 30 mm front socle setback
    # Placed at X = 2320..2920
    # =========================================================================
    s_x = 2320
    s_d = 600
    svg.append('  <!-- ==================== ВИД СПРАВА / РАЗРЕЗ ПРАВОГО ШКАФА ==================== -->')
    svg.append('  <g id="view-side-section">')
    svg.append(f'    <text x="{s_x}" y="{sy(2660) - 100}" fill="#0d47a1" font-size="28" font-weight="bold">2. СЕЧЕНИЕ / ВИД СПРАВА ШКАФА 2 (D = 600 мм)</text>')
    svg.append(f'    <text x="{s_x}" y="{sy(2660) - 70}" fill="#546e7a" font-size="18">Показан вырез под счетчики, отступ от стены 50 мм и утопленный цоколь 30 мм</text>')

    # Rear wall line
    svg.append(f'    <line x1="{s_x}" y1="{sy(0)}" x2="{s_x}" y2="{sy(2660)}" stroke="#37474f" stroke-width="4" />')
    svg.append(f'    <text x="{s_x - 15}" y="{sy(1330)}" fill="#37474f" font-size="18" font-weight="bold" text-anchor="middle" transform="rotate(-90 {s_x - 15} {sy(1330)})">СТЕНА ПОМЕЩЕНИЯ</text>')

    # Outer side panel boundary
    svg.append(f'    <rect x="{s_x}" y="{sy(2660)}" width="{s_d}" height="2660" fill="none" stroke="#2c3e50" stroke-width="2.5" />')

    # 50 mm rear gap zone
    svg.append(f'    <rect x="{s_x}" y="{sy(2660)}" width="50" height="2660" fill="url(#hatch-gap)" stroke="#90a4ae" stroke-width="1" stroke-dasharray="4,4" />')
    svg.append(f'    <text x="{s_x + 25}" y="{sy(2000)}" fill="#546e7a" font-size="14" font-weight="bold" text-anchor="middle" transform="rotate(-90 {s_x + 25} {sy(2000)})">ОТСТУП 50 мм ПОД КОММУНИКАЦИИ</text>')

    # Internal panels depth = 550 mm (from s_x+50 to s_x+600)
    svg.append(f'    <rect x="{s_x + 50}" y="{sy(166)}" width="550" height="16" fill="url(#hatch-carcass)" stroke="#2c3e50" stroke-width="1.5" />')
    svg.append(f'    <rect x="{s_x + 50}" y="{sy(2660)}" width="550" height="16" fill="url(#hatch-carcass)" stroke="#2c3e50" stroke-width="1.5" />')
    
    # Socle (front setback 30 mm)
    svg.append(f'    <rect x="{s_x + 600 - 30 - 16}" y="{sy(150)}" width="16" height="150" fill="#cfd8dc" stroke="#37474f" stroke-width="2" />')
    svg.append(f'    <line x1="{s_x + 600}" y1="{sy(40)}" x2="{s_x + 600 - 30}" y2="{sy(40)}" stroke="#d32f2f" stroke-width="1.8" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{s_x + 585}" y="{sy(40) - 8}" fill="#d32f2f" font-size="14" font-weight="bold" text-anchor="middle">отступ 30</text>')

    # Shelves in side section (depth = 550 mm)
    for sy_pos in [s1_y, s2_y, s3_y, 2100]:
        fill_pat = "url(#hatch-fixed)" if sy_pos == 2100 else "url(#hatch-removable)"
        stroke_col = "#4a148c" if sy_pos == 2100 else "#e65100"
        svg.append(f'    <rect x="{s_x + 50}" y="{sy(sy_pos + 16)}" width="550" height="16" fill="{fill_pat}" stroke="{stroke_col}" stroke-width="1.5" />')

    # Utility Meter Cutout on right side panel:
    cut_w = 320
    cut_x = s_x + 50
    svg.append(f'    <rect x="{cut_x}" y="{sy(1430)}" width="{cut_w}" height="180" fill="url(#hatch-cutout)" stroke="#d32f2f" stroke-width="3" />')
    svg.append(f'    <text x="{cut_x + cut_w/2}" y="{sy(1350)}" fill="#b71c1c" font-size="20" font-weight="bold" text-anchor="middle">ВЫРЕЗ В БОКОВИНЕ</text>')
    svg.append(f'    <text x="{cut_x + cut_w/2}" y="{sy(1320)}" fill="#b71c1c" font-size="18" font-weight="bold" text-anchor="middle">180 × {cut_w} мм (СЧЕТЧИКИ)</text>')

    # Facade line (600 + фасад 16 мм)
    svg.append(f'    <rect x="{s_x + 600}" y="{sy(2660)}" width="16" height="540" fill="#e1f5fe" stroke="#0288d1" stroke-width="2" />')
    svg.append(f'    <rect x="{s_x + 600}" y="{sy(2100)}" width="16" height="1940" fill="#e1f5fe" stroke="#0288d1" stroke-width="2" />')
    svg.append(f'    <text x="{s_x + 630}" y="{sy(1330)}" fill="#0288d1" font-size="18" font-weight="bold" text-anchor="middle" transform="rotate(90 {s_x + 630} {sy(1330)})">ФАСАДЫ ЛДСП 16 мм</text>')

    # Depth dimensions
    svg.append(f'    <line x1="{s_x}" y1="{sy(-30)}" x2="{s_x + 600}" y2="{sy(-30)}" stroke="#d32f2f" stroke-width="2.5" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{s_x + 300}" y="{sy(-30) + 30}" fill="#d32f2f" font-size="22" font-weight="bold" text-anchor="middle">Глубина боковины = 600 мм</text>')
    
    svg.append(f'    <line x1="{s_x}" y1="{sy(-90)}" x2="{s_x + 616}" y2="{sy(-90)}" stroke="#0288d1" stroke-width="2" marker-start="url(#arrow-start-blue)" marker-end="url(#arrow-end-blue)" />')
    svg.append(f'    <text x="{s_x + 308}" y="{sy(-90) + 26}" fill="#0288d1" font-size="18" font-weight="bold" text-anchor="middle">Габарит с фасадом = 616 мм</text>')

    # 50 mm dimension on top
    svg.append(f'    <line x1="{s_x}" y1="{sy(2660) - 20}" x2="{s_x + 50}" y2="{sy(2660) - 20}" stroke="#d32f2f" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{s_x + 25}" y="{sy(2660) - 30}" fill="#d32f2f" font-size="16" font-weight="bold" text-anchor="middle">50</text>')

    svg.append('  </g>\n')

    # =========================================================================
    # INFORMATION & TECHNICAL SPECIFICATION PANEL (ПРАВАЯ ПАНЕЛЬ)
    # Placed at X = 3120..4150
    # =========================================================================
    p_x = 3120
    svg.append('  <!-- ==================== ИНФОРМАЦИОННАЯ ПАНЕЛЬ ==================== -->')
    svg.append('  <g id="info-panel">')
    svg.append(f'    <rect x="{p_x}" y="{sy(2660) - 100}" width="1020" height="2850" fill="#f8f9fa" stroke="#b0bec5" stroke-width="2" rx="10" />')
    
    # Section 1: Title
    svg.append(f'    <rect x="{p_x}" y="{sy(2660) - 100}" width="1020" height="70" fill="#37474f" rx="10" />')
    svg.append(f'    <text x="{p_x + 30}" y="{sy(2660) - 55}" fill="#ffffff" font-size="26" font-weight="bold">СПЕЦИФИКАЦИЯ И РАСЧЕТ ПРОЕМОВ В СВЕТУ</text>')

    # Section 2: Parameters of Cabinet 1
    svg.append(f'    <text x="{p_x + 30}" y="{sy(2520)}" fill="#1b5e20" font-size="22" font-weight="bold">МОДУЛЬ 1 (ЛЕВЫЙ ПОРТАЛ / СТЕЛЛАЖ):</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2470)}" fill="#263238" font-size="18">• Материал: <tspan font-weight="bold" fill="#1b5e20">ЛДСП 26 мм</tspan> (боковины, верх, дно, полки)</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2430)}" fill="#263238" font-size="18">• Габариты: <tspan font-weight="bold">180 (или 1200) × 2660 × 620 мм</tspan></text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2390)}" fill="#263238" font-size="18">• Базовый блок: <tspan font-weight="bold">Высокое дно без цоколя</tspan></text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2350)}" fill="#263238" font-size="18">• Нижний открытый проем: <tspan font-weight="bold" fill="#d32f2f">600 мм</tspan> от пола в свету</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2310)}" fill="#263238" font-size="18">• Основной проем: <tspan font-weight="bold">2008 мм</tspan> (2634 - 626 мм)</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2270)}" fill="#263238" font-size="18">• Наполнение: штанга овальная (Y=2500 мм), задняя стенка ЛДСП</text>')

    # Section 3: The Big Question on Module 1 Width
    svg.append(f'    <rect x="{p_x + 20}" y="{sy(2230)}" width="980" height="280" fill="#fff9c4" stroke="#fbc02d" stroke-width="2" rx="6" />')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(2190)}" fill="#f57f17" font-size="20" font-weight="bold">ВАЖНЫЙ ВОПРОС ПО ШИРИНЕ МОДУЛЯ 1 (2080 - 1200 - 700):</text>')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(2145)}" fill="#37474f" font-size="16">• <tspan font-weight="bold">Вариант А (как на чертеже):</tspan> Модуль 1 = <tspan font-weight="bold" fill="#d32f2f">180 мм</tspan>, Ниша = <tspan font-weight="bold" fill="#d32f2f">1200 мм</tspan>, Шкаф 2 = 700 мм.</text>')
    svg.append(f'    <text x="{p_x + 60}" y="{sy(2115)}" fill="#546e7a" font-size="15">Внутренний проем Модуля 1 при толщине 26 мм: 180 - 52 = 128 мм.</text>')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(2070)}" fill="#37474f" font-size="16">• <tspan font-weight="bold">Вариант Б (инверсия):</tspan> Модуль 1 = <tspan font-weight="bold" fill="#2e7d32">1200 мм</tspan>, Ниша = <tspan font-weight="bold" fill="#2e7d32">180 мм</tspan>, Шкаф 2 = 700 мм.</text>')
    svg.append(f'    <text x="{p_x + 60}" y="{sy(2040)}" fill="#546e7a" font-size="15">Внутренний проем Модуля 1: 1200 - 52 = 1148 мм (идеально под штангу!).</text>')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(1995)}" fill="#c2185b" font-size="16" font-weight="bold">-> Подтвердите, какой вариант ширины Модуля 1 строить в Базисе!</text>')

    # Section 4: Parameters of Cabinet 2
    svg.append(f'    <text x="{p_x + 30}" y="{sy(1915)}" fill="#0d47a1" font-size="22" font-weight="bold">МОДУЛЬ 2 (ПРАВЫЙ ШКАФ С РАСПАШНЫМИ ДВЕРЯМИ):</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(1870)}" fill="#263238" font-size="18">• Материал: <tspan font-weight="bold">ЛДСП 16 мм</tspan></text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(1835)}" fill="#263238" font-size="18">• Габариты: <tspan font-weight="bold">700 × 2660 × 600 мм</tspan> (+ фасад 16 мм)</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(1800)}" fill="#263238" font-size="18">• Базовый блок: <tspan font-weight="bold">База с цоколем без козырька</tspan></text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(1765)}" fill="#263238" font-size="18">• Высота цоколя: <tspan font-weight="bold" fill="#d32f2f">150 мм</tspan> (отступ спереди: 30 мм)</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(1730)}" fill="#263238" font-size="18">• Задний отступ от стены: <tspan font-weight="bold" fill="#d32f2f">50 мм</tspan> (глубина полок 550 мм)</text>')

    # Section 5: Cutout Safety Calculation
    svg.append(f'    <rect x="{p_x + 20}" y="{sy(1685)}" width="980" height="240" fill="#e8f5e9" stroke="#4caf50" stroke-width="2" rx="6" />')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(1645)}" fill="#1b5e20" font-size="20" font-weight="bold">КОНТРОЛЬ ЗОНЫ ВЫРЕЗА ПОД СЧЕТЧИКИ (Y = 1250..1430 мм):</text>')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(1600)}" fill="#263238" font-size="16">• Низ выреза: <tspan font-weight="bold">Y = 1250 мм</tspan> от пола. Высота выреза: <tspan font-weight="bold">180 мм</tspan> (до Y = 1430 мм).</text>')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(1565)}" fill="#263238" font-size="16">• Полка 2 (ниже выреза): <tspan font-weight="bold">Y = 1125..1141 мм</tspan>. Зазор до выреза: <tspan font-weight="bold" fill="#2e7d32">109 мм</tspan>.</text>')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(1530)}" fill="#263238" font-size="16">• Полка 3 (выше выреза): <tspan font-weight="bold">Y = 1613..1629 мм</tspan>. Зазор до выреза: <tspan font-weight="bold" fill="#2e7d32">183 мм</tspan>.</text>')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(1480)}" fill="#1b5e20" font-size="18" font-weight="bold">✓ ВЫРЕЗ ПОЛНОСТЬЮ СВОБОДЕН ОТ ПЕРЕСЕЧЕНИЙ С ПОЛКАМИ!</text>')

    # Section 6: Table of Compartments
    svg.append(f'    <text x="{p_x + 30}" y="{sy(1410)}" fill="#37474f" font-size="20" font-weight="bold">ТАБЛИЦА ПРОЕМОВ В СВЕТУ ШКАФА 2:</text>')
    table_y = 1360
    headers = [("Секция", 180), ("Позиция Y (мм)", 220), ("Проем в свету", 220), ("Тип полки", 300)]
    cur_x = p_x + 30
    for h_txt, h_w in headers:
        svg.append(f'    <rect x="{cur_x}" y="{sy(table_y)}" width="{h_w}" height="35" fill="#cfd8dc" stroke="#90a4ae" />')
        svg.append(f'    <text x="{cur_x + 10}" y="{sy(table_y) + 24}" fill="#263238" font-size="15" font-weight="bold">{h_txt}</text>')
        cur_x += h_w
    
    rows = [
        ("Ниша 1 (низ)", "166 .. 638", "472 мм", "Съемная полка (п)"),
        ("Ниша 2", "654 .. 1125", "471 мм", "Съемная полка (п)"),
        ("Ниша 3 (вырез)", "1141 .. 1613", "472 мм (вырез 180)", "Съемная полка (п)"),
        ("Ниша 4", "1629 .. 2100", "471 мм", "Съемная полка (п)"),
        ("Антресоль", "2116 .. 2644", "528 мм", "Жесткий горизонт (VB)")
    ]
    cur_ty = table_y - 35
    for r_sec, r_pos, r_op, r_type in rows:
        cx = p_x + 30
        for val, w_col in [(r_sec, 180), (r_pos, 220), (r_op, 220), (r_type, 300)]:
            bg_col = "#ffebee" if "вырез" in val else "#ffffff"
            svg.append(f'    <rect x="{cx}" y="{sy(cur_ty)}" width="{w_col}" height="32" fill="{bg_col}" stroke="#cfd8dc" />')
            svg.append(f'    <text x="{cx + 10}" y="{sy(cur_ty) + 22}" fill="#37474f" font-size="14">{val}</text>')
            cx += w_col
        cur_ty -= 32

    # Section 7: Hardware Summary
    svg.append(f'    <text x="{p_x + 30}" y="{sy(cur_ty - 25)}" fill="#37474f" font-size="20" font-weight="bold">ФУРНИТУРА И КРЕПЕЖ:</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(cur_ty - 60)}" fill="#263238" font-size="16">• Стяжка VB / Rafix: крепление жестких горизонтов и крышек</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(cur_ty - 90)}" fill="#263238" font-size="16">• Евровинты (конфирматы): крепление цоколя к боковинам</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(cur_ty - 120)}" fill="#263238" font-size="16">• Полкодержатели: 12 шт (для 3 вкладных полок Шкафа 2)</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(cur_ty - 150)}" fill="#263238" font-size="16">• Петли распашные: 4 шт для основных дверей, 2 шт для антресольных</text>')

    svg.append('  </g>')

    svg.append('</svg>')

    full_svg = '\n'.join(svg)
    with open(svg_file, 'w', encoding='utf-8') as f:
        f.write(full_svg)
    print(f"SVG regenerated: {svg_file}")

    # Artifact dir
    art_path = r"C:\Users\maxim\.gemini\antigravity\brain\65b961b0-b177-4711-82b9-2d7c4572f433\чертеж_двух_шкафов_2080.svg"
    with open(art_path, 'w', encoding='utf-8') as f:
        f.write(full_svg)

    # Desktop
    desktop_path = r"C:\Users\maxim\Desktop\чертеж_двух_шкафов_2080.svg"
    try:
        with open(desktop_path, 'w', encoding='utf-8') as f:
            f.write(full_svg)
    except Exception as e:
        pass

if __name__ == '__main__':
    generate_svg()
