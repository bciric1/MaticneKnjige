# Матична Књига Ученика / Student Registry

🇷🇸 **Српски** | 🇬🇧 **English**

---

## 🇷🇸 О пројекту (About the Project)

**Матична Књига Ученика** је модерна веб апликација креирана за средње школе, која олакшава дигитално вођење евиденције ученика и прецизно штампање података директно на званичне А3 обрасце (матичне књиге). 

Апликација омогућава корисницима да унесу или увезу податке ученика, воде евиденцију о оценама кроз све четири године школовања, и аутоматски позиционирају и одштампају те податке на већ унапред припремљене физичке папире (обрасце) захваљујући напредном систему за калибрацију штампе.

### Главне функционалности:
- 📊 **Комплетна евиденција:** Чување личних података, података о упису, успеху, владању и матурским испитима за све 4 године.
- 🔌 **Интеграција са еДневником:** Уграђена JavaScript скрипта (`ednevnik_scraper.js`) која аутоматски извлачи податке о ученицима и оценама директно из еДневника и припрема их за увоз у систем.
- 🖨️ **Прецизна калибрација штампе (Pixel-Perfect):** Интерактивни интерфејс ("Подешавање штампе") који омогућава кориснику да мишем превлачи поља (Drag & Drop) преко дигиталног приказа А3 обрасца како би се подаци савршено поклопили са линијама на физичком папиру приликом штампања.
- 💾 **Локално чување података:** Сви подаци о ученицима и параметри калибрације штампе се безбедно чувају унутар прегледача (`localStorage`).
- 🔄 **Импорт / Експорт:** Могућност преузимања целокупне базе ученика у `.json` формату ради бекапа или преноса на други рачунар.

---

## 🇬🇧 About the Project (О пројекту)

**Student Registry (Matična Knjiga)** is a modern web application designed for high schools, facilitating digital student record-keeping and precise printing of data directly onto official A3 registry forms.

The application allows users to input or import student data, keep track of grades across all four years of education, and automatically align and print this data onto pre-printed physical paper forms using an advanced print calibration system.

### Key Features:
- 📊 **Comprehensive Records:** Storage of personal info, enrollment data, academic success, behavior, and graduation exams for all 4 years.
- 🔌 **eDnevnik Integration:** A built-in JavaScript scraper (`ednevnik_scraper.js`) that automatically extracts student and grade data directly from the national electronic grading system (eDnevnik) and prepares it for seamless import.
- 🖨️ **Pixel-Perfect Print Calibration:** An interactive drag-and-drop interface over a digital replica of the A3 form, allowing users to manually align text fields to perfectly match the layout of the physical paper when printing.
- 💾 **Local Data Persistence:** All student records and calibration coordinates are safely stored directly within the browser's `localStorage`.
- 🔄 **Import / Export:** Ability to download the entire student database as a `.json` file for backup purposes or transfer to another computer.

---

## 🛠️ Технологије / Technologies

- **Frontend:** React, TypeScript, Vite
- **Styling:** Custom CSS (Tailwind-inspired utility classes), CSS Variables for design tokens
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Data Persistence:** Browser `localStorage`

## 🚀 Покретање пројекта / Getting Started

### Инсталација (Installation)
1. Клонирајте репозиторијум (Clone the repository):
   ```bash
   git clone https://github.com/bciric1/MaticneKnjige.git
   ```
2. Уђите у фолдер пројекта (Enter the project directory):
   ```bash
   cd MaticneKnjige
   ```
3. Инсталирајте зависности (Install dependencies):
   ```bash
   npm install
   ```

### Покретање (Development Server)
Покрените локални сервер:
```bash
npm run dev
```
Апликација ће бити доступна на `http://localhost:5173`.

### Билдовање (Production Build)
За креирање продукционе верзије:
```bash
npm run build
```

## 📜 Скрипта за еДневник / eDnevnik Scraper
У оквиру пројекта се налази `ednevnik_scraper.js` скрипта. Користи се тако што се њен код прекопира у Конзолу прегледача (или се направи Bookmarklet) док сте на страници еДневника. Скрипта прикупља податке, генерише JSON и омогућава лако убацивање комплетног одељења у апликацију.

---
*Креирано за потребе ефикасније администрације у средњим школама.*
*Created for more efficient high school administration.*


autor Bojan Ciric 