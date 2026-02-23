import { beforeEach, describe, expect, it, vi } from 'vitest'

import { TEXT_DE } from '../text-de'
import { useResetCards } from './useResetCards'

const mockNotify = vi.fn()
const mockOnOk = vi.fn()
const mockDialog = vi.fn(() => ({ onOk: mockOnOk }))

vi.mock('quasar', () => ({
  useQuasar: () => ({
    dialog: mockDialog,
    notify: mockNotify
  })
}))

describe('useResetCards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDialog.mockReturnValue({ onOk: mockOnOk })
  })

  it('showResetDialog calls $q.dialog with correct title and message', () => {
    const { showResetDialog } = useResetCards()

    showResetDialog(vi.fn())

    expect(mockDialog).toHaveBeenCalledWith(
      expect.objectContaining({
        title: TEXT_DE.shared.cardActions.confirmResetTitle,
        message: TEXT_DE.shared.cardActions.confirmResetMessage
      })
    )
  })

  it('onOk callback calls the provided onConfirm function', () => {
    let capturedCallback: (() => void) | null = null
    mockOnOk.mockImplementation((cb: () => void) => {
      capturedCallback = cb
    })

    const onConfirm = vi.fn()
    const { showResetDialog } = useResetCards()
    showResetDialog(onConfirm)

    expect(capturedCallback).not.toBeNull()
    capturedCallback!()
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('onOk callback calls $q.notify with positive type', () => {
    let capturedCallback: (() => void) | null = null
    mockOnOk.mockImplementation((cb: () => void) => {
      capturedCallback = cb
    })

    const { showResetDialog } = useResetCards()
    showResetDialog(vi.fn())

    expect(capturedCallback).not.toBeNull()
    capturedCallback!()
    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'positive' }))
  })
})
