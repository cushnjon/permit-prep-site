import { describe, expect, it } from "vitest";
import {
  getRelatedReviewQuestions,
  getSpeedTestGroupIndex,
  REVIEW_GROUPS,
  SPEED_TEST_GROUP_PALETTE,
  BINGO_BOARD_ROWS,
  BINGO_LINES,
  BINGO_LINE_BONUS,
  HARD_QUESTION_IDS,
  getBingoSlotIndicesForQuestion,
  getNewlyCompletedBingoLines,
  isHardSpeedTestQuestion,
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

  it("provides light answer-button colors for all group palettes", () => {
    expect(SPEED_TEST_GROUP_PALETTE.every((color) => color.answer.includes("bg-") && color.answer.includes("border-"))).toBe(true);
  });

  it("builds four category rows with five colored Bingo Prep spaces each", () => {
    expect(BINGO_BOARD_ROWS).toHaveLength(4);
    expect(BINGO_BOARD_ROWS.every((row) => row.length === 5)).toBe(true);
    expect(new Set(BINGO_BOARD_ROWS.flat()).size).toBe(20);
    expect(BINGO_LINES.length).toBe(13);
    expect(BINGO_LINE_BONUS).toBe(1000);
  });

  it("gives designated hard questions two spaces and other questions one", () => {
    const hardQuestionId = Array.from(HARD_QUESTION_IDS)[0];
    const regularQuestionId = Array.from({ length: 100 }, (_, index) => index + 1)
      .find((questionId) => !isHardSpeedTestQuestion(questionId));

    expect(hardQuestionId).toBeDefined();
    expect(regularQuestionId).toBeDefined();
    expect(getBingoSlotIndicesForQuestion(hardQuestionId!)).toHaveLength(2);
    expect(getBingoSlotIndicesForQuestion(regularQuestionId!)).toHaveLength(1);
  });

  it("detects newly completed horizontal, vertical, and diagonal lines once", () => {
    expect(getNewlyCompletedBingoLines([0, 1, 2, 3, 4])).toContain("row-0");
    expect(getNewlyCompletedBingoLines([0, 5, 10, 15])).toContain("column-0");
    expect(getNewlyCompletedBingoLines([0, 6, 12, 18])).toContain("diagonal-down-left");
    expect(getNewlyCompletedBingoLines([0, 1, 2, 3, 4], ["row-0"])).not.toContain("row-0");
  });
});

