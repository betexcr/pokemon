import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }) => {
    return <a href={href}>{children}</a>
  }
  MockLink.displayName = 'MockLink'
  return MockLink
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock fetch with proper Response object
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: () => Promise.resolve({}),
  headers: {
    get: () => 'application/json'
  }
})

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApps: jest.fn(() => []),
  getApp: jest.fn(() => ({}))
}))

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn(() => jest.fn()),
    signInWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid', email: 'test@example.com' } })),
    createUserWithEmailAndPassword: jest.fn(() => Promise.resolve({ user: { uid: 'test-uid', email: 'test@example.com' } })),
    signOut: jest.fn(() => Promise.resolve()),
    updateProfile: jest.fn(() => Promise.resolve())
  })),
  GoogleAuthProvider: jest.fn(() => ({
    addScope: jest.fn(),
    setCustomParameters: jest.fn()
  })),
  signInWithPopup: jest.fn(() => Promise.resolve({ 
    user: { uid: 'google-uid', email: 'test@gmail.com', displayName: 'Test User' },
    credential: { accessToken: 'mock-access-token' }
  })),
  signInWithRedirect: jest.fn(() => Promise.resolve()),
  getRedirectResult: jest.fn(() => Promise.resolve(null))
}))

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  setDoc: jest.fn(() => Promise.resolve()),
  getDoc: jest.fn(() => Promise.resolve({ exists: () => false })),
  getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 }))
  }
}))

// Mock Firebase context
jest.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signInWithGoogle: jest.fn(),
    logout: jest.fn()
  }),
  AuthProvider: ({ children }) => children
}))

// Mock PokeAPI calls
jest.mock('@/lib/pokeapi', () => ({
  fetchMove: jest.fn((idOrName) => {
    const mockMoves = {
      'tackle': {
        id: 33,
        name: 'tackle',
        type: { name: 'normal' },
        damage_class: { name: 'physical' },
        power: 40,
        accuracy: 100,
        pp: 35,
        priority: 0,
        meta: { crit_rate: 0, makes_contact: true },
        effect_entries: [{ language: { name: 'en' }, short_effect: 'Inflicts regular damage.' }],
        stat_changes: []
      },
      'growl': {
        id: 45,
        name: 'growl',
        type: { name: 'normal' },
        damage_class: { name: 'status' },
        power: null,
        accuracy: 100,
        pp: 40,
        priority: 0,
        meta: { crit_rate: 0, makes_contact: false },
        effect_entries: [{ language: { name: 'en' }, short_effect: 'Lowers the target\'s Attack by one stage.' }],
        stat_changes: [{ stat: { name: 'attack' }, change: -1 }],
        effect_chance: 100
      },
      'fury-swipes': {
        id: 154,
        name: 'fury-swipes',
        type: { name: 'normal' },
        damage_class: { name: 'physical' },
        power: 18,
        accuracy: 80,
        pp: 15,
        priority: 0,
        meta: { crit_rate: 0, makes_contact: true },
        effect_entries: [{ language: { name: 'en' }, short_effect: 'Hits 2-5 times in one turn.' }],
        stat_changes: [],
        min_hits: 2,
        max_hits: 5
      },
      'thunderbolt': {
        id: 85,
        name: 'thunderbolt',
        type: { name: 'electric' },
        damage_class: { name: 'special' },
        power: 90,
        accuracy: 100,
        pp: 15,
        priority: 0,
        meta: { crit_rate: 0, makes_contact: false, ailment: { name: 'paralysis' }, ailment_chance: 10 },
        effect_entries: [{ language: { name: 'en' }, short_effect: 'Has a 10% chance to paralyze the target.' }],
        stat_changes: []
      },
      'low-kick': {
        id: 67,
        name: 'low-kick',
        type: { name: 'fighting' },
        damage_class: { name: 'physical' },
        power: null, // Dynamic power
        accuracy: 100,
        pp: 20,
        priority: 0,
        meta: { crit_rate: 0, makes_contact: true },
        effect_entries: [{ language: { name: 'en' }, short_effect: 'Power varies with the target\'s weight.' }],
        stat_changes: []
      }
    };
    
    const move = mockMoves[idOrName];
    if (!move) {
      throw new Error(`Move ${idOrName} not found`);
    }
    return Promise.resolve(move);
  }),
  fetchPokemon: jest.fn(),
  fetchType: jest.fn(),
  toTitleName: jest.fn((s) => s.split('-').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(''))
}))

// Suppress console.error in tests to reduce noise
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('API call failed') || 
       args[0].includes('An update to') ||
       args[0].includes('Warning:') ||
       args[0].includes('Error: API Error'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
