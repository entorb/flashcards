import { config } from '@vue/test-utils'
import { Quasar } from 'quasar'

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

export const quasarStubs = {
  QPage: { template: DIV_SLOT_TEMPLATE },
  QBtn: { template: '<button><slot /></button>' },
  QCard: { template: DIV_SLOT_TEMPLATE },
  QCardSection: { template: DIV_SLOT_TEMPLATE },
  QBadge: { template: '<span><slot /></span>' },
  QInput: {
    template: '<input />',
    props: ['modelValue'],
    emits: ['update:modelValue'],
    methods: {
      focus() {
        // Stub focus method for tests
      }
    }
  },
  QIcon: { template: '<i />' },
  QDialog: { template: DIV_SLOT_TEMPLATE },
  QForm: { template: '<form><slot /></form>' },
  QList: { template: DIV_SLOT_TEMPLATE },
  QItem: { template: DIV_SLOT_TEMPLATE },
  QItemSection: { template: DIV_SLOT_TEMPLATE },
  QItemLabel: { template: '<div><slot /></div>' },
  QSeparator: { template: '<hr />' },
  QChip: { template: '<span><slot /></span>' },
  QTooltip: { template: DIV_SLOT_TEMPLATE },
  QAvatar: { template: '<div><slot /></div>' }
}

// Mock Quasar directives
export const quasarDirectives = {
  ripple: () => ({
    // Stub ripple directive
  })
}

// Mock Quasar globals for components that use $q
export const quasarMocks = {
  $q: {
    dark: { isActive: false },
    screen: {
      gt: { xs: false, sm: false, md: false },
      lt: { sm: false, md: false, lg: false }
    }
  }
}

// Provide Quasar injection tokens
export const quasarProvide = {
  _q_: quasarMocks.$q
}
