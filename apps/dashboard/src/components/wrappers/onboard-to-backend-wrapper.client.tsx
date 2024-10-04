"use client";

import React, { useState } from "react";
import { OnboardToBackendModal } from "../modals/onboard-to-backend-modal";

interface OnboardToBackendClientWrapperProps {
    children: React.ReactNode;
    open: boolean;
}

function OnboardToBackendClientWrapper({ children, open }: OnboardToBackendClientWrapperProps) {
    const [isOpen, setOpen] = useState(open);

    return (
        <>
            {children}
            <OnboardToBackendModal defaultOpen={open} open={isOpen} setOpen={setOpen} />
        </>
    );
}

export default OnboardToBackendClientWrapper;