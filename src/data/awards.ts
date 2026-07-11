export interface Award {
  medal: "Gold" | "Silver" | "Bronze";
  category: string;
}

export const championshipName = "Nordic Nuad-Thai Massage Championship 2026";
export const championshipLocation = "Finnland";
export const championshipDates = "13. bis 14. Juni 2026";

export const awards: Award[] = [
  { medal: "Gold", category: "Thai-Massage" },
  { medal: "Gold", category: "Sportmassage" },
  { medal: "Silver", category: "Freestyle" },
  { medal: "Bronze", category: "Wellness" },
];

/** German display label per medal key. */
export const medalLabels: Record<Award["medal"], string> = {
  Gold: "Gold",
  Silver: "Silber",
  Bronze: "Bronze",
};

export const awardsSectionTitle =
  "Preisgekrönte Hände. Verwurzelt in Tradition. Verfeinert durch Disziplin.";

export const awardsSectionCopy =
  "2026 wurde Pratana an der Nordic Nuad-Thai Massage Championship in Finnland mit vier Medaillen ausgezeichnet, darunter Gold in Thai-Massage und Sportmassage. Diese Auszeichnungen stehen für Disziplin, Präzision und tiefen Respekt vor der Heilkunst hinter ihrer Arbeit.";
