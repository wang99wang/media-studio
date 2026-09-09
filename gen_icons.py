"""生成 PWA 图标 PNG（纯标准库，无第三方依赖）
圆润卡通风格：紫粉渐变圆角方块 + 白色播放三角 + 装饰点
"""
import zlib
import struct
import math
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons")
os.makedirs(OUT, exist_ok=True)

SS = 4  # 超采样倍数，用于抗锯齿


def write_png(path, w, h, rows):
    raw = bytearray()
    for row in rows:
        raw.append(0)
        for px in row:
            raw.extend(px)

    def chunk(tag, data):
        return (struct.pack(">I", len(data)) + tag + data
                + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def lerp(a, b, t):
    return a + (b - a) * t


def rounded_rect_inside(x, y, w, h, r):
    """判断点 (x,y) 是否在以 (0,0)-(w,h) 为界、圆角半径 r 的圆角矩形内"""
    if x < 0 or y < 0 or x > w or y > h:
        return False
    cx = min(max(x, r), w - r)
    cy = min(max(y, r), h - r)
    dx = x - cx
    dy = y - cy
    return dx * dx + dy * dy <= r * r


def point_in_tri(px, py, t):
    (x1, y1), (x2, y2), (x3, y3) = t
    d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2)
    d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3)
    d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1)
    neg = (d1 < 0) or (d2 < 0) or (d3 < 0)
    pos = (d1 > 0) or (d2 > 0) or (d3 > 0)
    return not (neg and pos)


def gen(size, path, pad_ratio=0.0):
    """pad_ratio: 图标四周留白比例（maskable 用）"""
    S = size * SS
    pad = S * pad_ratio
    box = S - pad * 2
    radius = box * 0.235

    # 播放三角（圆润感靠整体比例 + 抗锯齿实现）
    cx, cy = pad + box * 0.52, pad + box * 0.5
    tr = box * 0.20
    tri = [
        (cx - tr * 0.82, cy - tr * 1.02),
        (cx - tr * 0.82, cy + tr * 1.02),
        (cx + tr * 1.02, cy),
    ]
    # 左上装饰小圆点
    dot1 = (pad + box * 0.255, pad + box * 0.265, box * 0.052)
    dot2 = (pad + box * 0.762, pad + box * 0.745, box * 0.040)

    rows = []
    for py in range(size):
        row = []
        for px in range(size):
            acc_r = acc_g = acc_b = acc_a = 0.0
            for sy in range(SS):
                for sx in range(SS):
                    fx = px * SS + sx + 0.5
                    fy = py * SS + sy + 0.5
                    if not rounded_rect_inside(fx - pad, fy - pad, box, box, radius):
                        continue
                    # 对角渐变：柔紫 -> 珊瑚粉
                    t = ((fx - pad) / box * 0.55 + (fy - pad) / box * 0.45)
                    t = min(max(t, 0.0), 1.0)
                    r = lerp(124, 255, t)
                    g = lerp(92, 138, t)
                    b = lerp(255, 155, t)
                    a = 255.0
                    # 白色播放三角
                    if point_in_tri(fx, fy, tri):
                        r = g = b = 255.0
                    # 装饰点
                    for (dx0, dy0, dr) in (dot1, dot2):
                        if (fx - dx0) ** 2 + (fy - dy0) ** 2 <= dr * dr:
                            r, g, b = 255.0, 255.0, 255.0
                    acc_r += r
                    acc_g += g
                    acc_b += b
                    acc_a += a
            n = SS * SS
            if acc_a == 0:
                row.append((0, 0, 0, 0))
            else:
                cov = acc_a / (255.0 * n)
                row.append((
                    int(round(acc_r / (acc_a / 255.0))),
                    int(round(acc_g / (acc_a / 255.0))),
                    int(round(acc_b / (acc_a / 255.0))),
                    int(round(cov * 255)),
                ))
        rows.append(row)
    write_png(path, size, size, rows)
    print("written", path, os.path.getsize(path), "bytes")


gen(180, os.path.join(OUT, "icon-180.png"))
gen(192, os.path.join(OUT, "icon-192.png"))
gen(512, os.path.join(OUT, "icon-512.png"))
gen(512, os.path.join(OUT, "icon-maskable-512.png"), pad_ratio=0.10)
print("done")
