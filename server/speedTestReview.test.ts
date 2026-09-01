import { describe, expect, it } from "vitest";
import {
  getRelatedReviewQuestions,
  getSpeedTestGroupIndex,
  REVIEW_GROUPS,
  SPEED_TEST_GROUP_PALETTE,
} from "../client/src/components/SpeedTestGame";

describe("Speed Test related review groups", () => {
  it("keeps every unnamed internal group at seven questions or fewer", () => {
    expect(REVIEW_GROUPS.length).toBeGreaterThan(0);
    expect(REVIEW_GROUPS.every((group) => group.length <= 7)).toBe(true);
  });

  it("returns no more than five related questions and excludes the missed question", () => {
    for (let questionId = 1; questionId <= 100; questionId += 1) {
      const related = getRelatedReviewQuestions(questionId);
      expect(related.length).toBeLessThanOrEqual(5);
      expect(related.some((question) => question.id === questionId)).toBe(false);
    }
  });

  it("returns an empty list for an unknown question", () => {
    expect(getRelatedReviewQuestions(999)).toEqual([]);
  });

  it("assigns every question to exactly one colored group slot", () => {
    for (let questionId = 1; questionId <= 100; questionId += 1) {
      const groupIndex = getSpeedTestGroupIndex(questionId);
      expect(groupIndex).toBeGreaterThanOrEqual(0);
      expect(groupIndex).toBeLessThan(REVIEW_GROUPS.length);
      expect(SPEED_TEST_GROUP_PALETTE[groupIndex % SPEED_TEST_GROUP_PALETTE.length].surface).toMatch(/^bg-/);
    }
  });

  it("provides a light-color palette with enough entries for the group slots", () => {
    expect(SPEED_TEST_GROUP_PALETTE.length).toBeGreaterThan(0);
    expect(SPEED_TEST_GROUP_PALETTE.every((color) => color.surface.endsWith("-50"))).toBe(true);
    expect(SPEED_TEST_GROUP_PALETTE.every((color) => color.filled.includes("text-white"))).toBe(true);
  });
});

