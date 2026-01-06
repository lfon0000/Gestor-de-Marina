"""Script para gerar icones do app Gestor de Marina"""
from PIL import Image, ImageDraw

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
PRIMARY_COLOR = (26, 95, 122)  # #1a5f7a
WHITE = (255, 255, 255)

def draw_icon(size):
    """Desenha o icone com ancora e ondas"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background com cantos arredondados
    radius = int(size * 0.15)
    draw.rounded_rectangle([0, 0, size-1, size-1], radius=radius, fill=PRIMARY_COLOR)

    # Escala
    s = size / 512
    cx = size // 2

    # Anel no topo da ancora
    ring_y = int(140 * s)
    ring_r = int(40 * s)
    ring_w = int(12 * s)
    draw.ellipse([cx - ring_r, ring_y - ring_r, cx + ring_r, ring_y + ring_r], outline=WHITE, width=ring_w)

    # Barra vertical
    bar_w = int(24 * s)
    bar_top = int(100 * s)
    bar_bottom = int(380 * s)
    draw.rectangle([cx - bar_w//2, bar_top, cx + bar_w//2, bar_bottom], fill=WHITE)

    # Barra horizontal no topo
    hbar_w = int(160 * s)
    hbar_h = int(24 * s)
    hbar_y = int(80 * s)
    draw.rectangle([cx - hbar_w//2, hbar_y, cx + hbar_w//2, hbar_y + hbar_h], fill=WHITE)

    # Bracos da ancora (arcos simplificados como linhas)
    arm_w = int(20 * s)
    arm_y = int(340 * s)
    arm_offset = int(90 * s)

    # Braco esquerdo
    draw.line([cx - arm_offset, arm_y, cx, int(300 * s)], fill=WHITE, width=arm_w)
    # Braco direito
    draw.line([cx + arm_offset, arm_y, cx, int(300 * s)], fill=WHITE, width=arm_w)

    # Ondas
    wave_y = int(420 * s)
    wave_w = int(16 * s)
    wave_amp = int(20 * s)

    # Desenhar ondas simplificadas
    wave_start = int(80 * s)
    wave_end = int(432 * s)
    draw.line([wave_start, wave_y, wave_end, wave_y], fill=WHITE, width=wave_w)

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
