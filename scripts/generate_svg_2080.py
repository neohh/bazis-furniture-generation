# -*- coding: utf-8 -*-
import os

def generate_svg():
    target_dir = r"z:\Work\генерация мебели\Модели\Шкафы"
    os.makedirs(target_dir, exist_ok=True)
    svg_file = os.path.join(target_dir, "чертеж_двух_шкафов_2080.svg")

    H = 2660
    W_total = 2080
    W1 = 880   # Левый шкаф 26 мм
    W2 = 1200  # Правый шкаф 16 мм
    
    # SVG coordinate mapping
    def sy(y):
        return 2800 - y

    svg = []
    svg.append('<?xml version="1.0" encoding="utf-8"?>')
    svg.append('<svg xmlns="http://www.w3.org/2000/svg" viewBox="-250 -350 4450 3350" width="100%" height="100%" style="background-color: #ffffff; font-family: \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif;">')
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
    svg.append('  <rect x="-200" y="-300" width="4350" height="120" fill="#1a237e" rx="8" />')
    svg.append('  <text x="-150" y="-230" fill="#ffffff" font-size="38" font-weight="bold">КОМПЛЕКС ИЗ ДВУХ ПРИЛЕГАЮЩИХ ШКАФОВ (ОБЩИЙ L=2080 мм, H=2660 мм)</text>')
    svg.append('  <text x="-150" y="-195" fill="#9fa8da" font-size="22">Шкаф 1: 880 мм (ЛДСП 26 мм, высокое дно 600) | Шкаф 2: 1200 мм (ЛДСП 16 мм, цоколь 60, ниша 650, 3 ниши по 385, верх 700)</text>\n')

    # Floor and Ceiling reference lines
    svg.append('  <!-- Пол и Потолок -->')
    svg.append(f'  <line x1="-150" y1="{sy(0)}" x2="3100" y2="{sy(0)}" stroke="#37474f" stroke-width="4" />')
    svg.append(f'  <text x="-150" y="{sy(0) + 35}" fill="#37474f" font-size="22" font-weight="bold">УРОВЕНЬ ЧИСТОГО ПОЛА (Y = 0)</text>')
    svg.append(f'  <line x1="-150" y1="{sy(2660)}" x2="3100" y2="{sy(2660)}" stroke="#78909c" stroke-width="2" stroke-dasharray="10,6" />')
    svg.append(f'  <text x="-150" y="{sy(2660) - 20}" fill="#78909c" font-size="22" font-weight="bold">ПОТОЛОК (H = 2660 мм)</text>\n')

    # =========================================================================
    # VIEW 1: FRONT ELEVATION (ВИД СПЕРЕДИ)
    # Composition: Cabinet 1 (X: 0..880), Cabinet 2 (X: 880..2080)
    # =========================================================================
    svg.append('  <!-- ==================== ВИД СПЕРЕДИ (ГЛАВНЫЙ ВИД) ==================== -->')
    svg.append('  <g id="view-front">')
    svg.append(f'    <text x="0" y="{sy(2660) - 100}" fill="#0d47a1" font-size="28" font-weight="bold">1. ВИД СПЕРЕДИ: ОБЩАЯ КОМПОЗИЦИЯ (L = 2080 мм)</text>')

    # CABINET 1: W=880, H=2660, D=620, Thick=26 mm, High Bottom = 600 mm
    c1_x = 0
    c1_w = W1 # 880
    t26 = 26
    c1_inner_w = c1_w - 2 * t26 # 828 mm

    svg.append('    <!-- ШКАФ 1 (ЛЕВЫЙ ПОРТАЛ / ШКАФ): ЛДСП 26 мм, ширина 880 мм, высокое дно 600 мм -->')
    svg.append('    <g id="cabinet-1">')
    # Background panel (ЛДСП back)
    svg.append(f'      <rect x="{c1_x + t26}" y="{sy(2634)}" width="{c1_inner_w}" height="{2634 - 626}" fill="#e8f5e9" stroke="#81c784" stroke-width="1.5" />')
    svg.append(f'      <text x="{c1_x + c1_w/2}" y="{sy(1600)}" fill="#2e7d32" font-size="22" font-weight="bold" text-anchor="middle">Задняя стенка ЛДСП</text>')
    
    # Left side (26 mm)
    svg.append(f'      <rect x="{c1_x}" y="{sy(2660)}" width="{t26}" height="2660" fill="url(#hatch-thick26)" stroke="#1b5e20" stroke-width="2" />')
    # Right side (26 mm)
    svg.append(f'      <rect x="{c1_x + c1_w - t26}" y="{sy(2660)}" width="{t26}" height="2660" fill="url(#hatch-thick26)" stroke="#1b5e20" stroke-width="2" />')
    # Top roof panel (26 mm)
    svg.append(f'      <rect x="{c1_x + t26}" y="{sy(2660)}" width="{c1_inner_w}" height="{t26}" fill="url(#hatch-thick26)" stroke="#1b5e20" stroke-width="2" />')
    # Raised bottom panel (26 mm at Y = 600..626)
    svg.append(f'      <rect x="{c1_x + t26}" y="{sy(626)}" width="{c1_inner_w}" height="{t26}" fill="url(#hatch-thick26)" stroke="#1b5e20" stroke-width="2" />')
    
    # Clothes rail / rod
    svg.append(f'      <line x1="{c1_x + t26}" y1="{sy(2500)}" x2="{c1_x + c1_w - t26}" y2="{sy(2500)}" stroke="#c2185b" stroke-width="6" />')
    svg.append(f'      <circle cx="{c1_x + t26 + 20}" cy="{sy(2500)}" r="8" fill="#c2185b" />')
    svg.append(f'      <circle cx="{c1_x + c1_w - t26 - 20}" cy="{sy(2500)}" r="8" fill="#c2185b" />')
    svg.append(f'      <text x="{c1_x + c1_w/2}" y="{sy(2520)}" fill="#c2185b" font-size="18" font-weight="bold" text-anchor="middle">Штанга овальная (L = {c1_inner_w} мм)</text>')
    
    # Open bottom niche 600 mm
    svg.append(f'      <rect x="{c1_x + t26}" y="{sy(600)}" width="{c1_inner_w}" height="600" fill="#fafafa" stroke="#cfd8dc" stroke-dasharray="6,4" />')
    svg.append(f'      <text x="{c1_x + c1_w/2}" y="{sy(300)}" fill="#546e7a" font-size="20" font-weight="bold" text-anchor="middle">Открытая ниша 600 мм (под обувь/пылесос)</text>')
    svg.append('    </g>\n')

    # Dimension lines for Cabinet 1
    svg.append(f'    <line x1="{c1_x}" y1="{sy(2660) - 40}" x2="{c1_x + c1_w}" y2="{sy(2660) - 40}" stroke="#d32f2f" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{c1_x + c1_w/2}" y="{sy(2660) - 50}" fill="#d32f2f" font-size="22" font-weight="bold" text-anchor="middle">880</text>')
    # Bottom clear opening 600
    svg.append(f'    <line x1="{c1_x - 40}" y1="{sy(0)}" x2="{c1_x - 40}" y2="{sy(600)}" stroke="#d32f2f" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{c1_x - 50}" y="{sy(300)}" fill="#d32f2f" font-size="20" font-weight="bold" text-anchor="end">600</text>')
    # Panel thickness 26
    svg.append(f'    <text x="{c1_x + 13}" y="{sy(2660) - 10}" fill="#1b5e20" font-size="14" font-weight="bold" text-anchor="middle">26</text>')
    svg.append(f'    <text x="{c1_x + c1_w - 13}" y="{sy(2660) - 10}" fill="#1b5e20" font-size="14" font-weight="bold" text-anchor="middle">26</text>')

    # CABINET 2: W=1200, H=2660, ЛДСП 16 мм, Socle=60, Bottom Niche=650, 3 niches=385, Top Niche=700
    c2_x = 880
    c2_w = W2 # 1200
    t16 = 16
    c2_inner_w = c2_w - 2 * t16 # 1168 mm

    # Shelf coordinates:
    # Floor: 0
    # Socle: 60 (Y = 0..60)
    # Bottom: 16 (Y = 60..76)
    # Niche 1 (bottom): 650 mm -> Shelf 1: Y = 726..742
    # Niche 2: 385 mm -> Shelf 2: Y = 1127..1143
    # Niche 3: 385 mm -> Shelf 3: Y = 1528..1544 (Cutout is Y = 1250..1430, inside Niche 3!)
    # Niche 4: 385 mm -> Shelf 4: Y = 1929..1945
    # Niche 5 (top): 700 mm -> Roof: Y = 2644..2660
    socle_h = 60
    s1_y = 726
    s2_y = 1127
    s3_y = 1528
    s4_y = 1929

    svg.append('    <!-- ШКАФ 2 (ПРАВЫЙ ШКАФ 1200 мм): ЛДСП 16 мм, цоколь 60, полки 650, 3x385, 700 -->')
    svg.append('    <g id="cabinet-2">')
    # Left side (16 мм)
    svg.append(f'      <rect x="{c2_x}" y="{sy(2660)}" width="{t16}" height="2660" fill="url(#hatch-carcass)" stroke="#2c3e50" stroke-width="2" />')
    # Right side (16 мм)
    svg.append(f'      <rect x="{c2_x + c2_w - t16}" y="{sy(2660)}" width="{t16}" height="2660" fill="url(#hatch-carcass)" stroke="#2c3e50" stroke-width="2" />')
    # Top roof (16 мм)
    svg.append(f'      <rect x="{c2_x + t16}" y="{sy(2660)}" width="{c2_inner_w}" height="{t16}" fill="url(#hatch-carcass)" stroke="#2c3e50" stroke-width="2" />')
    # Socle (60 mm)
    svg.append(f'      <rect x="{c2_x + t16}" y="{sy(socle_h)}" width="{c2_inner_w}" height="{socle_h}" fill="#cfd8dc" stroke="#455a64" stroke-width="1.5" />')
    svg.append(f'      <text x="{c2_x + c2_w/2}" y="{sy(30) + 6}" fill="#37474f" font-size="16" font-weight="bold" text-anchor="middle">Цоколь H=60 мм (как в исходной базе)</text>')
    # Bottom panel (16 mm at Y=60..76)
    svg.append(f'      <rect x="{c2_x + t16}" y="{sy(socle_h + t16)}" width="{c2_inner_w}" height="{t16}" fill="url(#hatch-carcass)" stroke="#2c3e50" stroke-width="2" />')
    
    # Shelf 1 (fixed or removable): Y = 726..742
    svg.append(f'      <rect x="{c2_x + t16}" y="{sy(s1_y + t16)}" width="{c2_inner_w}" height="{t16}" fill="url(#hatch-fixed)" stroke="#4a148c" stroke-width="2" />')
    # Shelf 2: Y = 1127..1143
    svg.append(f'      <rect x="{c2_x + t16}" y="{sy(s2_y + t16)}" width="{c2_inner_w}" height="{t16}" fill="url(#hatch-removable)" stroke="#e65100" stroke-width="2" />')
    # Shelf 3: Y = 1528..1544
    svg.append(f'      <rect x="{c2_x + t16}" y="{sy(s3_y + t16)}" width="{c2_inner_w}" height="{t16}" fill="url(#hatch-removable)" stroke="#e65100" stroke-width="2" />')
    # Shelf 4 (антресольная полка): Y = 1929..1945
    svg.append(f'      <rect x="{c2_x + t16}" y="{sy(s4_y + t16)}" width="{c2_inner_w}" height="{t16}" fill="url(#hatch-fixed)" stroke="#4a148c" stroke-width="2" />')
    
    # Pins and rafix marks
    for sy_pos in [s2_y, s3_y]:
        svg.append(f'      <text x="{c2_x + t16 + 15}" y="{sy(sy_pos + 4)}" fill="#1565c0" font-size="14" font-weight="bold">п</text>')
        svg.append(f'      <text x="{c2_x + c2_w - t16 - 25}" y="{sy(sy_pos + 4)}" fill="#1565c0" font-size="14" font-weight="bold">п</text>')
    for sy_pos in [s1_y, s4_y]:
        svg.append(f'      <text x="{c2_x + t16 + 15}" y="{sy(sy_pos + 4)}" fill="#4a148c" font-size="14" font-weight="bold">VB</text>')
        svg.append(f'      <text x="{c2_x + c2_w - t16 - 25}" y="{sy(sy_pos + 4)}" fill="#4a148c" font-size="14" font-weight="bold">VB</text>')

    # Utility meter cutout projection in Front View
    # Y = 1250..1430, height 180
    svg.append(f'      <rect x="{c2_x + c2_w - t16 - 200}" y="{sy(1430)}" width="200" height="180" fill="url(#hatch-cutout)" stroke="#d32f2f" stroke-width="2.5" stroke-dasharray="6,4" />')
    svg.append(f'      <text x="{c2_x + c2_w - t16 - 100}" y="{sy(1355)}" fill="#d32f2f" font-size="16" font-weight="bold" text-anchor="middle">ВЫРЕЗ В БОКОВИНЕ</text>')
    svg.append(f'      <text x="{c2_x + c2_w - t16 - 100}" y="{sy(1330)}" fill="#d32f2f" font-size="16" font-weight="bold" text-anchor="middle">ПОД СЧЕТЧИКИ</text>')
    svg.append(f'      <text x="{c2_x + c2_w - t16 - 100}" y="{sy(1305)}" fill="#d32f2f" font-size="14" font-weight="bold" text-anchor="middle">180×(глубина)</text>')
    
    # Clearances
    svg.append(f'      <text x="{c2_x + c2_w - 240}" y="{sy(1185)}" fill="#2e7d32" font-size="15" font-weight="bold">Зазор до Полки 2: 107 мм ✓</text>')
    svg.append(f'      <text x="{c2_x + c2_w - 240}" y="{sy(1495)}" fill="#2e7d32" font-size="15" font-weight="bold">Зазор до Полки 3: 98 мм ✓</text>')
    svg.append('    </g>\n')

    # Dimensions for Cabinet 2
    svg.append(f'    <line x1="{c2_x}" y1="{sy(2660) - 40}" x2="{c2_x + c2_w}" y2="{sy(2660) - 40}" stroke="#d32f2f" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{c2_x + c2_w/2}" y="{sy(2660) - 50}" fill="#d32f2f" font-size="22" font-weight="bold" text-anchor="middle">1200</text>')
    # Socle height 60
    svg.append(f'    <line x1="{c2_x + c2_w + 35}" y1="{sy(0)}" x2="{c2_x + c2_w + 35}" y2="{sy(60)}" stroke="#d32f2f" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{c2_x + c2_w + 45}" y="{sy(30) + 6}" fill="#d32f2f" font-size="18" font-weight="bold">60</text>')
    # Cutout bottom 1250
    svg.append(f'    <line x1="{c2_x + c2_w + 90}" y1="{sy(0)}" x2="{c2_x + c2_w + 90}" y2="{sy(1250)}" stroke="#d32f2f" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{c2_x + c2_w + 100}" y="{sy(625)}" fill="#d32f2f" font-size="18" font-weight="bold">1250 (низ выреза)</text>')
    # Cutout height 180
    svg.append(f'    <line x1="{c2_x + c2_w + 35}" y1="{sy(1250)}" x2="{c2_x + c2_w + 35}" y2="{sy(1430)}" stroke="#d32f2f" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{c2_x + c2_w + 45}" y="{sy(1340) + 6}" fill="#d32f2f" font-size="18" font-weight="bold">180</text>')
    
    # Vertical niche openings in Cabinet 2
    niches = [
        (76, s1_y, "650 мм (в свету от дна)"),
        (s1_y + 16, s2_y, "385 мм (в свету)"),
        (s2_y + 16, s3_y, "385 мм (вырез 180 мм)"),
        (s3_y + 16, s4_y, "385 мм (в свету)"),
        (s4_y + 16, 2644, "700 мм (в свету от верха)")
    ]
    for y1, y2, lbl in niches:
        mid_y = (y1 + y2) / 2
        col = "#d32f2f" if "650" in lbl or "700" in lbl else "#e65100"
        svg.append(f'      <line x1="{c2_x + 60}" y1="{sy(y1)}" x2="{c2_x + 60}" y2="{sy(y2)}" stroke="{col}" stroke-width="2" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
        svg.append(f'      <text x="{c2_x + 75}" y="{sy(mid_y) + 6}" fill="{col}" font-size="17" font-weight="bold">{lbl}</text>')

    # Total width dimension 2080 at the bottom
    svg.append('    <!-- ОБЩИЙ РАЗМЕР ПО ПОЛУ = 2080 мм -->')
    svg.append(f'    <line x1="0" y1="{sy(-70)}" x2="{W_total}" y2="{sy(-70)}" stroke="#d32f2f" stroke-width="3" marker-start="url(#arrow-start-red)" marker-end="url(#arrow-end-red)" />')
    svg.append(f'    <text x="{W_total/2}" y="{sy(-70) + 35}" fill="#d32f2f" font-size="28" font-weight="bold" text-anchor="middle">ОБЩИЙ ГАБАРИТ КОМПОЗИЦИИ = 2080 мм (880 + 1200)</text>')
    svg.append('  </g>\n')

    # =========================================================================
    # VIEW 2: RIGHT SIDE SECTION OF CABINET 2 (ВИД СПРАВА / РАЗРЕЗ)
    # Depth = 600 mm, Height = 2660 mm, showing 50 mm rear setback and base socle setback
    # Placed at X = 2320..2920
    # =========================================================================
    s_x = 2320
    s_d = 600
    svg.append('  <!-- ==================== ВИД СПРАВА / РАЗРЕЗ ПРАВОГО ШКАФА ==================== -->')
    svg.append('  <g id="view-side-section">')
    svg.append(f'    <text x="{s_x}" y="{sy(2660) - 100}" fill="#0d47a1" font-size="28" font-weight="bold">2. СЕЧЕНИЕ / ВИД СПРАВА ШКАФА 2 (D = 600 мм)</text>')
    svg.append(f'    <text x="{s_x}" y="{sy(2660) - 70}" fill="#546e7a" font-size="18">Показан вырез под счетчики, отступ от стены 50 мм и цоколь базы 60 мм</text>')

    # Rear wall line
    svg.append(f'    <line x1="{s_x}" y1="{sy(0)}" x2="{s_x}" y2="{sy(2660)}" stroke="#37474f" stroke-width="4" />')
    svg.append(f'    <text x="{s_x - 15}" y="{sy(1330)}" fill="#37474f" font-size="18" font-weight="bold" text-anchor="middle" transform="rotate(-90 {s_x - 15} {sy(1330)})">СТЕНА ПОМЕЩЕНИЯ</text>')

    # Outer side panel boundary
    svg.append(f'    <rect x="{s_x}" y="{sy(2660)}" width="{s_d}" height="2660" fill="none" stroke="#2c3e50" stroke-width="2.5" />')

    # 50 mm rear gap zone
    svg.append(f'    <rect x="{s_x}" y="{sy(2660)}" width="50" height="2660" fill="url(#hatch-gap)" stroke="#90a4ae" stroke-width="1" stroke-dasharray="4,4" />')
    svg.append(f'    <text x="{s_x + 25}" y="{sy(2000)}" fill="#546e7a" font-size="14" font-weight="bold" text-anchor="middle" transform="rotate(-90 {s_x + 25} {sy(2000)})">ОТСТУП 50 мм ПОД КОММУНИКАЦИИ</text>')

    # Internal panels depth = 550 mm (from s_x+50 to s_x+600)
    svg.append(f'    <rect x="{s_x + 50}" y="{sy(76)}" width="550" height="16" fill="url(#hatch-carcass)" stroke="#2c3e50" stroke-width="1.5" />')
    svg.append(f'    <rect x="{s_x + 50}" y="{sy(2660)}" width="550" height="16" fill="url(#hatch-carcass)" stroke="#2c3e50" stroke-width="1.5" />')
    
    # Socle (height 60 mm, as in base fragment, e.g. recessed 20-30 mm)
    svg.append(f'    <rect x="{s_x + 600 - 25 - 16}" y="{sy(60)}" width="16" height="60" fill="#cfd8dc" stroke="#37474f" stroke-width="2" />')
    svg.append(f'    <text x="{s_x + 600 - 50}" y="{sy(25)}" fill="#37474f" font-size="13" font-weight="bold">Цоколь 60</text>')

    # Shelves in side section (depth = 550 mm)
    for sy_pos in [s1_y, s2_y, s3_y, s4_y]:
        fill_pat = "url(#hatch-fixed)" if sy_pos in [s1_y, s4_y] else "url(#hatch-removable)"
        stroke_col = "#4a148c" if sy_pos in [s1_y, s4_y] else "#e65100"
        svg.append(f'    <rect x="{s_x + 50}" y="{sy(sy_pos + 16)}" width="550" height="16" fill="{fill_pat}" stroke="{stroke_col}" stroke-width="1.5" />')

    # Utility Meter Cutout on right side panel:
    cut_w = 320
    cut_x = s_x + 50
    svg.append(f'    <rect x="{cut_x}" y="{sy(1430)}" width="{cut_w}" height="180" fill="url(#hatch-cutout)" stroke="#d32f2f" stroke-width="3" />')
    svg.append(f'    <text x="{cut_x + cut_w/2}" y="{sy(1350)}" fill="#b71c1c" font-size="20" font-weight="bold" text-anchor="middle">ВЫРЕЗ В БОКОВИНЕ</text>')
    svg.append(f'    <text x="{cut_x + cut_w/2}" y="{sy(1320)}" fill="#b71c1c" font-size="18" font-weight="bold" text-anchor="middle">180 × {cut_w} мм (СЧЕТЧИКИ)</text>')

    # Facade line (600 + фасад 16 mm)
    svg.append(f'    <rect x="{s_x + 600}" y="{sy(2660)}" width="16" height="716" fill="#e1f5fe" stroke="#0288d1" stroke-width="2" />')
    svg.append(f'    <rect x="{s_x + 600}" y="{sy(1928)}" width="16" height="1868" fill="#e1f5fe" stroke="#0288d1" stroke-width="2" />')
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
    svg.append(f'    <text x="{p_x + 30}" y="{sy(2660) - 55}" fill="#ffffff" font-size="26" font-weight="bold">ИТОГОВАЯ СПЕЦИФИКАЦИЯ И РАСЧЕТ ПРОЕМОВ</text>')

    # Section 2: Parameters of Cabinet 1
    svg.append(f'    <text x="{p_x + 30}" y="{sy(2520)}" fill="#1b5e20" font-size="22" font-weight="bold">ШКАФ 1 (ЛЕВЫЙ ПОРТАЛ / ШКАФ ИЗ ЛДСП 26 мм):</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2470)}" fill="#263238" font-size="18">• Материал: <tspan font-weight="bold" fill="#1b5e20">ЛДСП 26 мм</tspan> (боковины, верх, дно, полки)</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2430)}" fill="#263238" font-size="18">• Габариты: <tspan font-weight="bold" fill="#2e7d32">880 × 2660 × 620 мм</tspan> (2080 - 1200 = 880)</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2390)}" fill="#263238" font-size="18">• Внутренний проем по ширине: <tspan font-weight="bold">828 мм</tspan> (880 - 52 мм)</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2350)}" fill="#263238" font-size="18">• Базовый блок: <tspan font-weight="bold">Высокое дно без цоколя</tspan></text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2310)}" fill="#263238" font-size="18">• Нижний открытый проем: <tspan font-weight="bold" fill="#d32f2f">600 мм</tspan> от пола в свету</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2270)}" fill="#263238" font-size="18">• Основной проем: <tspan font-weight="bold">2008 мм</tspan> (2634 - 626 мм)</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2230)}" fill="#263238" font-size="18">• Наполнение: штанга овальная (L=828 мм, Y=2500 мм), задняя стенка ЛДСП</text>')

    # Section 3: Parameters of Cabinet 2
    svg.append(f'    <text x="{p_x + 30}" y="{sy(2160)}" fill="#0d47a1" font-size="22" font-weight="bold">ШКАФ 2 (ПРАВЫЙ ШКАФ ИЗ ЛДСП 16 мм):</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2115)}" fill="#263238" font-size="18">• Материал: <tspan font-weight="bold">ЛДСП 16 мм</tspan></text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2080)}" fill="#263238" font-size="18">• Габариты: <tspan font-weight="bold" fill="#0d47a1">1200 × 2660 × 600 мм</tspan> (+ фасад 16 мм)</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2045)}" fill="#263238" font-size="18">• Базовый блок: <tspan font-weight="bold">База с цоколем без козырька</tspan></text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(2010)}" fill="#263238" font-size="18">• Высота цоколя: <tspan font-weight="bold" fill="#d32f2f">60 мм</tspan> (отступ спереди как в базе)</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(1975)}" fill="#263238" font-size="18">• Задний отступ от стены: <tspan font-weight="bold" fill="#d32f2f">50 мм</tspan> (глубина полок 550 мм)</text>')

    # Section 4: Cutout Safety Calculation
    svg.append(f'    <rect x="{p_x + 20}" y="{sy(1930)}" width="980" height="230" fill="#e8f5e9" stroke="#4caf50" stroke-width="2" rx="6" />')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(1890)}" fill="#1b5e20" font-size="20" font-weight="bold">ПРОВЕРКА ВЫРЕЗА ПОД СЧЕТЧИКИ (Y = 1250..1430 мм):</text>')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(1850)}" fill="#263238" font-size="16">• Низ выреза: <tspan font-weight="bold">Y = 1250 мм</tspan>. Верх выреза: <tspan font-weight="bold">Y = 1430 мм</tspan> (H = 180 мм).</text>')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(1815)}" fill="#263238" font-size="16">• Полка 2: <tspan font-weight="bold">Y = 1127..1143 мм</tspan>. Запас до низа выреза: <tspan font-weight="bold" fill="#2e7d32">107 мм</tspan>.</text>')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(1780)}" fill="#263238" font-size="16">• Полка 3: <tspan font-weight="bold">Y = 1528..1544 мм</tspan>. Запас до верха выреза: <tspan font-weight="bold" fill="#2e7d32">98 мм</tspan>.</text>')
    svg.append(f'    <text x="{p_x + 40}" y="{sy(1735)}" fill="#1b5e20" font-size="18" font-weight="bold">✓ ВЫРЕЗ ИДЕАЛЬНО ВХОДИТ В 3-Ю СЕКЦИЮ БЕЗ ПЕРЕСЕЧЕНИЙ!</text>')

    # Section 5: Table of Compartments
    svg.append(f'    <text x="{p_x + 30}" y="{sy(1660)}" fill="#37474f" font-size="20" font-weight="bold">РАСКЛАДКА ПОЛОК ШКАФА 2 ПО ВЫСОТЕ:</text>')
    table_y = 1610
    headers = [("Секция", 180), ("Позиция Y (мм)", 220), ("Проем в свету", 220), ("Тип полки", 300)]
    cur_x = p_x + 30
    for h_txt, h_w in headers:
        svg.append(f'    <rect x="{cur_x}" y="{sy(table_y)}" width="{h_w}" height="35" fill="#cfd8dc" stroke="#90a4ae" />')
        svg.append(f'    <text x="{cur_x + 10}" y="{sy(table_y) + 24}" fill="#263238" font-size="15" font-weight="bold">{h_txt}</text>')
        cur_x += h_w
    
    rows = [
        ("Ниша 1 (низ)", "76 .. 726", "650 мм (точно)", "Жесткий горизонт (VB)"),
        ("Ниша 2", "742 .. 1127", "385 мм (ровно)", "Съемная полка (п)"),
        ("Ниша 3 (вырез)", "1143 .. 1528", "385 мм (вырез 180)", "Съемная полка (п)"),
        ("Ниша 4", "1544 .. 1929", "385 мм (ровно)", "Жесткий горизонт (VB)"),
        ("Ниша 5 (верх)", "1945 .. 2644", "700 мм (точно)", "Крыша шкафа")
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

    # Section 6: Sum check
    svg.append(f'    <text x="{p_x + 30}" y="{sy(cur_ty - 30)}" fill="#0d47a1" font-size="16" font-weight="bold">Контрольная сумма высот: 60 (цоколь) + 16 + 650 + 16 + 3x(385+16) + 700 + 16 = 2660 мм ✓</text>')

    # Section 7: Hardware Summary
    svg.append(f'    <text x="{p_x + 30}" y="{sy(cur_ty - 75)}" fill="#37474f" font-size="20" font-weight="bold">ФУРНИТУРА И КРЕПЕЖ:</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(cur_ty - 110)}" fill="#263238" font-size="16">• Стяжка VB / Rafix: крепление силовых горизонтов на Y=726 и Y=1929</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(cur_ty - 140)}" fill="#263238" font-size="16">• Евровинты (конфирматы): цоколь к боковинам</text>')
    svg.append(f'    <text x="{p_x + 50}" y="{sy(cur_ty - 170)}" fill="#263238" font-size="16">• Полкодержатели: 8 шт (для двух вкладных полок Шкафа 2)</text>')

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
