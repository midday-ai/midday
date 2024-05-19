import { expect, test } from "bun:test";
import { csvTransformed } from ".";
import { parseCsv } from "./utils";

const csv1 = `Bokförd,Valutadatum,Text,Typ,Insättningar/uttag,Bokfört saldo
2024-03-08,2024-03-08,ELLEVIO AB (PUBL),Betalning (bg/pg),-168.00,1942493.52
2024-03-08,2024-03-08,ELLEVIO AB (PUBL),Betalning (bg/pg),-165.00,1942661.52
2024-03-06,2024-03-06,BANKTJÄNSTER,Annan,-136.00,1942826.52
2024-03-04,2024-03-04,KOSTNAD,Annan,-31.85,1942962.52
2024-03-04,2024-03-04,H04510236587,Internationell betalning,230400.00,1942994.37
2024-03-04,2024-03-03,AWS AMAZON C/24-03-02,Kortköp,-2797.17,1712594.37
2024-03-04,2024-03-02,GOOGLE  YOUT/24-03-01,Kortköp,-119.00,1715391.54
2024-03-04,2024-03-02,DUBLIN      /24-03-01,Kortköp,-119.40,1715510.54
2024-03-04,2024-03-02,DUBLIN      /24-03-01,Kortköp,-179.11,1715629.94
2024-03-04,2024-03-02,GSUITE WDLIN/24-03-01,Kortköp,-29.00,1715809.05
2024-03-04,2024-03-02,GOOGLE CLOUD/24-03-01,Kortköp,-39.85,1715838.05
2024-03-01,2024-03-01,AMSTERDAM   /24-03-01,Kortköp,-153.10,1715877.90`;

const csv2 = `"Kontonummer";"Kontonamn";"";"Saldo";"Tillgängligt belopp"
"90248745117";"Rörelsekonto";"";"195 460,31";"195 460,31"

"Bokföringsdatum";"Transaktionsdatum";"Transaktionstyp";"Meddelande";"Belopp"
"2024-03-08";"2024-03-08";"Kortköp";"APL*APPLE SEARCH ADS,800-275-2273,US";"-387,27"
"2024-03-08";"2024-03-08";"Betalning";"SKATTEVERKET";"-44 134,00"
"2024-03-08";"2024-03-08";"Överföring";"TILL SKV";"44 134,00"
"2024-03-08";"2024-03-08";"Betalning";"hallon / Billogram";"-485,00"
"2024-03-07";"2024-03-06";"Kortköp";"WEBHALLENE";"-8 007,00"
"2024-03-07";"2024-03-07";"Utlandsbetalning";"ANK Utland Normal";"2 590,96"
"2024-03-06";"2024-03-06";"Överföring";"Skatt moms pwm";"-48 000,00"
"2024-03-06";"2024-03-06";"BG-insättning";"52762176";"137 500,00"
"2024-03-06";"2024-03-06";"Utlandsbetalning";"ANK Utland Normal";"1 923,95"
"2024-03-05";"2024-03-05";"Kortköp";"FIGMA MONTHLY RENEWAL,SAN FRANCISCO,US";"-316,17"
"2024-03-05";"2024-03-04";"Kortköp";"PAYPAL *APPERS GMBH,35314369001,AT";"-806,18"
"2024-03-02";"2024-03-01";"Kortköp";"GOOGLE*CLOUD 5NHT7Z,CC GOOGLE.COM,IE";"-1,22"
"2024-03-02";"2024-03-01";"Kortköp";"GSUITE,Dublin,IE";"-100,00"`;

test("Parse from comma delimiter", () => {
  expect(parseCsv(csv1)).toMatchSnapshot();
});

test("Parse from colon delimiter", () => {
  expect(parseCsv(csv2)).toMatchSnapshot();
});

test("Transform transaction example 1", () => {
  expect(
    csvTransformed({
      teamId: "123",
      extracted: [
        {
          date: "2024-03-03",
          description: "AWS AMAZON C/24-03-02",
          amount: -2797.17,
        },
        {
          date: "2024-03-02",
          description: "GOOGLE YOUT/24-03-01",
          amount: -119,
        },
        {
          date: "2024-03-04",
          description: "DUBLIN /24-03-01",
          amount: -119.4,
        },
        {
          date: "2024-03-02",
          description: "DUBLIN /24-03-01",
          amount: -179.11,
        },
        {
          date: "2024-03-02",
          description: "GSUITE WDLIN/24-03-01",
          amount: -29,
        },
        {
          date: "2024-03-02",
          description: "GOOGLE CLOUD/24-03-01",
          amount: -39.85,
        },
        {
          date: "2024-03-01",
          description: "AMSTERDAM /24-03-01",
          amount: -153.1,
        },
        {
          date: "2024-02-29",
          description: "TELE2 SV AB FÖRETAG ATTN",
          amount: -971,
        },
        {
          date: "2024-02-27",
          description: "SAN FRANCISC/24-02-26",
          amount: -42.47,
        },
        {
          date: "2024-02-27",
          description: "PARIS /24-02-26",
          amount: -1061.65,
        },
      ],
      raw: csv1,
    })
  ).toMatchSnapshot();
});

test("t", () => {
  expect(
    csvTransformed({
      teamId: "123",
      extracted: [
        { date: "2024-03-08", description: "Överföring", amount: 44134 },
        { date: "2024-03-08", description: "Betalning", amount: -485 },
        { date: "2024-03-07", description: "Kortköp", amount: -8007 },
        { date: "2024-03-06", description: "Överföring", amount: -48000 },
        { date: "2024-03-05", description: "Kortköp", amount: -316.17 },
        { date: "2024-03-05", description: "Kortköp", amount: -806.18 },
        { date: "2024-03-02", description: "Kortköp", amount: -1.22 },
        { date: "2024-03-02", description: "Kortköp", amount: -100 },
        {
          date: "2024-03-01",
          description: "APL*APPLE SEARCH ADS,800-275-2273,US",
          amount: -282.88,
        },
        { date: "2024-03-01", description: "Betalning", amount: -25000 },
        {
          date: "2024-03-01",
          description: "Avgift Utlandsbetalning",
          amount: -30,
        },
      ],
      raw: csv2,
    })
  ).toMatchSnapshot();
});
