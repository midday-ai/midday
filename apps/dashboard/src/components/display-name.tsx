import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Input } from "@midday/ui/input";

export function DisplayName() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Display name</CardTitle>
        <CardDescription>
          Please enter your full name, or a display name you are comfortable
          with.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Input className="max-w-[50%]" />
      </CardContent>

      <CardFooter className="flex justify-between">
        <div>Please use 32 characters at maximum.</div>

        <Button>Save</Button>
      </CardFooter>
    </Card>
  );
}
