"""A desk cable organizer: a rounded block with snap-in cable slots.

Each slot runs front to back. A cable is pressed down through a funnel and a neck a little
narrower than the cable into a round seat, which holds it so the plug end can't slide back
off the desk. Three small slots take phone cables (USB-C, Lightning, about 3-4.5 mm);
two large ones take laptop or monitor cables (about 6-7 mm).

Modeled as it prints: flat bottom on the bed, Z up, no supports. Units: mm.
"""

import build123d as bd
from cad import model

# (seat diameter, neck width): the neck is ~0.5-1 mm narrower than the cable it holds
SMALL = (5.0, 3.6)
LARGE = (7.5, 5.6)
SLOTS = [LARGE, SMALL, SMALL, SMALL, LARGE]

DEPTH = 26.0  # front to back
HEIGHT = 20.0
WALL = 5.5  # material between neighbouring seats, and at each end
SEAT_Z = 10.0  # height of the seat centres above the desk
FUNNEL = 2.6  # how much wider than the neck the slot is at the top, each side
CORNER_R = 4.0
TOP_R = 1.6


def slot_cutter(x, seat_d, neck_w, depth, height):
    """The slot's profile in the XZ plane, pushed through the block along Y."""
    r = seat_d / 2
    top_w = neck_w + 2 * FUNNEL
    funnel_h = FUNNEL  # 45 degree funnel walls
    with bd.BuildPart() as cutter:
        with bd.BuildSketch(bd.Plane.XZ):
            with bd.Locations((x, SEAT_Z)):
                bd.Circle(r)
            with bd.Locations((x, (SEAT_Z + height + 1) / 2)):
                bd.Rectangle(neck_w, height + 1 - SEAT_Z)
            bd.Polygon(
                (x - neck_w / 2, height - funnel_h),
                (x + neck_w / 2, height - funnel_h),
                (x + top_w / 2, height + 0.01),
                (x + top_w / 2, height + 1),
                (x - top_w / 2, height + 1),
                (x - top_w / 2, height + 0.01),
                align=None,
            )
        bd.extrude(amount=depth / 2 + 1, both=True)
    return cutter.part


def organizer_body(slots, depth, height):
    widths = [max(seat, neck + 2 * FUNNEL) for seat, neck in slots]
    length = sum(widths) + WALL * (len(slots) + 1)
    body = bd.Box(length, depth, height, align=(bd.Align.CENTER, bd.Align.CENTER, bd.Align.MIN))
    body = bd.fillet(body.edges().filter_by(bd.Axis.Z), CORNER_R)
    body = bd.fillet(body.edges().group_by(bd.Axis.Z)[-1], TOP_R)

    x = -length / 2 + WALL
    for (seat, neck), width in zip(slots, widths):
        body = body - slot_cutter(x + width / 2, seat, neck, depth, height)
        x += width + WALL

    assert abs(body.bounding_box().size.Z - height) < 1e-6
    assert len(body.solids()) == 1
    assert body.volume < length * depth * height * 0.9, "slots were not cut"
    body.label = "cable_organizer"
    body.color = "#3d4f63"
    return body


@model
def cable_organizer():
    return organizer_body(SLOTS, DEPTH, HEIGHT)


if __name__ == "__main__":
    cable_organizer()
