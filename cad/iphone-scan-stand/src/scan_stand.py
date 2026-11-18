"""An overhead scanning stand for an iPhone 17 Air: documents and name cards on a desk.

A small bridge stands over the page: two legs either side of it, an arm from each leg, and a
cradle between the arms that holds the phone flat, screen up, its camera looking straight down
from CAMERA_H above the desk. Slide an A4 page (portrait, its top away from you) or a name card
under the camera and shoot from the screen. The cradle is open at the phone's top end, where the
Air's camera plateau spans the back, so the plateau and lens hang free over the page.

Five printed parts, three designs: leg x2, arm x2, cradle. They push together on square pegs
(0.2 mm clearance a side, a dab of glue makes them permanent). Each part model is the part as
it prints, flat side down, with nothing to support; the `scan_stand` assembly stands them up.

World axes: desk at z = 0, X across the desk, +Y towards you, the lens above the origin. mm.
"""

import math

import build123d as bd
from cad import model

# iPhone 17 Air (Apple's tech specs). The lens position is an estimate from product images:
# measure your phone and correct LENS_FROM_TOP / LENS_FROM_SIDE if the page comes out off-centre.
PHONE_L, PHONE_W, PHONE_T = 156.2, 74.7, 5.64
PHONE_R = 11.0  # plan-view corner radius, reference body only
PLATEAU = 2.6  # how far the camera plateau stands proud of the back (estimate)
LENS_FROM_TOP, LENS_FROM_SIDE = 15.0, 18.0
FREE_TOP = 32.0  # length of the phone's top end the cradle leaves unsupported (plateau band)

# 48 MP Fusion camera, 26 mm equivalent, 4:3 frame: half angles of view
HALF_FOV_LONG = math.degrees(math.atan(43.27 * 0.8 / 2 / 26))  # along the phone's length
HALF_FOV_SHORT = math.degrees(math.atan(43.27 * 0.6 / 2 / 26))  # across it
CAMERA_H = 240.0  # lens above the desk: A4 portrait fills the frame with a margin
A4 = (210.0, 297.0)

FIT = 0.5  # play round the phone in the pocket, each side
WALL = 3.0  # pocket wall
RAIL = 14.0  # rail width beyond the wall, where the arm's pegs go in
RAIL_H = 8.0  # rail height: its top stands RAIL_H - FLOOR mm above the phone's back
FLOOR = 3.0  # ledge under the phone's long edges
LEDGE = 5.0  # how far the ledge reaches in under the phone
CABLE_NOTCH = 16.0  # opening in the bottom end wall for a USB-C plug
TIE = 6.0  # bar across the cradle's open end, under the phone

ARM_T, ARM_W = 12.0, 18.0
LEG_X = 155.0  # leg centre from the cradle centre, outside the camera's view at desk level
POST_T = 14.0  # leg thickness along X
POST_W = 18.0  # post width along Y
FOOT_L, FOOT_H = 180.0, 8.0
GUSSET = 40.0

PEG = 6.0  # square peg side
PEG_H = 6.0
PEG_GAP = 0.2  # clearance each side in its socket
PEG_PITCH = 9.0  # the two pegs of a joint, along Y

ROUND = 1.0

# -- placement, derived --------------------------------------------------------------------
BACK_Z = CAMERA_H + PLATEAU  # the phone's back rests on the ledges here
CRADLE_Z = BACK_Z - FLOOR  # cradle underside = arm top
ARM_Z = CRADLE_Z - ARM_T  # arm underside = leg top
LENS = (PHONE_W / 2 - LENS_FROM_SIDE, 0.0)  # in world XY; the phone's centre is at x = 0
PHONE_TOP_Y = -LENS_FROM_TOP  # the phone's top end points away from you
PHONE_MID_Y = PHONE_TOP_Y + PHONE_L / 2
POCKET_X = PHONE_W / 2 + FIT  # pocket half-width
RAIL_X0, RAIL_X1 = POCKET_X, POCKET_X + WALL + RAIL
POCKET_Y0 = PHONE_TOP_Y + FREE_TOP  # where the cradle starts (open end)
POCKET_Y1 = PHONE_TOP_Y + PHONE_L + FIT  # the bottom end's inner face
END_Y1 = POCKET_Y1 + WALL
JOINT_Y = PHONE_MID_Y  # arms and legs sit under the phone's centre of mass
ARM_X0 = RAIL_X0 + WALL / 2  # inner end of an arm, under the rail
ARM_X1 = LEG_X + POST_T / 2  # outer end, over the leg
INNER_PEG_X = (RAIL_X0 + WALL + RAIL_X1) / 2 - 1.0
OUTER_PEG_X = LEG_X


