"""A two-piece wall mount for an iPad mini (6th gen / A17 Pro), held in landscape.

A bottom cradle and a top clip screw to the wall, one above the other. To mount the iPad, push
its top edge up into the top clip, swing the bottom in past the cradle's lip, and let it drop
onto the cradle floor. The lips cover only the bezel (about 8 mm), never the screen.
The USB-C port and speakers are on the short sides, which stay open.

Each part is modeled as it prints: its profile lies on the bed and the part grows along Z, so
nothing overhangs. Local axes of a part: X out from the wall, Y up the wall, Z along the iPad's
long edge. Units: mm.
"""

import build123d as bd
from cad import model

# iPad mini 6 / A17 Pro, from Apple's tech specs
IPAD_W, IPAD_H, IPAD_T = 195.4, 134.8, 6.3
IPAD_CORNER_R = 9.0  # approximate, for the reference body only
CLEARANCE = 1.2  # front-to-back play in the channel (a slim skin fits; a thick case does not)

PLATE = 4.0  # thickness of every wall
CHANNEL = IPAD_T + CLEARANCE
TOP_CHANNEL = CHANNEL + 1.8  # wider at the top, so the iPad can tilt in while held there
OUTER = PLATE + TOP_CHANNEL + PLATE  # how far each part stands off the wall

BOTTOM_LIP = 7.0  # lip height above the cradle floor (covers 7 mm of bezel)
TOP_LIP = 14.0  # top lip depth below the clip's ceiling
LIFT = 8.5  # how far the iPad lifts into the clip to clear the bottom lip
# at rest the top lip covers TOP_LIP - LIFT = 5.5 mm of bezel

BOTTOM_LEN, BOTTOM_TALL = 120.0, 30.0
TOP_LEN, TOP_TALL, TOP_BELOW = 50.0, 30.0, 20.0  # TOP_BELOW: plate below the lip for the screws

SCREW_D, HEAD_D = 4.2, 8.6  # #8 or 4 mm countersunk wood screws
BOTTOM_SCREWS = (-35.0, 35.0)  # along the length, from the centre
TOP_SCREWS = (-15.0, 15.0)
ROUND = 1.2

# where each part sits on the wall: the cradle floor is the iPad's resting height
FLOOR_Y = PLATE  # in the cradle's own frame
CEILING_Y = TOP_TALL - PLATE  # in the clip's own frame
TOP_OFFSET = FLOOR_Y + IPAD_H + LIFT - CEILING_Y  # clip base above cradle base


def screw_hole(y, z):
    """A countersunk hole through the back plate, head on the iPad side (x = PLATE)."""
    hole = bd.Cylinder(SCREW_D / 2, PLATE + 2, rotation=(0, 90, 0)).moved(bd.Location((PLATE / 2, y, z)))
    sink_h = (HEAD_D - SCREW_D) / 2
    sink = bd.Cone(SCREW_D / 2, HEAD_D / 2 + 0.2, sink_h + 0.2, rotation=(0, 90, 0)).moved(
        bd.Location((PLATE - (sink_h + 0.2) / 2 + 0.01, y, z))
    )
    return hole + sink


def profile_part(points, length):
    with bd.BuildPart() as part:
        with bd.BuildSketch():
            bd.Polygon(*points, align=None)
        bd.extrude(amount=length)
    return part.part


def rounded(part, seats):
    """Round the long edges (those along Z), but not the inside corners the iPad seats in."""
    def is_seat(edge):
        c = edge.center()
        return any(abs(c.X - x) < 1e-6 and abs(c.Y - y) < 1e-6 for x, y in seats)

    edges = [e for e in part.edges().filter_by(bd.Axis.Z) if not is_seat(e)]
    return bd.fillet(edges, ROUND)


