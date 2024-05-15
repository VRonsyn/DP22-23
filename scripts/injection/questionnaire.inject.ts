import {
  ChildAnimationAmount,
  ChildColor,
  Prisma,
  PrismaClient,
  SurveyType,
} from "@prisma/client";
import validator from "validator";
import isLocale = validator.isLocale;
import { SurveySettingTracker } from "../../src/types/express/profile";

const prisma = new PrismaClient();

async function createAnswers(
  questionId: string,
  answers: Omit<
    Prisma.AnswerOptionUncheckedCreateInput,
    "questionId" | "referenceNumber"
  >[]
) {
  for (const refNum in answers) {
    await prisma.answerOption.create({
      data: {
        questionId: questionId,
        ...answers[refNum],
        referenceNumber: Number(refNum),
      },
    });
  }
}

async function createYesNoOnQuestion(
  questionId: string,
  partialSettingsYes: object = {},
  partialSettingsNo: object = {}
): Promise<void> {
  await createAnswers(questionId, [
    {
      answer: "Ja",
      partialSettings: partialSettingsYes,
    },
    {
      answer: "Nee",
      partialSettings: partialSettingsNo,
    },
  ]);
}

export async function questionnaireInject() {
  const surveyName = "Survey V0";

  if (await prisma.survey.findUnique({ where: { name: surveyName } })) {
    // eslint-disable-next-line no-console
    console.warn("Could not initialize since survey is already present");
    return;
  }
  const language = "nl";
  if (!isLocale(language)) {
    // eslint-disable-next-line no-console
    console.warn("Language to inject is not valid");
    return;
  }

  await prisma.survey.create({
    data: {
      name: surveyName,
      surveyType: SurveyType.QUESTIONNAIRE,
      language,
    },
  });

  const question1 = await prisma.question.create({
    data: {
      surveyName,
      title:
        "Is er sprake van opvallende aandacht, fascinatie of angst voor bepaalde kleuren?",
      description: [
        "Raakt sterk geboeid door specifieke kleuren in voorwerpen of ruimtes.",
        "Is gefascineerd of obsessief begaan met specifieke kleur in voorwerpen of afbeeldingen.",
      ],
      referenceNumber: 1,
    },
  });
  await createAnswers(question1.id, [
    {
      answer: "Wit",
      options: {
        color: "white",
      },
      partialSettings: {},
    },
    {
      answer: "Rood",
      options: {
        color: "red",
      },
      partialSettings: {
        [SurveySettingTracker.colorFright]: ChildColor.RED,
      },
    },
    {
      answer: "Groen",
      options: {
        color: "green",
      },
      partialSettings: {
        [SurveySettingTracker.colorFright]: ChildColor.GREEN,
      },
    },
    {
      answer: "Blauw",
      options: {
        color: "blue",
      },
      partialSettings: {
        [SurveySettingTracker.colorFright]: ChildColor.BLUE,
      },
    },
    {
      answer: "Geel",
      options: {
        color: "yellow",
      },
      partialSettings: {
        [SurveySettingTracker.colorFright]: ChildColor.YELLOW,
      },
    },
    {
      answer: "Oranje",
      options: {
        color: "orange",
      },
      partialSettings: {
        [SurveySettingTracker.colorFright]: ChildColor.ORANGE,
      },
    },
    {
      answer: "Paars",
      options: {
        color: "purple",
      },
      partialSettings: {
        [SurveySettingTracker.colorFright]: ChildColor.PURPLE,
      },
    },
    {
      answer: "Nee",
      partialSettings: {},
    },
  ]);

  const question2 = await prisma.question.create({
    data: {
      surveyName,
      title:
        "Is er sprake van opvallende aandacht, fascinatie of angst voor bepaalde vormen?",
      description: [
        "Raakt sterk geboeid door specifieke vormen in voorwerpen of ruimtes.",
        "Is gefascineerd of obsessief begaan met specifieke vormeigenschappen in voorwerpen of afbeeldingen.",
      ],
      referenceNumber: 2,
    },
  });
  await createAnswers(question2.id, [
    {
      answer: "Vierkant",
      partialSettings: {},
    },
    {
      answer: "Rechthoek",
      partialSettings: {},
    },
    {
      answer: "Cirkelvormig",
      partialSettings: {},
    },
    {
      answer: "Nee",
      partialSettings: {},
    },
  ]);

  const question3 = await prisma.question.create({
    data: {
      surveyName,
      title:
        "Is er sprake van opvallende aandacht, fascinatie of angst voor details?",
      description: [
        "Aandacht gaat vooral naar erg kleine dingen; raapt kleinste stofjes op, kruimels, papiertjes.",
        "Kijkt opvallend of éérst naar onderdelen en details van voorwerpen of omgeving; lijkt daarbij het totaalconcept dan (nog) niet te zien.",
        "Focust alleen nog maar op visuele details bijv. kijkt in drukke visuele omgeving alleen maar naar een punt/detail in de ruimte.",
      ],
      referenceNumber: 3,
    },
  });
  await createYesNoOnQuestion(question3.id);

  const question4 = await prisma.question.create({
    data: {
      surveyName,
      title:
        "Is er sprake van opvallende aandacht, fascinatie of angst voor draaiende bewegingen of bewegende vormen?",
      description: [
        "Kijkt opvallend graag naar bewegende voorwerpen (bijv. draaien, schommelen …) en/of manipuleert ze tot dit soort bewegen.",
        "Tekent of construeert vaak dezelfde voorspelbare of stereotype vormen en/of kleuren.",
        "Is gefascineerd door specifiek bewegende of draaiende voorwerpen en is hier moeilijk van weg te houden.",
      ],
      referenceNumber: 4,
    },
  });
  await createYesNoOnQuestion(
    question4.id,
    {
      animationAmount: ChildAnimationAmount.NONE,
    },
    {
      animationAmount: ChildAnimationAmount.ALL,
    }
  );

  const question5 = await prisma.question.create({
    data: {
      surveyName,
      title:
        "Is er sprake van het systematisch ontwijken van visuele prikkels? Zou het gebruik van donkere kleuren een oplossing zijn?",
      description: [
        "Is opvallend angstig voor lichtflitsen zoals fotoflash, vuurpijlen, bliksem...",
        "Verblijft opvallend graag in donkere ruimtes.",
        "Zoekt kleine ruimtes op met zo min mogelijk visuele prikkels (bijv. zit liefst in hoek van ruimte en/of met gezicht naar muur, in speelhuisje, grote doos, wc-ruimte …).",
        "Manipuleert voorwerpen dicht bij oog (bijv. draadje, papiertje …) en bekijkt van daaruit omgeving.",
      ],
      referenceNumber: 5,
    },
  });
  await createAnswers(question5.id, [
    {
      answer: "Ja, gebruik van donkere kleuren zou een oplossing zijn.",
      partialSettings: {
        [SurveySettingTracker.preferDark]: true,
      },
    },
    {
      answer: "Ja, gebruik van donkere kleuren zou geen oplossing zijn.",
      partialSettings: {},
    },
    {
      answer: "Nee",
      partialSettings: {},
    },
  ]);

  const question6 = await prisma.question.create({
    data: {
      surveyName,
      title:
        "Is er sprake van opvallende aandacht, fascinatie of angst voor repetitieve geluiden?",
      description: [
        "Heeft opvallend sterke voorkeur voor bepaalde liedjes, muziekjes …, kent of onthoudt ze merkwaardig goed.",
        "Vindt (onbelangrijke) functiegeluiden aan gebruiksvoorwerpen opvallend interessant (bijv. knipgeluid, klikgeluid, stuitergeluid …), geniet hier méér van dan van de eigenlijke voorwerpfunctie.",
        "Wordt erg ‘boos’ wanneer men belet om bepaalde ‘favoriete omgevingsgeluiden’ te gaan opzoeken, of wanneer men ze stopt of stilzet (bijv. stofzuiger, favoriete muziekje …).",
        "Dwingt altijd dezelfde muziekjes of liedjes af, weigert aanbod van nieuwe of wordt dan boos.",
        "Stopt totaal met functioneren (valt uit of ‘bevriest’ ...) bij optreden van bepaalde geluiden … tot deze eventueel weg zijn.",
        "Probeert bepaalde geluiden te stoppen (bijv. pakt geluidmakend voorwerp af, schakelt toestel uit, legt hand op een mond, discussieert over verwijderen …).",
      ],
      referenceNumber: 6,
    },
  });
  await createYesNoOnQuestion(question6.id);

  const question7 = await prisma.question.create({
    data: {
      surveyName,
      title:
        "Is er sprake van opvallende aandacht, fascinatie of angst voor menselijke stemmen?",
      description: [
        "Gaat zelf ‘hard’ praten, roepen of gillen bij het horen praten of roepen van anderen. Neuriet opvallend en/of praat hinderend luidop in zichzelf.",
        "Stopt totaal met functioneren (valt uit of ‘bevriest’ ...) bij optreden van bepaalde stemmen … tot deze eventueel weg zijn.",
        "Speelt filmpjes waarin bepaalde personen babbelen telkens opnieuw af.",
      ],
      referenceNumber: 7,
    },
  });
  await createYesNoOnQuestion(question7.id);

  const question8 = await prisma.question.create({
    data: {
      surveyName,
      title:
        "Is er sprake van opvallende aandacht, fascinatie of angst voor trillingen van gsm?",
      description: ["Geen voorbeelden beschikbaar"],
      referenceNumber: 8,
    },
  });
  await createYesNoOnQuestion(question8.id);
}

questionnaireInject()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    // eslint-disable-next-line no-process-exit,@typescript-eslint/no-magic-numbers
    process.exit(1);
  });
