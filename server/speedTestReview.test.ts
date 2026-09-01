import { describe, expect, it } from "vitest";
import { getRelatedReviewQuestions, REVIEW_GROUPS } from "../client/src/components/SpeedTestGame";

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
});

