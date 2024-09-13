import { SiteFooter as Footer } from "@/components/footer/footer";
import { Header } from "@/components/header/header";
import { cn } from "@midday/ui/cn";

export default function Layout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <Header />
            <main className='mx-auto flex-1 overflow-hidden'>{children}</main>
            <Footer />
        </>
    );
}