def peg_points(x):
    return [(x, JOINT_Y - PEG_PITCH / 2), (x, JOINT_Y + PEG_PITCH / 2)]


def pegs(x, z):
    """Two square pegs standing up from z."""
    return bd.Part() + [bd.Pos(px, py, z) * bd.Box(PEG, PEG, PEG_H, align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN)) for px, py in peg_points(x)]


def sockets(x, z):
    """Two square blind sockets going up from z, for those pegs."""
    side = PEG + 2 * PEG_GAP
    return bd.Part() + [bd.Pos(px, py, z - 0.01) * bd.Box(side, side, PEG_H + 0.5, align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN)) for px, py in peg_points(x)]


def soften(part, axis):
    edges = part.edges().filter_by(axis)
    return bd.fillet(edges, ROUND) if edges else part


# -- parts, built where they stand in the stand -------------------------------------------
def cradle_body():
    z0, z1 = CRADLE_Z, CRADLE_Z + RAIL_H
    length = END_Y1 - POCKET_Y0
    cy = (POCKET_Y0 + END_Y1) / 2
    outer = bd.Pos(0, cy, z0) * bd.Box(2 * RAIL_X1, length, RAIL_H, align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN))
    outer = bd.fillet(outer.edges().filter_by(bd.Axis.Z), 3.0)
    # pocket the phone drops into, open at the top end
    pocket_len = POCKET_Y1 - POCKET_Y0 + 1
    pocket = bd.Pos(0, POCKET_Y0 - 1 + pocket_len / 2, BACK_Z) * bd.Box(2 * POCKET_X, pocket_len, RAIL_H, align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN))
    # window under the phone: only the two long-edge ledges hold it
    window_x = POCKET_X - LEDGE
    # a TIE-wide bar is left across the open end, so the cradle is a closed frame
    window_y0, window_y1 = POCKET_Y0 + TIE, POCKET_Y1
    window = bd.Pos(0, (window_y0 + window_y1) / 2, z0 - 1) * bd.Box(2 * window_x, window_y1 - window_y0, RAIL_H + 2, align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN))
    # the notch stops 1 mm under the phone's back, leaving a bar beneath the plug
    notch = bd.Pos(0, (POCKET_Y1 + END_Y1) / 2, BACK_Z - 1) * bd.Box(CABLE_NOTCH, WALL + 2, RAIL_H + 2, align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN))
    body = outer - pocket - window - notch
    body = body - sockets(INNER_PEG_X, z0) - sockets(-INNER_PEG_X, z0)
    assert len(body.solids()) == 1
    body.label = "cradle"
    body.color = "#2b2d31"
    return body


def arm_body():
    """The right-hand arm (+X); the left one is the same part turned round."""
    length = ARM_X1 - ARM_X0
    bar = bd.Pos((ARM_X0 + ARM_X1) / 2, JOINT_Y, ARM_Z) * bd.Box(length, ARM_W, ARM_T, align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN))
    bar = soften(bar, bd.Axis.X)
    body = bar + pegs(INNER_PEG_X, CRADLE_Z) - sockets(OUTER_PEG_X, ARM_Z)
    assert len(body.solids()) == 1
    body.label = "arm"
    body.color = "#2b2d31"
    return body


def leg_body():
    """The right-hand leg (+X): a post on a foot that runs front to back, with gussets."""
    x0 = LEG_X - POST_T / 2
    # the leg's side profile, in the YZ plane
    y0, y1 = JOINT_Y - POST_W / 2, JOINT_Y + POST_W / 2
    f0, f1 = JOINT_Y - FOOT_L / 2, JOINT_Y + FOOT_L / 2
    g = GUSSET
    profile = [
        (f0, 0), (f1, 0), (f1, FOOT_H), (y1 + g, FOOT_H), (y1, FOOT_H + g), (y1, ARM_Z),
        (y0, ARM_Z), (y0, FOOT_H + g), (y0 - g, FOOT_H), (f0, FOOT_H),
    ]
    with bd.BuildPart() as leg:
        with bd.BuildSketch(bd.Plane.YZ.offset(x0)):
            bd.Polygon(*profile, align=None)
        bd.extrude(amount=POST_T)
    body = soften(leg.part, bd.Axis.X) + pegs(OUTER_PEG_X, ARM_Z)
    assert len(body.solids()) == 1
    body.label = "leg"
    body.color = "#2b2d31"
    return body


