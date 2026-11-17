"""A one-piece wall mount for an iPad mini (6th gen / A17 Pro), held in landscape.

One rigid C-shaped bracket screws to the wall: a cradle at the bottom, a clip at the top and a
back plate joining them, so the gap between cradle and clip is fixed by the part, not by where
the holes are drilled. To mount the iPad, push its top edge up into the clip, swing the bottom
in past the cradle's lip, and let it drop onto the cradle floor. The lips cover only the bezel
(about 8 mm), never the screen. The USB-C port and speakers are on the short sides, which stay
open.

The part is modeled as it prints: its side profile lies on the bed and it grows along Z, so
nothing overhangs, and the window in the back plate has 45 degree faces. Local axes: X out from
the wall, Y up the wall, Z along the iPad's long edge. Units: mm.
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

LENGTH = 70.0  # along the iPad's long edge
SCREW_D, HEAD_D = 4.2, 8.6  # #8 or 4 mm countersunk wood screws
SCREW_Z = (-20.0, 20.0)  # along the length, from the centre
ROUND = 1.2
WINDOW = 18.0  # half-diagonal of the diamond window in the back plate

FLOOR_Y = PLATE  # the iPad's resting height
CEILING_Y = FLOOR_Y + IPAD_H + LIFT  # underside of the clip's roof
TOP_Y = CEILING_Y + PLATE  # overall height
LOW_SCREW_Y = 25.0  # above the cradle's lip
HIGH_SCREW_Y = CEILING_Y - TOP_LIP - 13.0  # below the clip's lip, so a screwdriver reaches it


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


def diamond_window(y, z, half):
    """A diamond through the back plate: its faces lean 45 degrees, so it prints unsupported."""
    with bd.BuildPart() as cut:
        with bd.BuildSketch(bd.Plane.YZ):
            bd.Polygon((y - half, z), (y, z + half), (y + half, z), (y, z - half), align=None)
        bd.extrude(amount=PLATE + 2, both=True)
    return cut.part


def mount_body():
    margin, _ = swing_clearance()
    assert margin > 5, f"the iPad cannot swing in past the bottom lip (margin {margin:.1f} mm)"
    low_lip = PLATE + CHANNEL  # cradle lip, inner face
    top_lip = PLATE + TOP_CHANNEL  # clip lip, inner face
    pts = [
        (0, 0), (low_lip + PLATE, 0), (low_lip + PLATE, FLOOR_Y + BOTTOM_LIP),
        (low_lip, FLOOR_Y + BOTTOM_LIP), (low_lip, FLOOR_Y), (PLATE, FLOOR_Y),
        (PLATE, CEILING_Y), (top_lip, CEILING_Y), (top_lip, CEILING_Y - TOP_LIP),
        (OUTER, CEILING_Y - TOP_LIP), (OUTER, TOP_Y), (0, TOP_Y),
    ]
    seats = [(PLATE, FLOOR_Y), (low_lip, FLOOR_Y), (PLATE, CEILING_Y), (top_lip, CEILING_Y)]
    body = rounded(profile_part(pts, LENGTH), seats)
    for y in (LOW_SCREW_Y, HIGH_SCREW_Y):
        for dz in SCREW_Z:
            body = body - screw_hole(y, LENGTH / 2 + dz)
    window_y = (LOW_SCREW_Y + HIGH_SCREW_Y) / 2
    assert window_y - WINDOW > LOW_SCREW_Y + HEAD_D and window_y + WINDOW < HIGH_SCREW_Y - HEAD_D
    body = body - diamond_window(window_y, LENGTH / 2, WINDOW)
    assert len(body.solids()) == 1
    assert abs(body.bounding_box().size.Y - TOP_Y) < 1e-6
    body.label = "ipad_mini_mount"
    body.color = "#e8e6e1"
    return body


@model
def ipad_mini_mount():
    return mount_body()


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
    mount = on_wall(ipad_mini_mount().shape, LENGTH / 2, 0)
    mount.label = "ipad_mini_mount"
    # the iPad resting on the cradle floor, its back CLEARANCE / 2 off the back plate
    ipad = bd.Pos(0, -PLATE - CLEARANCE / 2, FLOOR_Y) * ipad_body()
    ipad.label = "ipad_mini"
    assert abs(mount.bounding_box().max.Y) < 1e-6, "the mount stands on the wall"
    return bd.Compound(children=[mount, ipad], label="wall_mount")


if __name__ == "__main__":
    wall_mount()
