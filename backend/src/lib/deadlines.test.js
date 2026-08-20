import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { shouldRecordDeadlineChange } from "./deadlines.js";

describe("deadline history", () => {
  it("records a change when the deadline moves", () => {
    assert.equal(
      shouldRecordDeadlineChange("2026-08-20T00:00:00.000Z", "2026-08-25T00:00:00.000Z"),
      true
    );
  });

  it("does not record when the deadline is unchanged", () => {
    const same = "2026-08-20T00:00:00.000Z";
    assert.equal(shouldRecordDeadlineChange(same, same), false);
  });

  it("records clearing or setting a deadline", () => {
    assert.equal(shouldRecordDeadlineChange("2026-08-20T00:00:00.000Z", null), true);
    assert.equal(shouldRecordDeadlineChange(null, "2026-08-20T00:00:00.000Z"), true);
    assert.equal(shouldRecordDeadlineChange(null, null), false);
  });
});
