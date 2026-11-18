import { describe, expect, it } from "vitest";
import { passwordError } from "./password";

describe("passwordError", () => {
  it("refuse moins de 10 caractères", () => expect(passwordError("Ab1!xyz")).not.toBeNull());
  it("refuse sans symbole", () => expect(passwordError("Abcdefgh12")).not.toBeNull());
  it("refuse sans majuscule", () => expect(passwordError("abcdefg1!x")).not.toBeNull());
  it("accepte un mot de passe fort", () => expect(passwordError("Campus2026!x")).toBeNull());
});
