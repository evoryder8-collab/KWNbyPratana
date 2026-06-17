export interface Award {
  medal: "Gold" | "Silver" | "Bronze";
  category: string;
}

export const championshipName = "Nordic Nuad-Thai Massage Championship 2026";
export const championshipLocation = "Finland";
export const championshipDates = "13–14 June 2026";

export const awards: Award[] = [
  { medal: "Gold", category: "Thai Massage" },
  { medal: "Gold", category: "Sport Massage" },
  { medal: "Silver", category: "Freestyle" },
  { medal: "Bronze", category: "Wellness" },
];

export const awardsSectionTitle =
  "Award-winning hands. Rooted in tradition. Refined through discipline.";

export const awardsSectionCopy =
  "In 2026, Pratana received four medals at the Nordic Nuad-Thai Massage Championship in Finland, including Gold in both Thai Massage and Sport Massage. These awards reflect her discipline, precision, and deep respect for the healing traditions behind her work.";
