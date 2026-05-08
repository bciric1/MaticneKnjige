export const APP_VERSION = '1.0.0';

// ─── Podaci o uspehu po razredu ───────────────────────────────────────────────
export type PredmetOcena = {
  naziv: string;         // npr. "Srpski jezik i književnost"
  ocena: string;        // "5", "4", ... ili "" ako nije pohađao
};

export type RazredniPodaci = {
  skolskaGodina: string;           // "2022/2023"
  razred: string;                  // "I", "II", "III", "IV"
  predmeti: PredmetOcena[];
  vladanje: string;                // "primerno (5)", "dobro (4)", ...
  opstiUspeh: string;             // "odličan (4.83)"
  prosecnaOcena: string;          // "4.83"

  // Administrativni zapisi
  delovodniBrojIspisnice: string;
  datumIspisnice: string;
  primilaIspisnicu: string;        // potpis i datum

  delovodniBrojUverenjaPIspit: string;
  datumUverenjaPIspit: string;
  primilaUverenjePIspit: string;

  delovodniBrojSvedocanstva: string;
  datumSvedocanstva: string;
  primiliSvedocanstvo: string;
  serijskiBrojSvedocanstva: string;
  potpisOdeljenskogStaresine: string;
};

// ─── Matura ───────────────────────────────────────────────────────────────────
export type MaturskoNaZnanje = {
  naziv: string;   // naziv predmeta/testa
  ocena: string;
};

export type MaturskaRadOcene = {
  nazivRada: string;
  ocenaIzrade: string;
  ocenaOdbrane: string;
  ocenaRada: string;    // finalna ocena
};

export type Matura = {
  tipIspita: string;              // "maturski", "završni", ...
  rokPolaganja: string;           // "junski", "avgustovski", ...
  skolskaGodina: string;
  godinaPolaganja: string;

  predmetiZnanje: MaturskoNaZnanje[];   // do 4 predmeta/testa
  datumOdbraneRada: string;
  maturskiRad: MaturskaRadOcene;
  ukupnaOcena: string;
  uspeh: string;                  // "odličan", "vrlo dobar", ...

  // Diplome
  delovodniBrojDiplome: string;
  datumDiplome: string;
  delovodniBrojUverenja: string;
  datumUverenja: string;
  serijskiBrojDiplome: string;
  primilaDispIUverenje: string;   // potpis i datum
};

// ─── Glavni tip – Učenik ──────────────────────────────────────────────────────
export type Student = {
  id: string;

  // Zaglavlje obrasca
  brObrasca: string;              // kutijice: br / raz / škol / br
  brojURegistru: string;
  jmbg: string;
  job: string;                    // Jedinstveni obrazovni broj

  // Lični podaci
  prezime: string;
  ime: string;
  mestoRodjenja: string;
  datumRodjenja: string;          // ISO string "YYYY-MM-DD"
  opstinaRodjenja: string;
  drzavaRodjenja: string;

  // Roditelji / staratelji
  imeRoditeljaOca: string;        // "otac/majka"
  imeRoditeljaStaratelja: string; // puno ime

  // Upis
  skolaUpisa: string;             // naziv škole
  razredUpisa: string;            // "I"
  obrazovniProfilSmer: string;    // "Elektrotehničar računara"
  smer?: string;                  // "IT"
  jispProgram: string;            // npr. "Elektrotehnika"
  trajanjeObrazovanjaGodina: number; // 4

  // Uspeh po razredima (ključ = 1, 2, 3, 4...)
  razredi: { [key: number]: RazredniPodaci };

  // Pohvale i nagrade
  pohvaleINagrade: string;

  // Matura
  matura: Matura;

  // Napomene
  napomene: string;
};

export type FieldPosition = {
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
};

export interface PrintCalibrationSettings {
  [fieldId: string]: { x: number; y: number } | any;
  gradesRowHeight?: number;
  gradesColWidth?: number;
}
