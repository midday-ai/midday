"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  MdOutlineExpandLess,
  MdOutlineExpandMore,
  MdOutlineMoreVert,
} from "react-icons/md";

interface Invoice {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  amount: string;
  status: "unpaid" | "overdue" | "paid";
}

const initialInvoices: Invoice[] = [
  {
    id: "1",
    invoiceNo: "INV-0042",
    date: "Mar 15",
    dueDate: "Apr 15",
    amount: "12 450,00 €",
    status: "unpaid",
  },
  {
    id: "2",
    invoiceNo: "INV-0038",
    date: "Feb 10",
    dueDate: "Mar 10",
    amount: "18 750,00 €",
    status: "overdue",
  },
  {
    id: "3",
    invoiceNo: "INV-0035",
    date: "Jan 20",
    dueDate: "Feb 20",
    amount: "22 300,00 €",
    status: "paid",
  },
  {
    id: "4",
    invoiceNo: "INV-0032",
    date: "Dec 15",
    dueDate: "Jan 15",
    amount: "15 600,00 €",
    status: "paid",
  },
  {
    id: "5",
    invoiceNo: "INV-0029",
    date: "Nov 20",
    dueDate: "Dec 20",
    amount: "19 800,00 €",
    status: "paid",
  },
  {
    id: "6",
    invoiceNo: "INV-0026",
    date: "Oct 25",
    dueDate: "Nov 25",
    amount: "14 200,00 €",
    status: "paid",
  },
];

