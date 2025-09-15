import { 
  BookOpen, 
  Swords, 
  Users, 
  Scale, 
  Home, 
  Settings, 
  Search,
  Zap,
  Shield,
  Heart,
  Star,
  Crown,
  Trophy,
  Gamepad2,
  Database,
  BarChart3,
  Target,
  Sparkles,
  Sword,
  Flame,
  Droplets,
  Leaf,
  Mountain,
  Wind,
  Bug,
  Ghost,
  Circle,
  Moon,
  Snowflake,
  Hand,
  Skull,
  Brain,
  Wrench
} from 'lucide-react'

export interface HeaderIconConfig {
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
}

export const HEADER_ICONS: Record<string, HeaderIconConfig> = {
  // Main pages
  'pokedex': {
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  'battle': {
    icon: Swords,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  'team-builder': {
    icon: Users,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  'compare': {
    icon: Scale,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  'lobby': {
    icon: Swords,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  'room': {
    icon: Swords,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  'home': {
    icon: Home,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  'settings': {
    icon: Settings,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  'search': {
    icon: Search,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  'profile': {
    icon: Heart,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  'leaderboard': {
    icon: Trophy,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  'achievements': {
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100'
  },
  'rankings': {
    icon: Crown,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  'games': {
    icon: Gamepad2,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  'data': {
    icon: Database,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  'analytics': {
    icon: BarChart3,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  'target': {
    icon: Target,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  'magic': {
    icon: Sparkles,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  'combat': {
    icon: Sword,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  'defense': {
    icon: Shield,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  'fire': {
    icon: Flame,
    color: 'text-red-500',
    bgColor: 'bg-red-100'
  },
  'water': {
    icon: Droplets,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  'grass': {
    icon: Leaf,
    color: 'text-green-500',
    bgColor: 'bg-green-100'
  },
  'ground': {
    icon: Mountain,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  'flying': {
    icon: Wind,
    color: 'text-sky-500',
    bgColor: 'bg-sky-100'
  },
  'bug': {
    icon: Bug,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  'ghost': {
    icon: Ghost,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  'dragon': {
    icon: Circle,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  'ice': {
    icon: Snowflake,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-100'
  },
  'fighting': {
    icon: Hand,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  'poison': {
    icon: Skull,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  'psychic': {
    icon: Brain,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  'rock': {
    icon: Mountain,
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100'
  },
  'steel': {
    icon: Wrench,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100'
  },
  'fairy': {
    icon: Sparkles,
    color: 'text-pink-500',
    bgColor: 'bg-pink-100'
  },
  'dark': {
    icon: Moon,
    color: 'text-gray-800',
    bgColor: 'bg-gray-100'
  },
  'electric': {
    icon: Zap,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100'
  },
  'normal': {
    icon: Circle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100'
  }
}

export function getHeaderIcon(iconKey: string): HeaderIconConfig {
  return HEADER_ICONS[iconKey] || HEADER_ICONS['pokedex']
}

export function getPageIconKey(pathname: string): string {
  if (pathname === '/') return 'pokedex'
  if (pathname.startsWith('/battle')) return 'battle'
  if (pathname.startsWith('/team')) return 'team-builder'
  if (pathname.startsWith('/compare')) return 'compare'
  if (pathname.startsWith('/lobby')) return 'lobby'
  if (pathname.startsWith('/room')) return 'room'
  if (pathname.startsWith('/settings')) return 'settings'
  if (pathname.startsWith('/profile')) return 'profile'
  if (pathname.startsWith('/leaderboard')) return 'leaderboard'
  if (pathname.startsWith('/achievements')) return 'achievements'
  if (pathname.startsWith('/rankings')) return 'rankings'
  if (pathname.startsWith('/games')) return 'games'
  if (pathname.startsWith('/data')) return 'data'
  if (pathname.startsWith('/analytics')) return 'analytics'
  if (pathname.startsWith('/target')) return 'target'
  if (pathname.startsWith('/magic')) return 'magic'
  if (pathname.startsWith('/combat')) return 'combat'
  if (pathname.startsWith('/defense')) return 'defense'
  if (pathname.startsWith('/search')) return 'search'
  if (pathname.startsWith('/home')) return 'home'
  
  // Pokemon type mappings
  if (pathname.includes('fire')) return 'fire'
  if (pathname.includes('water')) return 'water'
  if (pathname.includes('grass')) return 'grass'
  if (pathname.includes('ground')) return 'ground'
  if (pathname.includes('flying')) return 'flying'
  if (pathname.includes('bug')) return 'bug'
  if (pathname.includes('ghost')) return 'ghost'
  if (pathname.includes('dragon')) return 'dragon'
  if (pathname.includes('ice')) return 'ice'
  if (pathname.includes('fighting')) return 'fighting'
  if (pathname.includes('poison')) return 'poison'
  if (pathname.includes('psychic')) return 'psychic'
  if (pathname.includes('rock')) return 'rock'
  if (pathname.includes('steel')) return 'steel'
  if (pathname.includes('fairy')) return 'fairy'
  if (pathname.includes('dark')) return 'dark'
  if (pathname.includes('electric')) return 'electric'
  if (pathname.includes('normal')) return 'normal'
  
  return 'pokedex'
}