export const defaultScoringMatrix = {
  updatedAt: new Date().toISOString(),
  levels: [
    { id: 'faculty', label: 'Внутривузовский', points: 15 },
    { id: 'regional', label: 'Региональный', points: 30 },
    { id: 'federal', label: 'Всероссийский', points: 50 },
    { id: 'international', label: 'Международный', points: 70 },
  ],
  descriptionBonuses: [],
};
