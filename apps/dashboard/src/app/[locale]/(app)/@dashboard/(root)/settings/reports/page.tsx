import { Button } from "@midday/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bank Accounts | Reports",
};

export default function Reports() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <div className="flex justify-between items-center pr-6">
          <CardHeader>
            <CardDescription className="flex items-center justify-center space-x-2">
              <Icons.Copy className="text-white" />
              <span>go.midday.ai/gmEF2f</span>
            </CardDescription>
          </CardHeader>

          <div className="flex items-center space-x-2">
            <div className="text-xs flex items-center space-x-2 bg-secondary py-1 px-2 rounded-md">
              <Icons.Click />
              <span>3 Clicks</span>
            </div>

            <div>
              <Icons.MoreVertical />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center pr-6">
          <CardHeader>
            <CardDescription className="flex items-center justify-center space-x-2">
              <Icons.Copy className="text-white" />
              <span>go.midday.ai/kf3r32</span>
            </CardDescription>
          </CardHeader>

          <div className="flex items-center space-x-2">
            <div className="text-xs flex items-center space-x-2 bg-secondary py-1 px-2 rounded-md">
              <Icons.Click />
              <span>6 Clicks</span>
            </div>

            <div>
              <Icons.MoreVertical />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex justify-between items-center pr-6">
          <CardHeader>
            <CardDescription className="flex items-center justify-center space-x-2">
              <Icons.Copy className="text-white" />
              <span>go.midday.ai/sGA8u8f</span>
            </CardDescription>
          </CardHeader>

          <div className="flex items-center space-x-2">
            <div className="text-xs flex items-center space-x-2 bg-secondary py-1 px-2 rounded-md">
              <Icons.Click />
              <span>1 Clicks</span>
            </div>

            <div>
              <Icons.MoreVertical />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
