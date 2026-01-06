"""Script para gerar icones do app Marina Mar"""
from PIL import Image, ImageDraw

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
AZUL_MARINHO = (30, 58, 95)  # #1E3A5F
AMARELO = (255, 229, 0)  # #FFE500
BRANCO = (255, 255, 255)

def draw_icon(size):
    """Desenha o icone com barco estilizado"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background com cantos arredondados
    radius = int(size * 0.18)
    draw.rounded_rectangle([0, 0, size-1, size-1], radius=radius, fill=AZUL_MARINHO)

    # Escala
    s = size / 512
    cx = size // 2

    # Sol (circulo amarelo no fundo)
    sol_r = int(120 * s)
    sol_y = int(180 * s)
    draw.ellipse([cx - sol_r, sol_y - sol_r, cx + sol_r, sol_y + sol_r], fill=AMARELO)

    # Barco (triangulo estilizado)
    boat_w = int(200 * s)
    boat_h = int(80 * s)
    boat_y = int(260 * s)

    # Casco do barco
    hull_points = [
        (cx - boat_w//2, boat_y),
        (cx + boat_w//2 + int(40*s), boat_y),
        (cx + boat_w//2 - int(20*s), boat_y + boat_h),
        (cx - boat_w//2 + int(30*s), boat_y + boat_h),
    ]
    draw.polygon(hull_points, fill=AZUL_MARINHO, outline=BRANCO, width=max(1, int(4*s)))

    # Cabine
    cabin_w = int(60 * s)
    cabin_h = int(50 * s)
    cabin_x = cx - int(20 * s)
    cabin_y = boat_y - cabin_h + int(10*s)
    draw.rectangle([cabin_x, cabin_y, cabin_x + cabin_w, boat_y + int(5*s)], fill=BRANCO)

    # Ondas
    wave_y = int(380 * s)
    wave_h = int(20 * s)
    for i in range(3):
        offset = int(40 * s * i)
        w_start = int(60*s) + offset
        w_end = int(180*s) + offset
        draw.arc([w_start, wave_y, w_end, wave_y + wave_h*2],
                 start=0, end=180, fill=BRANCO, width=max(2, int(8*s)))

    return img

def main():
    import os
    script_dir = os.path.dirname(os.path.abspath(__file__))

    for size in SIZES:
        img = draw_icon(size)
        filename = os.path.join(script_dir, f'icon-{size}.png')
        img.save(filename, 'PNG')
        print(f'Gerado: icon-{size}.png')

    print('Todos os icones foram gerados!')

if __name__ == '__main__':
    main()
