import { Button } from "@midday/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";

export function DisplayName() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Display name</CardTitle>
        <CardDescription>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </CardDescription>
      </CardHeader>
      {/* <CardContent>wef</CardContent> */}
      <CardFooter className="flex justify-between">
        <div>Proin viverra sem quis arcu lacinia</div>

        <Button>Save</Button>
      </CardFooter>
    </Card>
  );
}
