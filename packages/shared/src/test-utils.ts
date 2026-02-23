// Shared test utilities for Vitest setup
import { config } from '@vue/test-utils'
import { Quasar } from 'quasar'
import { vi } from 'vitest'

// Create in-memory storage implementation for localStorage and sessionStorage
export class LocalStorageMock implements Storage {
  private readonly store: Map<string, string> = new Map()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys())
    return keys[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value)
  }
}

// Configure Quasar for tests
export function installQuasarPlugin() {
  config.global.plugins.unshift([
    Quasar,
    {
      // Provide minimal config needed for SSR/testing
      config: {},
      components: {},
      directives: {},
      plugins: {}
    }
  ])
}

// Stub Quasar components for faster tests
const DIV_SLOT_TEMPLATE = '<div><slot /></div>'
const SPAN_SLOT_TEMPLATE = '<span><slot /></span>'
const UPDATE_MODEL_VALUE = 'update:modelValue'

export const quasarStubs = {
  QPage: { template: DIV_SLOT_TEMPLATE },
  QLayout: { template: DIV_SLOT_TEMPLATE },
  QHeader: { template: DIV_SLOT_TEMPLATE },
  QFooter: { template: DIV_SLOT_TEMPLATE },
  QDrawer: { template: DIV_SLOT_TEMPLATE },
  QPageContainer: { template: DIV_SLOT_TEMPLATE },
  QPageSticky: { template: DIV_SLOT_TEMPLATE },
  QPageScroller: { template: DIV_SLOT_TEMPLATE },
  QToolbar: { template: DIV_SLOT_TEMPLATE },
  QToolbarTitle: { template: DIV_SLOT_TEMPLATE },
  QBtn: { template: '<button><slot /></button>' },
  QBtnGroup: { template: DIV_SLOT_TEMPLATE },
  QBtnDropdown: { template: DIV_SLOT_TEMPLATE },
  QBtnToggle: {
    template: '<div class="q-btn-toggle"><slot /></div>',
    props: ['modelValue', 'options'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QCard: { template: DIV_SLOT_TEMPLATE },
  QCardSection: { template: DIV_SLOT_TEMPLATE },
  QCardActions: { template: DIV_SLOT_TEMPLATE },
  QBadge: { template: SPAN_SLOT_TEMPLATE },
  QChip: { template: SPAN_SLOT_TEMPLATE },
  QAvatar: { template: DIV_SLOT_TEMPLATE },
  QIcon: { template: '<i />' },
  QImg: { template: '<img />' },
  QVideo: { template: DIV_SLOT_TEMPLATE },
  QInput: {
    name: 'QInput',
    template:
      '<div><input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" /><slot name="prepend" /><slot name="append" /></div>',
    props: ['modelValue', 'label', 'type', 'filled', 'error', 'hideBottomSpace'],
    emits: [UPDATE_MODEL_VALUE],
    methods: {
      focus() {
        // Stub focus method for tests
      }
    }
  },
  QSelect: {
    template: '<select><slot /></select>',
    props: ['modelValue', 'options'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QField: { template: DIV_SLOT_TEMPLATE },
  QForm: { template: '<form><slot /></form>' },
  QToggle: {
    template: '<input type="checkbox" />',
    props: ['modelValue'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QCheckbox: {
    template: '<input type="checkbox" />',
    props: ['modelValue'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QRadio: {
    template: '<input type="radio" />',
    props: ['modelValue'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QOptionGroup: {
    template: DIV_SLOT_TEMPLATE,
    props: ['modelValue', 'options'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QSlider: {
    template: '<input type="range" />',
    props: ['modelValue'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QRange: {
    template: DIV_SLOT_TEMPLATE,
    props: ['modelValue'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QRating: {
    template: DIV_SLOT_TEMPLATE,
    props: ['modelValue'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QKnob: {
    template: DIV_SLOT_TEMPLATE,
    props: ['modelValue'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QDialog: { template: DIV_SLOT_TEMPLATE },
  QMenu: { template: DIV_SLOT_TEMPLATE },
  QTooltip: { template: DIV_SLOT_TEMPLATE },
  QPopupProxy: { template: DIV_SLOT_TEMPLATE },
  QPopupEdit: { template: DIV_SLOT_TEMPLATE },
  QContextMenu: { template: DIV_SLOT_TEMPLATE },
  QList: { template: DIV_SLOT_TEMPLATE },
  QItem: { template: DIV_SLOT_TEMPLATE },
  QItemSection: { template: DIV_SLOT_TEMPLATE },
  QItemLabel: { template: DIV_SLOT_TEMPLATE },
  QSeparator: { template: '<hr />' },
  QScrollArea: { template: DIV_SLOT_TEMPLATE },
  QSpace: { template: '<span />' },
  QBar: { template: DIV_SLOT_TEMPLATE },
  QBanner: { template: DIV_SLOT_TEMPLATE },
  QChatMessage: { template: DIV_SLOT_TEMPLATE },
  QCircularProgress: { template: DIV_SLOT_TEMPLATE },
  QLinearProgress: {
    template: '<div class="q-linear-progress" />',
    props: ['value', 'size', 'color']
  },
  QSpinner: { template: DIV_SLOT_TEMPLATE },
  QSpinnerDots: { template: DIV_SLOT_TEMPLATE },
  QCarousel: { template: DIV_SLOT_TEMPLATE },
  QCarouselSlide: { template: DIV_SLOT_TEMPLATE },
  QTabs: { template: DIV_SLOT_TEMPLATE },
  QTab: { template: DIV_SLOT_TEMPLATE },
  QRouteTab: { template: DIV_SLOT_TEMPLATE },
  QTabPanels: { template: DIV_SLOT_TEMPLATE },
  QTabPanel: { template: DIV_SLOT_TEMPLATE },
  QExpansionItem: { template: DIV_SLOT_TEMPLATE },
  QStepper: { template: DIV_SLOT_TEMPLATE },
  QStep: { template: DIV_SLOT_TEMPLATE },
  QStepperNavigation: { template: DIV_SLOT_TEMPLATE },
  QTimeline: { template: DIV_SLOT_TEMPLATE },
  QTimelineEntry: { template: DIV_SLOT_TEMPLATE },
  QTree: { template: DIV_SLOT_TEMPLATE },
  QTable: {
    template:
      '<div><slot name="header" :props="{}" /><slot name="body" v-for="row in rows" :row="row" :props="{ row }" /><slot /></div>',
    props: ['rows', 'columns', 'rowKey']
  },
  QTh: { template: '<th><slot /></th>', props: ['props'] },
  QTr: { template: '<tr><slot /></tr>', props: ['props'] },
  QTd: { template: '<td><slot /></td>', props: ['props'] },
  QMarkupTable: { template: '<table><slot /></table>' },
  QBreadcrumbs: { template: DIV_SLOT_TEMPLATE },
  QBreadcrumbsEl: { template: SPAN_SLOT_TEMPLATE },
  QPagination: {
    template: DIV_SLOT_TEMPLATE,
    props: ['modelValue'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QInfiniteScroll: { template: DIV_SLOT_TEMPLATE },
  QPullToRefresh: { template: DIV_SLOT_TEMPLATE },
  QVirtualScroll: { template: DIV_SLOT_TEMPLATE },
  QIntersection: { template: DIV_SLOT_TEMPLATE },
  QResizeObserver: { template: '<span />' },
  QScrollObserver: { template: '<span />' },
  QNoSsr: { template: DIV_SLOT_TEMPLATE },
  QResponsive: { template: DIV_SLOT_TEMPLATE },
  QFab: { template: DIV_SLOT_TEMPLATE },
  QFabAction: { template: DIV_SLOT_TEMPLATE },
  QActionSheet: { template: DIV_SLOT_TEMPLATE },
  QBottomSheet: { template: DIV_SLOT_TEMPLATE },
  QColor: {
    template: DIV_SLOT_TEMPLATE,
    props: ['modelValue'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QDate: {
    template: DIV_SLOT_TEMPLATE,
    props: ['modelValue'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QTime: {
    template: DIV_SLOT_TEMPLATE,
    props: ['modelValue'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QEditor: {
    template: DIV_SLOT_TEMPLATE,
    props: ['modelValue'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QFile: {
    template: '<input type="file" />',
    props: ['modelValue'],
    emits: [UPDATE_MODEL_VALUE]
  },
  QUploader: { template: DIV_SLOT_TEMPLATE },
  QUploaderAddTrigger: { template: DIV_SLOT_TEMPLATE },
  QSplitter: { template: DIV_SLOT_TEMPLATE },
  QAjaxBar: { template: '<span />' }
}

// Mock Quasar directives
export const quasarDirectives = {
  ripple: () => ({
    // Stub ripple directive
  })
}

interface QuasarDialogChain {
  onOk: () => QuasarDialogChain
  onCancel: () => QuasarDialogChain
  onDismiss: () => QuasarDialogChain
}

interface QuasarMock {
  $q: {
    dialog: (opts?: unknown) => QuasarDialogChain
    notify: (opts?: unknown) => void
    platform: { is: { mobile: boolean } }
    dark: { isActive: boolean }
    screen: {
      gt: { xs: boolean; sm: boolean; md: boolean }
      lt: { sm: boolean; md: boolean; lg: boolean }
    }
  }
}

// Mock Quasar globals for components that use $q
export const quasarMocks: QuasarMock = {
  $q: {
    dialog: vi.fn(() => ({
      onOk: vi.fn(),
      onCancel: vi.fn(),
      onDismiss: vi.fn()
    })),
    notify: vi.fn(),
    platform: {
      is: { mobile: false }
    },
    dark: { isActive: false },
    screen: {
      gt: { xs: false, sm: false, md: false },
      lt: { sm: false, md: false, lg: false }
    }
  }
}

// Provide map for Quasar injection keys
export const quasarProvide: Record<string, unknown> = {
  _q_: quasarMocks.$q
}

// Suppress Vue warnings about unresolved components in tests
export function suppressComponentWarnings(): void {
  vi.spyOn(console, 'warn').mockImplementation((...args) => {
    if (typeof args[0] === 'string' && args[0].includes('Failed to resolve component')) return
    console.warn(...args)
  })
}
