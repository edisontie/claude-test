"""Writes the print files (each part as it lies on the bed) and the assembled stand as a STEP."""
from cad import model as cad_model

from scan_stand import arm, cradle, leg, scan_stand

if __name__ == "__main__":
    for part in (cradle(), arm(), leg()):
        for kind in ("STL", "3MF", "STEP"):
            cad_model.export(part, f"../{kind}/{part.name}.{kind.lower()}")
    cad_model.export(scan_stand(), "../STEP/scan_stand_assembled.step")
