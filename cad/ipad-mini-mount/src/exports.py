"""Writes the print files: each part as it lies on the bed, and the assembly as a STEP."""
from cad import model as cad_model

from ipad_mini_mount import bottom_cradle, top_clip, wall_mount

if __name__ == "__main__":
    for part in (bottom_cradle(), top_clip()):
        cad_model.export(part, f"../STL/{part.name}.stl")
        cad_model.export(part, f"../3MF/{part.name}.3mf")
        cad_model.export(part, f"../STEP/{part.name}.step")
    cad_model.export(wall_mount(), "../STEP/wall_mount_with_ipad.step")
