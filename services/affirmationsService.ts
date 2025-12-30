// Daily Affirmations Service
// Personalized affirmations based on mood and streak

const AFFIRMATION_POOL = {
    general: [
        "Mereces paz y tranquilidad hoy 🌸",
        "Tu presencia importa más de lo que crees 💚",
        "Un paso a la vez es más que suficiente",
        "Eres más fuerte de lo que piensas",
        "Hoy es una nueva oportunidad para cuidarte",
        "Tu bienestar es una prioridad válida",
        "Está bien no estar bien. Lo que sientes es válido",
        "Cada pequeño esfuerzo cuenta",
        "Tienes permiso para descansar",
        "Eres suficiente, exactamente como eres",
    ],
    streak: [
        "🔥 {days} días cuidándote. ¡Increíble constancia!",
        "Tu compromiso contigo mismo es admirable: {days} días seguidos",
        "Cada día que te cuidas, te vuelves más fuerte. Día {days} 💪",
        "{days} días de racha. Tu yo del futuro te lo agradece",
    ],
    morning: [
        "Buenos días. Hoy tienes el poder de elegir cómo reaccionar ☀️",
        "Que este día te traiga momentos de calma 🌅",
        "Un nuevo día, una nueva oportunidad de ser amable contigo",
    ],
    evening: [
        "Has sobrevivido otro día. Eso es un logro 🌙",
        "Descansa. Mañana es un nuevo comienzo",
        "Permítete soltar las preocupaciones de hoy",
    ],
    onStruggle: [
        "Los días difíciles no duran para siempre 💙",
        "Pedir ayuda es un acto de valentía, no de debilidad",
        "Este momento pasará. Tú puedes con esto",
        "No tienes que enfrentar esto solo/a",
    ],
    onGoodDay: [
        "Celebra este buen momento, te lo mereces 🎉",
        "Tu sonrisa tiene poder. Compártela hoy",
        "Los buenos días son recordatorios de que vale la pena seguir",
    ],
};

export interface AffirmationContext {
    currentStreak?: number;
    currentMood?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

export const getDailyAffirmation = (context: AffirmationContext = {}): string => {
    const { currentStreak = 0, currentMood, timeOfDay } = context;

    // Determine time if not provided
    const hour = new Date().getHours();
    const time = timeOfDay || (hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening');

    // Build pool based on context
    let pool: string[] = [...AFFIRMATION_POOL.general];

    // Add streak affirmations if applicable
    if (currentStreak >= 3) {
        const streakAffirmations = AFFIRMATION_POOL.streak.map(a =>
            a.replace('{days}', currentStreak.toString())
        );
        pool = [...pool, ...streakAffirmations];
    }

    // Add time-based affirmations
    if (time === 'morning') {
        pool = [...pool, ...AFFIRMATION_POOL.morning];
    } else if (time === 'evening') {
        pool = [...pool, ...AFFIRMATION_POOL.evening];
    }

    // Add mood-based affirmations
    if (currentMood === 'Sad' || currentMood === 'Overwhelmed') {
        pool = [...pool, ...AFFIRMATION_POOL.onStruggle, ...AFFIRMATION_POOL.onStruggle]; // Double weight
    } else if (currentMood === 'Great' || currentMood === 'Good') {
        pool = [...pool, ...AFFIRMATION_POOL.onGoodDay];
    }

    // Select random from pool (seeded by today's date for consistency)
    const today = new Date().toISOString().split('T')[0];
    const seed = today.split('-').reduce((a, b) => a + parseInt(b), 0);
    const index = seed % pool.length;

    return pool[index];
};

export const getMultipleAffirmations = (count: number = 3, context: AffirmationContext = {}): string[] => {
    const all = [...AFFIRMATION_POOL.general];
    const result: string[] = [];

    for (let i = 0; i < count && all.length > 0; i++) {
        const index = Math.floor(Math.random() * all.length);
        result.push(all.splice(index, 1)[0]);
    }

    return result;
};
