import type { AnswerResult } from '@flashcards/shared'

import {
  CLOSE_ANSWER_PENALTY,
  LANGUAGE_BONUS_DE_EN,
  LEVEL_BONUS_NUMERATOR,
  MAX_TIME,
  MODE_MULTIPLIER_BLIND,
  MODE_MULTIPLIER_TYPING,
  SPEED_BONUS_POINTS
} from '../constants'
import type { Card, GameSettings } from '../types'

export interface PointsBreakdown {
  basePoints: number
  modeMultiplier: number
  pointsBeforeBonus: number
  closeAdjustment: number
  languageBonus: number
  timeBonus: number
  totalPoints: number
}

export function calculatePointsBreakdown(
  result: AnswerResult,
  card: Card | null,
  gameSettings: GameSettings | null,
  answerTime: number | undefined
): PointsBreakdown {
  if (!card || !gameSettings) {
    return {
      basePoints: 0,
      modeMultiplier: 1,
      pointsBeforeBonus: 0,
      closeAdjustment: 0,
      languageBonus: 0,
      timeBonus: 0,
      totalPoints: 0
    }
  }

  // Calculate base points from level
  const basePoints = LEVEL_BONUS_NUMERATOR - card.level

  // Determine mode multiplier
  let modeMultiplier = 1
  if (gameSettings.mode === 'blind') {
    modeMultiplier = MODE_MULTIPLIER_BLIND
  } else if (gameSettings.mode === 'typing') {
    modeMultiplier = MODE_MULTIPLIER_TYPING
  }

  // Calculate points before bonuses
  let pointsBeforeBonus = basePoints * modeMultiplier

  // Apply close answer penalty (only for 'close' results)
  let closeAdjustment = 0
  if (result === 'close') {
    pointsBeforeBonus = Math.round(pointsBeforeBonus * CLOSE_ANSWER_PENALTY)
    closeAdjustment = pointsBeforeBonus - Math.round(basePoints * modeMultiplier)
  }

  // Apply language bonus (only for correct answers in DE->EN direction)
  let languageBonus = 0
  if (result === 'correct' && gameSettings.language === 'de-en') {
    languageBonus = LANGUAGE_BONUS_DE_EN
  }

  // Apply time bonus (only for correct answers in blind/typing modes)
  let timeBonus = 0
  if (result === 'correct' && answerTime !== undefined && answerTime < MAX_TIME) {
    const isBeatTime =
      (gameSettings.mode === 'blind' && answerTime < card.time_blind) ||
      (gameSettings.mode === 'typing' && answerTime < card.time_typing)
    if (isBeatTime) {
      timeBonus = SPEED_BONUS_POINTS
    }
  }

  const totalPoints =
    result === 'correct' || result === 'close' ? pointsBeforeBonus + languageBonus + timeBonus : 0

  return {
    basePoints,
    modeMultiplier,
    pointsBeforeBonus,
    closeAdjustment,
    languageBonus,
    timeBonus,
    totalPoints
  }
}

export function calculatePoints(
  result: AnswerResult,
  card: Card | null,
  gameSettings: GameSettings | null,
  answerTime: number | undefined
): number {
  return calculatePointsBreakdown(result, card, gameSettings, answerTime).totalPoints
}
