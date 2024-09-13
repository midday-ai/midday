/* eslint-disable react/no-unescaped-entities */
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@midday/ui/accordion';
import { Activity, CheckSquare, FileText, Users } from 'lucide-react';
import React from 'react';

const BenefitItem: React.FC<{ icon: React.ElementType; text: string }> = ({ icon: Icon, text }) => (
    <div className="flex items-start space-x-3 mb-4">
        <Icon className="w-6 h-6 text-white flex-shrink-0 mt-1" />
        <p className="text-white">{text}</p>
    </div>
);

const BenefitsList = () => {
    const benefits = [
        {
            icon: FileText,
            text: "PDF Guide offering best practices for invoicing, expense tracking, cashflow, cost management, and more"
        },
        {
            icon: Activity,
            text: "Free in-depth Business Health Audit to outline financial leaks in your business operations"
        },
        {
            icon: CheckSquare,
            text: "Free personalized checklist based on your business's critical needs to ensure you're on track"
        },
        {
            icon: Users,
            text: "Free 1-on-1 consultation with our team"
        }
    ];

    return (
        <div className="max-w-2xl mx-auto my-8 p-6 text-white rounded-2xl shadow-md">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">For 1 Week, We'll Give You</h2>
            <Accordion type="single" collapsible className='mb-6 md:w-[500px]'>
                <AccordionItem value="item-1">
                    <AccordionTrigger>PDF Guide</AccordionTrigger>
                    <AccordionContent>
                        PDF Guide offering best practices for invoicing, expense tracking, cashflow, cost management, and more
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>Comprehensive Business Health Audit</AccordionTrigger>
                    <AccordionContent className='flex text-white justify-start items-start'>
                        Free in-depth Business Health Audit to outline financial leaks in your business operations
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>Personalized Business Checklist</AccordionTrigger>
                    <AccordionContent className='flex text-white justify-start items-start'>
                        Free personalized checklist based on your business's critical needs to ensure you're on track
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-4">
                    <AccordionTrigger>1-on-1 Consultation</AccordionTrigger>
                    <AccordionContent className='flex text-white justify-start items-start'>
                        Free 1-on-1 consultation with our team
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
};

export default BenefitsList;