/**
 * E-Invoice Test Script
 *
 * Tests the full e-invoice pipeline:
 * 1. Peppol ID validation
 * 2. Midday → DDD data transformation
 * 3. Payload validation
 * 4. DDD API connection
 * 5. Invoice creation (without Peppol delivery)
 *
 * Run with:
 *   export DDD_INVOICES_API_KEY=your_key_here
 *   bun run packages/e-invoice/src/test-send.ts
 */

import { createDDDClient } from "./client";
import {
  transformToDDDInvoice,
  validateForPeppol,
  validatePeppolId,
} from "./transform";
import type { DDDInvoice, MiddayInvoiceData } from "./types";

const DDD_API_URL =
  process.env.DDD_INVOICES_API_URL || "https://api.dddinvoices.com";

/**
 * Test 1: Validate Peppol ID formats
 */
function testPeppolIdValidation() {
  console.log("\n━━━ Step 1: Peppol ID Validation ━━━\n");

  const testCases = [
    { id: "0007:5561234567", expected: true, desc: "Swedish org (valid)" },
    { id: "0192:123456789", expected: true, desc: "Norwegian org (valid)" },
    { id: "9930:DE123456789", expected: true, desc: "German VAT (valid)" },
    { id: "0088:1234567890123", expected: true, desc: "GLN 13 digits (valid)" },
    { id: "invalid", expected: false, desc: "No colon (invalid)" },
    { id: "0007:123", expected: false, desc: "Swedish too short (invalid)" },
    { id: "abc:12345", expected: false, desc: "Non-numeric scheme (invalid)" },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const result = validatePeppolId(tc.id);
    const ok = result.valid === tc.expected;
    console.log(
      `  ${ok ? "✓" : "✗"} ${tc.desc}: ${tc.id} → ${result.valid ? "valid" : result.error}`,
    );
    if (ok) passed++;
  }

  console.log(`\n  Result: ${passed}/${testCases.length} tests passed`);
  return passed === testCases.length;
}

/**
 * Test 2: Transform Midday invoice to DDD format
 */
function testInvoiceTransformation() {
  console.log("\n━━━ Step 2: Invoice Data Transformation ━━━\n");

  // Real Midday invoice - sending to yourself for testing
  const MIDDAY_ORG_NUMBER = "5592597503";
  const MIDDAY_PEPPOL_ID = `0007:${MIDDAY_ORG_NUMBER}`;

  const middayInvoice: MiddayInvoiceData = {
    invoice: {
      id: "inv_test_001",
      invoiceNumber: `TEST-${Date.now()}`,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 1250, // Including VAT
      vat: 250,
      tax: null,
      currency: "SEK",
      note: "E-invoice test - Midday to Midday",
      lineItems: [
        {
          name: "E-Invoice Integration Test",
          quantity: 1,
          price: 1000,
          unit: "piece",
          taxRate: 25,
        },
      ],
    },
    customer: {
      // Sending TO Midday (yourself)
      name: "Midday AI AB",
      email: "pontus@midday.ai",
      countryCode: "SE",
      vatNumber: `SE${MIDDAY_ORG_NUMBER}01`,
      peppolId: MIDDAY_PEPPOL_ID,
      registrationNumber: MIDDAY_ORG_NUMBER,
      legalForm: "LegalEntity",
      addressLine1: "Test Address 1",
      addressLine2: null,
      city: "Stockholm",
      zip: "11122",
      country: "Sweden",
    },
    team: {
      // Sending FROM Midday (yourself)
      name: "Midday AI AB",
      countryCode: "SE",
      taxId: `SE${MIDDAY_ORG_NUMBER}01`,
      peppolId: MIDDAY_PEPPOL_ID,
      registrationNumber: MIDDAY_ORG_NUMBER,
      addressLine1: "Test Address 1",
      addressLine2: null,
      city: "Stockholm",
      zip: "11122",
    },
  };

  console.log("Input (Midday format):");
  console.log(`  Invoice: ${middayInvoice.invoice.invoiceNumber}`);
  console.log(`  Customer: ${middayInvoice.customer.name}`);
  console.log(`  Customer Peppol: ${middayInvoice.customer.peppolId}`);
  console.log(
    `  Amount: ${middayInvoice.invoice.amount} ${middayInvoice.invoice.currency}`,
  );
  console.log(`  VAT: ${middayInvoice.invoice.vat}`);
  console.log(`  Line items: ${middayInvoice.invoice.lineItems?.length || 0}`);

  // Validate for Peppol
  console.log("\nValidation:");
  const validation = validateForPeppol(middayInvoice);
  console.log(`  Valid: ${validation.valid ? "✓ Yes" : "✗ No"}`);
  if (validation.errors.length > 0) {
    console.log(`  Errors: ${validation.errors.join(", ")}`);
  }
  if (validation.warnings.length > 0) {
    console.log(`  Warnings: ${validation.warnings.join(", ")}`);
  }

  // Transform
  const dddInvoice = transformToDDDInvoice(middayInvoice);

  console.log("\nOutput (DDD format):");
  console.log(`  DocNumber: ${dddInvoice.DocNumber}`);
  console.log(`  BuyerName: ${dddInvoice.BuyerName}`);
  console.log(`  BuyerId (Peppol): ${dddInvoice.BuyerId}`);
  console.log(`  BuyerTypeCode: ${dddInvoice.BuyerTypeCode}`);
  console.log(`  DocTotalAmount: ${dddInvoice.DocTotalAmount}`);
  console.log(`  DocTotalVatAmount: ${dddInvoice.DocTotalVatAmount}`);
  console.log(`  DocCurrencyCode: ${dddInvoice.DocCurrencyCode}`);
  console.log(`  Items: ${dddInvoice._details.Items.length}`);

  // Show line item transformation
  console.log("\nLine items transformed:");
  for (const item of dddInvoice._details.Items) {
    console.log(
      `  - ${item.ItemName}: ${item.ItemQuantity} x ${item.ItemNetPrice} (${item.ItemUmcCode}) @ ${item.ItemVatRate}% VAT`,
    );
  }

  return { middayInvoice, dddInvoice, validation };
}

