---
title: "How we implemented link-sharing using Dub.co"
publishedAt: "2024-04-04"
summary: "We have some features like Time Tracker, Reports and files from Vault that our users shares outside their company and with that we have an authorization layer on our side using Supabase, but these links are often really long because they include a unique token."
image: "/images/dub.png"
tag: "Engineering"
---

Earlier this week [Dub.co](http://Dub.co) shared our [customer story](https://dub.co/customers/midday) on why we choose Dub as our link-sharing infrastructure.

<br />
In this blog post where gonna share a little more in details how we implemented this
functionality.

<br />
We have some features like Time Tracker, Reports and files from Vault that our users
shares outside their company and with that we have an authorization layer on our
side using Supabase, but these links are often really long because they include a
unique token.
<br />
Our solution was to implement Dub to generate unique short URLs.

<br />
### How we implemented sharing for our reports

<br />
![Midday - Overview](/images/overview.png)

<br />
If you look closely you can se our link looks like this: [https://go.midday.ai/5eYKrmV](https://go.midday.ai/5eYKrmV)

<br />
When the user clicks `Share` we execute a server action using the library `next-safe-action`

that looks like this:

```typescript
const createReport = useAction(createReportAction, {
  onError: () => {
    toast({
      duration: 2500,
      variant: "error",
      title: "Something went wrong pleaase try again.",
    });
  },
  onSuccess: (data) => {
    setOpen(false);

    const { id } = toast({
      title: "Report published",
      description: "Your report is ready to share.",
      variant: "success",
      footer: (
        <div className="mt-4 space-x-2 flex w-full">
          <CopyInput
            value={data.short_link}
            className="border-[#2C2C2C] w-full"
          />

          <Link href={data.short_link} onClick={() => dismiss(id)}>
            <Button>View</Button>
          </Link>
        </div>
      ),
    });
  },
});
```

<br />

The nice thing with next-safe-action is that you get callbacks on onError and onSuccess so in this case we show a toast based on the callback.

<br />

The action is pretty straightforward too, we first save the report based on the current parameters (from, to and type) depending on what kind of report we are creating.

<br />
We save it in Supabase and get a id back that we use to generate our sharable URL.

```typescript
const dub = new Dub({ projectSlug: "midday" });

export const createReportAction = action(schema, async (params) => {
  const supabase = createClient();
  const user = await getUser();

  const { data } = await supabase
    .from("reports")
    .insert({
      team_id: user.data.team_id,
      from: params.from,
      to: params.to,
      type: params.type,
      expire_at: params.expiresAt,
    })
    .select("*")
    .single();

  const link = await dub.links.create({
    url: `${params.baseUrl}/report/${data.id}`,
    rewrite: true,
    expiresAt: params.expiresAt,
  });

  const { data: linkData } = await supabase
    .from("reports")
    .update({
      link_id: link.id,
      short_link: link.shortLink,
    })
    .eq("id", data.id)
    .select("*")
    .single();

  const logsnag = await setupLogSnag();

  logsnag.track({
    event: LogEvents.OverviewReport.name,
    icon: LogEvents.OverviewReport.icon,
    channel: LogEvents.OverviewReport.channel,
  });

  return linkData;
});
```

<br />
With the combination of server actions, Supabase and Dub we can create really beautiful
URLs with analytics on top.

<br />
You can find the source code for this in our repository [here](https://github.com/midday-ai/midday/tree/main/apps/dashboard/src/actions/report).
