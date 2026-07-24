export type CampusImageKey =
  | "campusBuilding"
  | "library"
  | "classroom"
  | "studentStudy"
  | "campusActivity";

type CampusImageConfig = {
  src: string;
  alt: string;
};

const fallbackCampusPhoto = "/jana-bhawana-campus.jpg";

// Replace these values with authentic Jana Bhawana Campus photos when available.
// Keep local/public paths so assets stay controlled and resilient.
export const campusImages: Record<CampusImageKey, CampusImageConfig> = {
  campusBuilding: {
    src: fallbackCampusPhoto,
    alt: "Jana Bhawana Campus main academic building in Chapagaun, Lalitpur",
  },
  library: {
    src: fallbackCampusPhoto,
    alt: "Jana Bhawana Campus study and library environment",
  },
  classroom: {
    src: fallbackCampusPhoto,
    alt: "Jana Bhawana Campus classroom used for Tribhuvan University courses",
  },
  studentStudy: {
    src: fallbackCampusPhoto,
    alt: "Jana Bhawana Campus students studying with academic resources",
  },
  campusActivity: {
    src: fallbackCampusPhoto,
    alt: "Academic activity at Jana Bhawana Campus",
  },
};