/**
 * Test 3: API Connection
 */
async function testApiConnection(apiKey: string) {
  console.log("\n━━━ Step 3: Test API Connection ━━━\n");

  const client = createDDDClient({ connectionKey: apiKey });

  try {
    console.log("Calling DDDI_GetNew to verify API credentials...");
    const response = await client.getNew({ complexity: "Full" });

    if (response.Status === "OK") {
      console.log("✓ API connection successful!");

      // Log fields that might be for seller/company info
      const invoice = (response as any).Result?.Invoice?.Invoice;
      if (invoice) {
        const allFields = Object.keys(invoice).sort();
        // Find fields related to seller/supplier/company
        const relevantFields = allFields.filter(
          (f) =>
            !f.startsWith("Buyer") &&
            !f.startsWith("Doc") &&
            !f.startsWith("_") &&
            !f.startsWith("Original") &&
            !f.startsWith("Operator") &&
            !f.startsWith("PDF"),
        );
        if (relevantFields.length > 0) {
          console.log("\n  Other DDD fields (possible seller info):");
          for (const field of relevantFields) {
            console.log(`    ${field}`);
          }
        }
      }

      return client;
    }
    console.error("✗ API error:", response.Reason || response.Code);
    return null;
  } catch (error) {
    console.error(
      "✗ Connection failed:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

async function testCreateInvoice(client: ReturnType<typeof createDDDClient>) {
  console.log("\n━━━ Step 4: Test Invoice Creation in DDD ━━━\n");

  // Helper to format date as ISO 8601 (DDD requires full timestamp)
  const formatDate = (date: Date) =>
    date.toISOString().replace(/\.\d{3}Z$/, "");
  const today = new Date();
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  // Real Midday data - sending to yourself for full Peppol test
  const MIDDAY_ORG = "5592597503";
  const MIDDAY_PEPPOL = `0007:${MIDDAY_ORG}`;

  const testInvoice: DDDInvoice = {
    // Buyer (customer) - Midday AI AB (yourself)
    BuyerLegalForm: "LegalEntity",
    BuyerTypeCode: "Domestic",
    BuyerCountryCode: "SE",
    BuyerTaxNum: `SE${MIDDAY_ORG}01`,
    BuyerName: "Midday AI AB",
    BuyerPostCode: "11453",
    BuyerStreet: "Grev Turegatan 11A",
    BuyerCity: "Stockholm",
    BuyerRegNum: MIDDAY_ORG,
    BuyerId: MIDDAY_PEPPOL, // Real Peppol ID!
    BuyerIsBudget: false,
    BuyerBudgetNum: null,

    // Document info
    DocNumber: `PEPPOL-TEST-${Date.now()}`,
    DocIssueDate: formatDate(today),
    DocDueDate: formatDate(dueDate),
    DocStartDate: formatDate(today),
    DocEndDate: formatDate(dueDate),
    DocTotalAmount: 1250, // Including VAT
    DocTotalVatAmount: 250,
    DocTotalVatAmountCC: 250,
    DocCurrencyCode: "SEK",
    DocExchangeRate: 1.0,
    DocAllowPercent: 0,
    DocSigner: null,
    DocNote: "Peppol e-invoice test - Midday to Midday",
    DocBuyerOrderRef: null,
    OriginalInvNumber: null,
    OriginalInvIssueDate: null,
    DocTypeCode: "INVOICE",
    DocSaleTypeCode: "Wholesale",
    DocPaymentTypeCode: "NONCASH",
    OperatorTAPRegistration: null,
    PDFOriginal: null,

    // Line items
    _details: {
      Items: [
        {
          ItemName: "E-Invoice Integration Test",
          ItemQuantity: 1,
          ItemUmcCode: "piece",
          ItemNetPrice: 1000,
          ItemRetailPrice: null,
          ItemAllowancePercent: 0,
          ItemVatRate: 25,
          ItemVatCode: "25",
          ItemExciseAmount: 0,
        },
      ],
      Payments: [
        {
          PayCode: "CREDITTRANSFER",
          PayNumber: null,
          PayAmount: 1250,
          PayPayeeAccountType: null,
          PayNetworkProvider: null,
          PayCardHolderOrReference: null,
          PayDocDate: null,
        },
      ],
    },
  };

  console.log("Invoice data (Midday → Midday):");
  console.log(`  Number: ${testInvoice.DocNumber}`);
  console.log(`  To: ${testInvoice.BuyerName}`);
  console.log(`  Peppol ID: ${testInvoice.BuyerId}`);
  console.log(
    `  Amount: ${testInvoice.DocTotalAmount} ${testInvoice.DocCurrencyCode}`,
  );

  try {
    // Save invoice WITHOUT Peppol steps - just create it in DDD system
    // Step 35 = Confirm and lock the invoice
    console.log(
      "\nSaving invoice to DDD Invoices (step 35 only - no Peppol)...",
    );

    const response = await client.save(testInvoice, {
      steps: [35], // Only confirm, don't send to Peppol
      complexity: "Minimal",
    });

    if (response.Status === "OK" && response.Result?.Status === "OK") {
      const result = response.Result.Result;
      console.log("\n✓ Invoice created successfully!");
      console.log(`  DDD Invoice ID: ${result?.Id}`);
      console.log(`  Status: ${response.Result.Status}`);
      return result?.Id;
    }
    console.error("✗ Failed to create invoice");
    console.error("  Status:", response.Result?.Status);
    console.error("  Reason:", response.Result?.Reason || response.Reason);
    return null;
  } catch (error) {
    console.error(
      "✗ Error creating invoice:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

async function testGenerateUBL(
  client: ReturnType<typeof createDDDClient>,
  invoiceId: string,
) {
  console.log("\n━━━ Step 5: Test UBL Generation ━━━\n");

  try {
    // Step 55 = Generate Peppol UBL XML
    console.log(`Generating UBL XML for invoice ${invoiceId}...`);

    const response = await client.executeSteps(invoiceId, [55], {
      returnDoc: ["XMLP"], // Return Peppol XML
    });

    if (response.Status === "OK" && response.Result?.Status === "OK") {
      console.log("✓ UBL XML generated successfully!");
      if (response.Result.ReturnDoc?.XMLP) {
        console.log(`  XML URL: ${response.Result.ReturnDoc.XMLP}`);
      }
      return true;
    }
    console.log("⚠ UBL generation failed");
    console.log("  Reason:", response.Result?.Reason || response.Reason);
    return false;
  } catch (error) {
    console.log("⚠ UBL generation failed");
    console.log("  ", error instanceof Error ? error.message : error);
    return false;
  }
}

async function testPeppolSend(
  client: ReturnType<typeof createDDDClient>,
  invoiceId: string,
) {
  console.log("\n━━━ Step 6: Test Peppol Network Delivery ━━━\n");

  try {
    // Step 80 = Send to Peppol network
    console.log(`Sending invoice ${invoiceId} to Peppol network...`);
    console.log("  Recipient: 0007:5592597503 (Midday AI AB)");

    const response = await client.executeSteps(invoiceId, [80], {
      returnDoc: ["XMLP"],
    });

    if (response.Status === "OK" && response.Result?.Status === "OK") {
      console.log("\n✓ Invoice sent via Peppol successfully!");
      if (response.Result.ReturnDoc?.XMLP) {
        console.log(`  Peppol XML: ${response.Result.ReturnDoc.XMLP}`);
      }
      return true;
    }
    console.log("⚠ Peppol delivery failed");
    console.log("  Reason:", response.Result?.Reason || response.Reason);
    return false;
  } catch (error) {
    console.log("⚠ Peppol delivery failed");
    console.log("  ", error instanceof Error ? error.message : error);
    return false;
  }
}

function showPeppolIdExamples() {
  console.log("\n━━━ Peppol ID Format Examples ━━━\n");
  console.log(
    "If you want to test with Peppol delivery, you need valid Peppol IDs:",
  );
  console.log("");
  console.log("  Sweden (org number):     0007:5561234567");
  console.log("  Norway (org number):     0192:123456789");
  console.log("  Germany (VAT):           9930:DE123456789");
  console.log("  Global (GLN):            0088:1234567890123");
  console.log("  Australia (ABN):         0151:12345678901");
  console.log("");
  console.log("To get a Peppol ID:");
  console.log("  1. Register with a Peppol Access Point provider");
  console.log("  2. Use your company's existing registration number");
  console.log("  3. Contact DDD Invoices for test/sandbox IDs");
}

async function main() {
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║   E-Invoice Pipeline Test                        ║");
  console.log("║   Tests: Validation → Transform → API → Create   ║");
  console.log("╚═══════════════════════════════════════════════════╝");

  // Step 1: Test Peppol ID validation
  const peppolValid = testPeppolIdValidation();

  // Step 2: Test Midday → DDD transformation
  const { dddInvoice, validation } = testInvoiceTransformation();

  // Check if API key is set for remaining tests
  const apiKey = process.env.DDD_INVOICES_API_KEY;

  if (!apiKey) {
    console.log("\n━━━ API Tests Skipped ━━━\n");
    console.log("DDD_INVOICES_API_KEY not set. To run API tests:");
    console.log("  export DDD_INVOICES_API_KEY=your_key_here");
    console.log("  bun run packages/e-invoice/src/test-send.ts");

    console.log("\n━━━ Summary ━━━\n");
    console.log(
      `  Peppol ID Validation: ${peppolValid ? "✓ Passed" : "✗ Failed"}`,
    );
    console.log(
      `  Data Transformation:  ${validation.valid ? "✓ Valid" : "✗ Invalid"}`,
    );
    console.log("  API Connection:       ⊘ Skipped (no API key)");
    console.log("  Invoice Creation:     ⊘ Skipped (no API key)");
    return;
  }

  console.log(`\nAPI URL: ${DDD_API_URL}`);
  console.log(
    `API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`,
  );

  // Step 3: Test API connection
  const client = await testApiConnection(apiKey);
  if (!client) {
    console.log("\n⚠ Fix API connection issues before continuing");
    return;
  }

  // Step 4: Create test invoice in DDD
  const invoiceId = await testCreateInvoice(client);

  // Step 5: Try UBL generation
  let ublGenerated = false;
  if (invoiceId) {
    ublGenerated = await testGenerateUBL(client, invoiceId);
  }

  // Step 6: Try Peppol delivery (real send to yourself!)
  let peppolSent = false;
  if (invoiceId && ublGenerated) {
    peppolSent = await testPeppolSend(client, invoiceId);
  }

  // Show Peppol ID info
  showPeppolIdExamples();

  console.log("\n━━━ Summary ━━━\n");
  console.log(
    `  Peppol ID Validation: ${peppolValid ? "✓ Passed" : "✗ Failed"}`,
  );
  console.log(
    `  Data Transformation:  ${validation.valid ? "✓ Valid" : "✗ Invalid"}`,
  );
  console.log("  API Connection:       ✓ Connected");
  console.log(
    `  Invoice Creation:     ${invoiceId ? "✓ Created" : "✗ Failed"}`,
  );
  console.log(
    `  UBL Generation:       ${ublGenerated ? "✓ Generated" : "⚠ Failed"}`,
  );
  console.log(
    `  Peppol Delivery:      ${peppolSent ? "✓ Sent to 0007:5592597503" : ublGenerated ? "⚠ Failed" : "⊘ Skipped"}`,
  );

  if (peppolSent) {
    console.log("\n🎉 E-Invoice sent via Peppol successfully!");
    console.log("  Check your Peppol inbox for the test invoice.");
  } else if (invoiceId) {
    console.log("\n✓ E-Invoice integration is working (API level)");
    console.log("  Peppol delivery may require additional setup.");
  }
}

main().catch(console.error);
