import { expect, test } from "bun:test";
import { csvTransformed } from ".";
import { parseCsv } from "./utils";

const csvComma = `Bokförd,Valutadatum,Text,Typ,Insättningar/uttag,Bokfört saldo
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

const csvColon = `"Kontonummer";"Kontonamn";"";"Saldo";"Tillgängligt belopp"
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

const csvColo2 = `Datum;Kategori;Underkategori;Text;Belopp;Saldo;Status;Avst�mt
2024-03-10;;;Okq8;-93,00;;V�ntar;Nej
2024-03-10;;;Non Solo Bar P;-220,50;;V�ntar;Nej
2024-03-10;;;Max Burgers 2010140_ki;-134,00;;V�ntar;Nej
2024-03-10;;;Cherry 2 21400;-400,00;;V�ntar;Nej
2024-03-10;;;Cherry 2 21400;-400,00;;V�ntar;Nej
2024-03-10;;;Cherry 2 21400;-400,00;;V�ntar;Nej
2024-03-10;;;Ballbreaker;-676,00;;V�ntar;Nej
2024-03-10;;;Okq8;-74,00;;V�ntar;Nej
2024-03-10;;;Circle K Linkoping Mal;-81,00;;V�ntar;Nej
2024-03-10;;;La Kantarell;-145,00;;V�ntar;Nej
2024-03-10;�vriga inkomster;Konto�verf�ringar;Swish fr�n Gustav Karl Valdemar Alsteryd;1�200,00;12�605,18;Utf�rd;Nej
2024-03-10;�vriga utgifter;�vriga konto�verf�ringar;Swish till Christoffer Collin;-1�325,00;11�405,18;Utf�rd;Nej
2024-03-09;�vriga utgifter;�vriga konto�verf�ringar;Swish till CARL OHLSSON;-110,00;12�730,18;Utf�rd;Nej
2024-03-09;�vriga utgifter;�vriga konto�verf�ringar;Swish till EASYPARK AB;-78,78;12�840,18;Utf�rd;Nej
2024-03-08;Mat & dryck;Livsmedelsaff�r;Shifudo Sverige Ab   ))));-144,00;12�918,96;Utf�rd;Nej
2024-03-08;N�je & fritid;Kaf� & restaurang;Q                    ))));-90,00;13�062,96;Utf�rd;Nej
2024-03-08;Boende;�vrigt;Mimosa Blommor       ))));-345,00;13�152,96;Utf�rd;Nej
2024-03-07;N�je & fritid;Kaf� & restaurang;Shish Kebab          ))));-100,00;13�497,96;Utf�rd;Nej
2024-03-07;Mat & dryck;Livsmedelsaff�r;Hemkop Linkoping Vas ))));-92,95;13�597,96;Utf�rd;Nej
2024-03-07;N�je & fritid;Bio, konsert & teater;Filmstaden Link      ))));-109,00;13�690,91;Utf�rd;Nej
2024-03-07;�vriga utgifter;Kabel-TV;Disney Plus;-119,00;13�799,91;Utf�rd;Nej
2024-03-07;�vriga utgifter;Fackf�rening;Unionen;-235,00;13�918,91;Utf�rd;Nej
2024-03-06;Mat & dryck;Livsmedelsaff�r;Hemkop Linkoping Vas ))));-273,60;14�153,91;Utf�rd;Nej`;

test("Parse from comma delimiter", () => {
  expect(parseCsv(csvComma)).toMatchSnapshot();
});

test("Parse from colon delimiter", () => {
  expect(parseCsv(csvColon)).toMatchSnapshot();
});

test("Transform transactions", () => {
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
      raw: csvComma,
    })
  ).toMatchSnapshot();
});

test("Transform transactions", () => {
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
      raw: csvColon,
    })
  ).toMatchSnapshot();
});

test("Transform transactions", () => {
  expect(
    csvTransformed({
      teamId: "123",
      extracted: [
        { date: "2024-03-10", description: "Cherry 2 21400", amount: -400 },
        { date: "2024-03-10", description: "Ballbreaker", amount: -676 },
        { date: "2024-03-10", description: "Okq8", amount: -74 },
        {
          date: "2024-03-10",
          description: "Circle K Linkoping Mal",
          amount: -81,
        },
        { date: "2024-03-10", description: "La Kantarell", amount: -145 },
        {
          date: "2024-03-10",
          description: "Swish från Gustav Karl Valdemar Alsteryd",
          amount: 1200,
        },
        {
          date: "2024-03-10",
          description: "Swish till Christoffer Collin",
          amount: -1325,
        },
        {
          date: "2024-03-09",
          description: "Swish till CARL OHLSSON",
          amount: -110,
        },
        {
          date: "2024-03-09",
          description: "Swish till EASYPARK AB",
          amount: -78,
        },
        {
          date: "2024-03-08",
          description: "Shifudo Sverige Ab",
          amount: -144,
        },
        { date: "2024-03-08", description: "Q", amount: -90 },
        { date: "2024-03-08", description: "Mimosa Blommor", amount: -345 },
        { date: "2024-03-07", description: "Shish Kebab", amount: -100 },
        {
          date: "2024-03-07",
          description: "Hemkop Linkoping Vas",
          amount: -92,
        },
        { date: "2024-03-07", description: "Nöje & fritid; Bio", amount: 0 },
      ],
      raw: csvColo2,
    })
  ).toMatchSnapshot();
});
