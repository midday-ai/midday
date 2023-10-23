import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@midday/ui/accordion";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { Label } from "@midday/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@midday/ui/select";

export function TransactionDetails() {
  return (
    <div className="border h-full w-full p-6">
      <div className="sticky top-12">
        <div className="flex justify-between mb-4">
          <div>
            <span className="text-[#606060] text-xs">Mar 2, 2023</span>
            <h2 className="mt-4 mb-3">Lemsqzy Screenstudio</h2>
            <div className="flex flex-col">
              <span className="text-4xl">€ 299.50</span>
              <span className="text-[#606060]">vat. € 49.50</span>
            </div>
          </div>

          <Button variant="ghost" size="icon" className="p-0 m-0 w-4 h-4">
            <Icons.Close className="w-4 h-4" />
          </Button>
        </div>

        <Accordion type="multiple" defaultValue={["attachment", "general"]}>
          <AccordionItem value="general">
            <AccordionTrigger>General</AccordionTrigger>
            <AccordionContent>
              <p className="text-[#606060]">
                Fusce id lobortis elit. Sed tincidunt efficitur elit, nec
                molestie justo imperdiet quis.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="grid gap-2 w-full">
                  <Label htmlFor="assign">Assign</Label>
                  <Select defaultValue="1">
                    <SelectTrigger
                      id="assign"
                      className="line-clamp-1 truncate"
                    >
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Pontus Abrahamsson</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2 w-full">
                  <Label htmlFor="tax">Tax Rate</Label>
                  <Select>
                    <SelectTrigger id="tax" className="line-clamp-1 truncate">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">25%</SelectItem>
                      <SelectItem value="2">12%</SelectItem>
                      <SelectItem value="3">7%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="attachment">
            <AccordionTrigger>Attachment</AccordionTrigger>
            <AccordionContent>
              <div className="w-full h-[120px] border-dotted border-2 border-border rounded-xl text-center flex flex-col justify-center space-y-1">
                <p className="text-xs">
                  Drop your files here, or{" "}
                  <span className="underline underline-offset-1">
                    click to browse.
                  </span>
                </p>
                <p className="text-xs text-dark-gray">3MB file limit.</p>
              </div>

              <ul className="mt-4">
                <li className="flex items-center space-x-4">
                  <img
                    className="rounded-md"
                    alt=""
                    src="https://sfimednikka.files.wordpress.com/2014/10/skc3a4rmavbild-2014-10-23-kl-09-54-01.png"
                    width={40}
                    height={40}
                  />
                  <span>receipt.jpeg</span>
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="note">
            <AccordionTrigger>Note</AccordionTrigger>
            <AccordionContent>Note</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
