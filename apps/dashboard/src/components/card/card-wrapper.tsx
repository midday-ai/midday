"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@midday/ui/card";
import { HTMLAttributes, ReactNode } from "react";

interface CardWrapperProps extends HTMLAttributes<HTMLDivElement> {
    title: string;
    titleDescription?: string;
    description: string;
    subtitle?: string;
    subtitleDescription?: string;
    headerContent?: ReactNode;
    footerContent?: ReactNode;
}

const CardWrapper = ({ 
    title, 
    titleDescription,
    description, 
    subtitle,
    subtitleDescription, 
    headerContent, 
    footerContent,
    children, 
    ...props 
}: CardWrapperProps) => {
    return (
        <Card {...props}>
            <CardHeader className="p-[2%]">
                <CardTitle className="md:text-3xl text-xl">
                    {title}
                    {titleDescription && <span className="text-sm text-muted-foreground ml-2">{titleDescription}</span>}
                </CardTitle>
                <CardDescription className="text-sm md:text-lg">{description}</CardDescription>
                {headerContent}
            </CardHeader>
            <CardContent>
                {children}
            </CardContent>
            {(subtitle || subtitleDescription || footerContent) && (
                <CardFooter className="flex flex-col items-start p-[2%]">
                    {subtitle && <p className="font-semibold md:text-lg text-sm">{subtitle}</p>}
                    {subtitleDescription && <p className="text-sm text-muted-foreground md:text-lg">{subtitleDescription}</p>}
                    {footerContent}
                </CardFooter>
            )}
        </Card>
    )
}

export default CardWrapper;