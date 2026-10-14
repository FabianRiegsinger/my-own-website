import { describe, expect, it } from "vitest";
import { garmentOf, OUTFITS, paintOf, REGIONS, regionOf } from "./avatar";

describe("regionOf", () => {
  it("dresses the body by the bone that moves each vertex", () => {
    for (const b of ["Head", "Neck", "LeftEye", "RightHand", "LeftHandIndex2", "RightHandThumb4"]) expect(regionOf(`mixamorig${b}`)).toBe("skin");
    for (const b of ["Spine", "Spine1", "Spine2", "LeftShoulder", "RightArm", "LeftForeArm"]) expect(regionOf(`mixamorig${b}`)).toBe("shirt");
    for (const b of ["Hips", "LeftUpLeg", "RightLeg"]) expect(regionOf(`mixamorig${b}`)).toBe("trousers");
    for (const b of ["LeftFoot", "RightToeBase", "LeftToe_End"]) expect(regionOf(`mixamorig${b}`)).toBe("shoes");
  });
});

describe("outfits", () => {
  it("only the chest strip stays shirt when a jacket is worn", () => {
    expect(garmentOf("shirt", true)).toBe("shirt");
    expect(garmentOf("shirt", false)).toBe("jacket");
    expect(garmentOf("trousers", true)).toBe("trousers");
    expect(garmentOf("skin", true)).toBe("skin");
  });

  it("casual is one shirt colour; business adds a navy blazer and chinos; graduation day is a grey polo with chinos", () => {
    expect(OUTFITS.casual.jacket).toBe(OUTFITS.casual.shirt);
    expect(OUTFITS.business.jacket).not.toBe(OUTFITS.business.shirt);
    expect(OUTFITS.business.trousers).not.toBe(OUTFITS.casual.trousers);
    expect(OUTFITS.polo.shirt).toBe(OUTFITS.polo.jacket);
    expect(OUTFITS.polo.shirt).not.toBe(OUTFITS.casual.shirt);
    expect(OUTFITS.polo.trousers).toBe(OUTFITS.business.trousers);
    expect("gown" in OUTFITS).toBe(false);
  });
});

describe("baked regions (the rigged me.glb)", () => {
  it("lists the regions in the order the rig script bakes them", () => {
    expect(REGIONS).toEqual(["skin", "shirt", "trousers", "shoes", "hair", "dark", "forearm"]);
  });

  it("bare forearms below the polo's short sleeves, covered by the blazer's sleeves", () => {
    expect(paintOf("forearm", OUTFITS.casual)).toBe(OUTFITS.casual.skin);
    expect(paintOf("forearm", OUTFITS.polo)).toBe(OUTFITS.polo.skin);
    expect(paintOf("forearm", OUTFITS.business)).toBe(OUTFITS.business.jacket);
  });

  it("hair and dark details keep their colour in every outfit", () => {
    for (const o of Object.values(OUTFITS)) {
      expect(paintOf("hair", o)).toBe(paintOf("hair", OUTFITS.casual));
      expect(paintOf("dark", o)).toBe(paintOf("dark", OUTFITS.casual));
    }
    expect(paintOf("shirt", OUTFITS.casual)).toBe(OUTFITS.casual.shirt);
  });
});