def bottom_body():
    lip_x = PLATE + CHANNEL
    lip_out = lip_x + PLATE  # the cradle's lip sits closer in than the clip's
    pts = [
        (0, 0), (lip_out, 0), (lip_out, FLOOR_Y + BOTTOM_LIP), (lip_x, FLOOR_Y + BOTTOM_LIP),
        (lip_x, FLOOR_Y), (PLATE, FLOOR_Y), (PLATE, BOTTOM_TALL), (0, BOTTOM_TALL),
    ]
    body = rounded(profile_part(pts, BOTTOM_LEN), [(PLATE, FLOOR_Y), (lip_x, FLOOR_Y)])
    hole_y = (FLOOR_Y + BOTTOM_LIP + BOTTOM_TALL) / 2 + 1
    for dz in BOTTOM_SCREWS:
        body = body - screw_hole(hole_y, BOTTOM_LEN / 2 + dz)
    body.label = "bottom_cradle"
    body.color = "#e8e6e1"
    return body


def swing_clearance():
    """How far past the bottom lip the iPad's lower edge can swing while its top is in the clip.

    Lifted against the clip's ceiling, the top TOP_LIP mm of the iPad sit in a TOP_CHANNEL-wide
    slot, so it tilts until TOP_LIP * sin(a) + IPAD_T * cos(a) = TOP_CHANNEL. Its lower back
    edge then stands IPAD_H * sin(a) further out, and must pass the lip's outer face.
    """
    import math

    a = 0.0
    while TOP_LIP * math.sin(a + 1e-4) + IPAD_T * math.cos(a + 1e-4) <= TOP_CHANNEL:
        a += 1e-4
    needed = (PLATE + CHANNEL + PLATE) - (PLATE + CLEARANCE / 2)  # past the cradle's lip
    return IPAD_H * math.sin(a) - needed, math.degrees(a)


def top_body():
    margin, _ = swing_clearance()
    assert margin > 5, f"the iPad cannot swing in past the bottom lip (margin {margin:.1f} mm)"
    lip_x = PLATE + TOP_CHANNEL
    lip_bottom = CEILING_Y - TOP_LIP
    pts = [
        (0, -TOP_BELOW), (PLATE, -TOP_BELOW), (PLATE, CEILING_Y), (lip_x, CEILING_Y),
        (lip_x, lip_bottom), (OUTER, lip_bottom), (OUTER, TOP_TALL), (0, TOP_TALL),
    ]
    body = rounded(profile_part(pts, TOP_LEN), [(PLATE, CEILING_Y), (lip_x, CEILING_Y)])
    for dz in TOP_SCREWS:
        body = body - screw_hole(-TOP_BELOW / 2, TOP_LEN / 2 + dz)
    body.label = "top_clip"
    body.color = "#e8e6e1"
    return body


@model
def bottom_cradle():
    return bottom_body()


@model
def top_clip():
    return top_body()


# wall frame: X along the wall, Z up, the wall at y = 0 and the iPad out at -Y;
# a part's (x, y, z) -> (-z, -x, y)
def on_wall(shape, x_along, z_up):
    turned = shape.rotate(bd.Axis.X, 90).rotate(bd.Axis.Z, -90)
    return bd.Pos(x_along, 0, z_up) * turned


def ipad_body():
    body = bd.Box(IPAD_W, IPAD_T, IPAD_H, align=(bd.Align.CENTER, bd.Align.MAX, bd.Align.MIN))
    body = bd.fillet(body.edges().filter_by(bd.Axis.Y), IPAD_CORNER_R)
    body.label = "ipad_mini"
    body.color = "#3a3a3c80"
    return body


@model
def wall_mount():
    bottom = on_wall(bottom_cradle().shape, BOTTOM_LEN / 2, 0)
    bottom.label = "bottom_cradle"
    top = on_wall(top_clip().shape, TOP_LEN / 2, TOP_OFFSET)
    top.label = "top_clip"
    # the iPad resting on the cradle floor, its back CLEARANCE / 2 off the back plate
    ipad = bd.Pos(0, -PLATE - CLEARANCE / 2, FLOOR_Y) * ipad_body()
    ipad.label = "ipad_mini"
    for part in (bottom, top):
        box = part.bounding_box()
        assert abs(box.max.Y) < 1e-6, "parts stand on the wall"
    return bd.Compound(children=[bottom, top, ipad], label="wall_mount")


if __name__ == "__main__":
    wall_mount()
