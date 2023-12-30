"use client";

import { Button } from "@midday/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@midday/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";

export function TeamMembers({ name }) {
  return (
    <Tabs defaultValue="members">
      <TabsList className="bg-transparent border-b-[1px] w-full justify-start rounded-none mb-6">
        <TabsTrigger value="members" className="p-0 m-0 mr-4">
          Members
        </TabsTrigger>
        <TabsTrigger value="invites" className="p-0 m-0">
          Invites
        </TabsTrigger>
      </TabsList>

      <Card>
        <TabsContent value="members">
          <CardContent>members</CardContent>
        </TabsContent>

        <TabsContent value="invites">
          <CardContent>invites</CardContent>
        </TabsContent>
      </Card>
    </Tabs>
  );
}
