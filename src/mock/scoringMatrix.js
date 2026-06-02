export const defaultScoringMatrix = {
  updatedAt: new Date().toISOString(),
  levels: [
    { id: 'faculty', label: 'Внутривузовский (факультет / вуз)', points: 15 },
    { id: 'regional', label: 'Региональный', points: 30 },
    { id: 'federal', label: 'Всероссийский', points: 50 },
    { id: 'international', label: 'Международный', points: 70 },
  ],
  descriptionBonuses: [
    { minLength: 150, points: 3 },
    { minLength: 300, points: 5 },
    { minLength: 500, points: 7 },
  ],
};
