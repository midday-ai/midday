import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";

export function ChangeAvatar() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </CardDescription>
      </CardHeader>
      {/* <CardContent>wef</CardContent> */}
      <CardFooter>Proin viverra sem quis arcu lacinia</CardFooter>
    </Card>
  );
}
