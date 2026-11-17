"""Writes the print files: the mount as it lies on the bed, and the assembly as a STEP."""
from cad import model as cad_model

from ipad_mini_mount import ipad_mini_mount, wall_mount

if __name__ == "__main__":
    part = ipad_mini_mount()
    cad_model.export(part, "../STL/ipad_mini_mount.stl")
    cad_model.export(part, "../3MF/ipad_mini_mount.3mf")
    cad_model.export(part, "../STEP/ipad_mini_mount.step")
    cad_model.export(wall_mount(), "../STEP/wall_mount_with_ipad.step")
