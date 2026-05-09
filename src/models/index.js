// Message Model
export class Message {
  constructor({ id, role, text, timestamp = new Date() }) {
    this.id = id;
    this.role = role; // 'user' | 'bot' | 'human'
    this.text = text;
    this.timestamp = timestamp;
  }
}

// Session Model
export class Session {
  constructor({
    id,
    emotion,
    messages = [],
    startTime = new Date(),
    endTime = null,
  }) {
    this.id = id;
    this.emotion = emotion;
    this.messages = messages;
    this.startTime = startTime;
    this.endTime = endTime;
  }
}

// Subscription Plan Model
export class Plan {
  constructor({ id, name, price, features = [], cta }) {
    this.id = id;
    this.name = name;
    this.price = price;
    this.features = features;
    this.cta = cta;
  }
}

// Emotion Model
export const EMOTIONS = [
  { id: 'low', label: 'Low', emoji: '🌧️' },
  { id: 'stressed', label: 'Stressed', emoji: '🌪️' },
  { id: 'okay', label: 'Okay', emoji: '🌤️' },
  { id: 'talk', label: 'Just want to talk', emoji: '💬' },
];

// Reflection Options
export const REFLECTION_OPTIONS = [
  { id: 'better', label: 'Better', emoji: '😌' },
  { id: 'same', label: 'Same', emoji: '😐' },
  { id: 'worse', label: 'Worse', emoji: '😔' },
];

// Subscription Plans
export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    features: ['5 AI chats/month', 'Basic mood tracking', 'Text only'],
    cta: 'Get Started',
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '₹299/mo',
    features: [
      'Unlimited AI chats',
      'Memory across sessions',
      'Human escalation',
    ],
    cta: 'Start Basic',
    highlighted: true,
  },
  {
    id: 'voice',
    name: 'Voice Add-on',
    price: '₹199/mo',
    features: ['Voice sessions', 'Waveform UI', 'Add to any plan'],
    cta: 'Add Voice',
  },
];

// Prompt Chips
export const PROMPT_CHIPS = [
  { id: '1', label: 'I feel lonely' },
  { id: '2', label: 'I want to vent' },
  { id: '3', label: 'I feel overwhelmed' },
];

// Matching Filters
export const MATCHING_FILTERS = [
  { id: 'relationships', label: 'Relationships' },
  { id: 'stress', label: 'Stress' },
  { id: 'career', label: 'Career' },
];
