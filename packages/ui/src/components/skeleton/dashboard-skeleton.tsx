"use client";

import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import { Button } from "../button";
import { Card, CardContent, CardHeader } from "../card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../dropdown-menu";
import { Skeleton } from "../skeleton";

/**
 * v0 by Vercel.s
 * @see https://v0.dev/t/T9qXnZIlXN7
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="min-w-screen flex min-h-screen overflow-hidden">
      <aside className="flex w-72 flex-col border-r bg-gray-100 p-4 dark:bg-zinc-950">
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wider"></span>
          </div>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="flex flex-col space-y-1">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
          </nav>
        </div>
      </aside>
      <div className="flex w-full flex-col">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4 shadow-sm dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-wider"></span>
          </div>
          <nav className="ml-auto flex items-center gap-4">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-4 w-24 rounded" />
          </nav>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded-full" size="icon" variant="ghost">
                <Avatar>
                  <AvatarImage alt="Avatar" src="/placeholder-avatar.jpg" />
                  <AvatarFallback></AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="flex-1 overflow-auto p-4">
          <div className="mx-auto max-w-7xl">
            <Skeleton className="h-8 w-48 rounded" />
            <Skeleton className="mt-2 h-4 w-64 rounded" />
            <DashboardSkeletonBody />
            <DashboardSkeletonBody />
            <DashboardSkeletonBody />
            <DashboardSkeletonBody />
          </div>
        </main>
      </div>
    </div>
  );
};

const DashboardSkeletonBody: React.FC = () => {
  return (
    <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="mt-2 h-4 w-48 rounded" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="mt-2 h-4 w-48 rounded" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32 rounded" />
          <Skeleton className="mt-2 h-4 w-48 rounded" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-24 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