# -- print orientation ----------------------------------------------------------------------
def laid_flat(shape, turn):
    """The part moved to the bed: turned (a function), then set on z = 0 at the origin."""
    turned = turn(shape)
    box = turned.bounding_box()
    return bd.Pos(-box.center().X, -box.center().Y, -box.min.Z) * turned


LEG_PRINT = lambda s: s.rotate(bd.Axis.Y, -90)  # on its side: the profile lies on the bed
FLAT = lambda s: s


@model
def cradle():
    return laid_flat(cradle_body(), FLAT)


@model
def arm():
    return laid_flat(arm_body(), FLAT)


@model
def leg():
    return laid_flat(leg_body(), LEG_PRINT)


# -- the stand --------------------------------------------------------------------------------
def phone_body():
    body = bd.Pos(0, PHONE_MID_Y, BACK_Z) * bd.Box(PHONE_W, PHONE_L, PHONE_T, align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN))
    body = bd.fillet(body.edges().filter_by(bd.Axis.Z), PHONE_R)
    plateau = bd.Pos(0, PHONE_TOP_Y + 11, BACK_Z - PLATEAU) * bd.Box(PHONE_W - 8, 18, PLATEAU, align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN))
    lens = bd.Pos(*LENS, BACK_Z - PLATEAU - 0.6) * bd.Cylinder(6, 0.6, align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN))
    body = body + plateau + lens
    body.label = "iphone_17_air"
    body.color = "#c9c4bb"
    return body


def page():
    sheet = bd.Pos(*LENS, 0) * bd.Box(A4[0], A4[1], 0.2, align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN))
    sheet.label = "a4_page"
    sheet.color = "#fafafa"
    return sheet


def view_footprint(z):
    """The camera's view on the plane at height z, as (x0, x1, y0, y1)."""
    d = CAMERA_H - z
    hx = d * math.tan(math.radians(HALF_FOV_SHORT))
    hy = d * math.tan(math.radians(HALF_FOV_LONG))
    return LENS[0] - hx, LENS[0] + hx, LENS[1] - hy, LENS[1] + hy


def in_view(part):
    """True when a part's box reaches into the camera's view (checked at its lowest point,
    where the view is widest)."""
    b = part.bounding_box()
    if b.min.Z >= CAMERA_H:
        return False
    x0, x1, y0, y1 = view_footprint(b.min.Z)
    return b.min.X < x1 and b.max.X > x0 and b.min.Y < y1 and b.max.Y > y0


@model
def scan_stand():
    # the left-hand arm and leg are the right-hand parts turned half round about the joint
    mirror_x = lambda s: s.rotate(bd.Axis.Z, 180).moved(bd.Location((0, 2 * JOINT_Y, 0)))
    c = cradle_body()
    c.label = "cradle"
    a_r = arm_body()
    a_r.label = "arm_right"
    a_l = mirror_x(arm_body())
    a_l.label = "arm_left"
    l_r = leg_body()
    l_r.label = "leg_right"
    l_l = mirror_x(leg_body())
    l_l.label = "leg_left"
    frame = [c, a_r, a_l, l_r, l_l]
    for part in frame:
        if part is c:
            continue
        assert not in_view(part), f"{part.label} would show in the photo"
    x0, x1, y0, y1 = view_footprint(0.2)
    assert x0 < LENS[0] - A4[0] / 2 and x1 > LENS[0] + A4[0] / 2, "A4 too wide for the frame"
    assert y0 < LENS[1] - A4[1] / 2 and y1 > LENS[1] + A4[1] / 2, "A4 too long for the frame"
    return bd.Compound(children=[*frame, phone_body(), page()], label="scan_stand")


if __name__ == "__main__":
    cradle()
    arm()
    leg()
    scan_stand()