export function CustomerStatementAnimation({
  onComplete,
  shouldPlay = true,
}: {
  onComplete?: () => void;
  shouldPlay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showHeader, setShowHeader] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const [showGeneral, setShowGeneral] = useState(false);
  const [_showDetails, _setShowDetails] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [invoices, _setInvoices] = useState<Invoice[]>(initialInvoices);

  useEffect(() => {
    if (!shouldPlay) return;

    const headerTimer = setTimeout(() => {
      setShowHeader(true);
      setShowLogo(true);
    }, 0);
    const generalTimer = setTimeout(() => setShowGeneral(true), 300);
    const statementTimer = setTimeout(() => setShowStatement(true), 600);
    const cardsTimer = setTimeout(() => setShowCards(true), 900);
    const tableTimer = setTimeout(() => setShowTable(true), 1200);

    const doneTimer = onComplete
      ? setTimeout(() => {
          onComplete();
        }, 10000)
      : undefined;

    return () => {
      clearTimeout(headerTimer);
      clearTimeout(generalTimer);
      clearTimeout(statementTimer);
      clearTimeout(cardsTimer);
      clearTimeout(tableTimer);
      if (doneTimer) clearTimeout(doneTimer);
    };
  }, [shouldPlay, onComplete]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "text-green-500";
      case "overdue":
        return "text-yellow-500";
      default:
        return "text-foreground";
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col relative bg-background min-h-0"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showHeader ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="pt-2 md:pt-3 pb-2 md:pb-3 border-b border-border flex items-center justify-between px-2 md:px-3"
      >
        <div className="flex items-center gap-2 md:gap-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showLogo ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            className="w-7 h-7 md:w-9 md:h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-foreground/5 border border-border overflow-hidden"
          >
            <Image
              src="/images/supabase.png"
              alt="Supabase"
              width={20}
              height={20}
              className="w-full h-full object-contain"
            />
          </motion.div>
          <h2 className="text-[16px] md:text-[18px] font-serif text-foreground">
            Supabase
          </h2>
        </div>
        <MdOutlineMoreVert
          className="text-sm text-muted-foreground"
          size={16}
        />
      </motion.div>

      {/* General Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showGeneral ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="border-b border-border md:mt-2"
      >
        <div className="pt-2 md:pt-3 pb-3 md:py-5 flex items-center justify-between px-2 md:px-3">
          <h3 className="text-[11px] md:text-[12px] text-foreground">
            General
          </h3>
          <MdOutlineExpandLess
            className="text-sm text-muted-foreground"
            size={16}
          />
        </div>
        {showGeneral && (
          <div className="pt-0 pb-3 md:pb-4 space-y-2.5 md:space-y-3 px-2 md:px-3">
            <div className="text-[10px] md:text-[11px] text-muted-foreground">
              <span className="text-foreground">Contact person:</span> Michael
              Thompson
            </div>
            <div className="text-[10px] md:text-[11px] text-muted-foreground">
              <span className="text-foreground">Email:</span>{" "}
              finance@supabase.com
            </div>
            <div className="text-[10px] md:text-[11px] text-muted-foreground">
              <span className="text-foreground">Website:</span> supabase.com
            </div>
          </div>
        )}
      </motion.div>

      {/* Details Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showGeneral ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="border-b border-border"
      >
        <div className="py-2.5 md:py-3.5 flex items-center justify-between px-2 md:px-3">
          <h3 className="text-[11px] md:text-[12px] text-foreground">
            Details
          </h3>
          <MdOutlineExpandMore
            className="text-sm text-muted-foreground"
            size={16}
          />
        </div>
      </motion.div>

      {/* Statement Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: showStatement ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className="flex-1 flex flex-col min-h-0 overflow-hidden"
      >
        <div className="py-2.5 md:py-3.5 flex items-center justify-between border-b border-border flex-shrink-0 px-2 md:px-3">
          <h3 className="text-[11px] md:text-[12px] text-foreground">
            Statement
          </h3>
          <MdOutlineMoreVert
            className="text-sm text-muted-foreground"
            size={16}
          />
        </div>

        {/* Summary Cards */}
        {showCards && (
          <div className="grid grid-cols-2 gap-3 md:gap-4 pt-4 md:pt-6 pb-4 md:pb-6 flex-shrink-0">
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-background border border-border p-3 md:p-4"
            >
              <div className="font-serif text-base md:text-lg text-foreground mb-1 md:mb-1.5">
                53 500,00 €
              </div>
              <div className="font-sans text-[10px] md:text-xs text-foreground mb-1 md:mb-1.5">
                Total Amount
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-background border border-border p-3 md:p-4"
            >
              <div className="font-serif text-base md:text-lg text-foreground mb-1 md:mb-1.5">
                22 300,00 €
              </div>
              <div className="font-sans text-[10px] md:text-xs text-foreground mb-1 md:mb-1.5">
                Paid
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="bg-background border border-border p-3 md:p-4"
            >
              <div className="font-serif text-base md:text-lg text-foreground mb-1 md:mb-1.5">
                31 200,00 €
              </div>
              <div className="font-sans text-[10px] md:text-xs text-foreground mb-1 md:mb-1.5">
                Outstanding
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="bg-background border border-border p-3 md:p-4"
            >
              <div className="font-serif text-base md:text-lg text-foreground mb-1 md:mb-1.5">
                3
              </div>
              <div className="font-sans text-[10px] md:text-xs text-foreground mb-1 md:mb-1.5">
                Invoices
              </div>
            </motion.div>
          </div>
        )}

        {/* Table */}
        {showTable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex-1 min-h-0 overflow-hidden border border-border bg-background relative"
          >
            <table
              className="w-full border-collapse"
              style={{ borderSpacing: 0 }}
            >
              <thead className="sticky top-0 z-10 bg-secondary border-b border-border">
                <tr className="h-[28px] md:h-[32px]">
                  <th className="w-[90px] md:w-[100px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                    Invoice
                  </th>
                  <th className="w-[70px] md:w-[80px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                    Date
                  </th>
                  <th className="w-[80px] md:w-[90px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                    Due Date
                  </th>
                  <th className="w-[100px] md:w-[110px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground border-r border-border">
                    Amount
                  </th>
                  <th className="w-[80px] md:w-[90px] px-1.5 md:px-2 text-left text-[10px] md:text-[11px] font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: showTable ? 1 : 0,
                      y: showTable ? 0 : 10,
                    }}
                    transition={{
                      duration: 0.3,
                      delay: 0.5 + index * 0.08,
                      ease: "easeOut",
                    }}
                    className="h-[28px] md:h-[32px] border-b border-border bg-background hover:bg-secondary transition-colors"
                  >
                    <td className="w-[90px] md:w-[100px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-foreground border-r border-border">
                      {invoice.invoiceNo}
                    </td>
                    <td className="w-[70px] md:w-[80px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-muted-foreground border-r border-border">
                      {invoice.date}
                    </td>
                    <td className="w-[80px] md:w-[90px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-muted-foreground border-r border-border">
                      {invoice.dueDate}
                    </td>
                    <td className="w-[100px] md:w-[110px] px-1.5 md:px-2 text-[10px] md:text-[11px] text-foreground border-r border-border">
                      {invoice.amount}
                    </td>
                    <td className="w-[80px] md:w-[90px] px-1.5 md:px-2">
                      <span
                        className={`text-[10px] md:text-[11px] ${getStatusColor(invoice.status)}`}
                      >
                        {invoice.status === "unpaid"
                          ? "Unpaid"
                          : invoice.status === "overdue"
                            ? "Overdue"
                            : "Paid"}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
