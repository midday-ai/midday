import Template from "@/components/invoice/template";
import { getInvoiceQuery } from "@midday/supabase/queries";
import { createClient } from "@midday/supabase/server";

export default async function Page({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await getInvoiceQuery(supabase, params.id);

  return <Template invoice={data} />;
}
