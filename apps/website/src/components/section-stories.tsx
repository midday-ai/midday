"use client";

import { Avatar } from "@midday/ui/avatar";
import { AvatarImageNext } from "@midday/ui/avatar";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@midday/ui/dialog";
import { Icons } from "@midday/ui/icons";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { type Story, StoryCard } from "./story-card";

const ReactHlsPlayer = dynamic(() => import("react-hls-player"), {
  ssr: false,
});

const stories = [
  {
    id: 1,
    title: "“We are now saving 1-2 man-days each month.”",
    description:
      "Due to improved invoice reconciliation, we are now saving 1-2 man-days each month, and we have a better understanding of our finances thanks to dashboards.",
    name: "Paweł Michalski ",
    company: "VC leaders",
    country: "Poland",
    src: "/stories/pawel.jpeg",
    content: [
      {
        type: "heading",
        content:
          "VCLeaders is an educational platform for venture capitalists that helps them build better VC firms.  ",
      },
      {
        type: "question",
        content:
          "What specific challenges were you facing in managing your business operations before using Midday?",
      },
      {
        type: "paragraph",
        content:
          "We are a small, remote-first team. Each month, we face challenges when reconciling our invoices. We often struggle to track down missing invoices and ensure all payments are accounted for correctly. This manual process takes more than a full day of someone's time and can take even longer if we overlook anything. Not to mention, we didn’t have any time to categorize and analyze our spending properly.",
      },
      {
        type: "question",
        content:
          "How has Midday impacted your workflow or productivity since you started using it? Can you share specific examples or metrics?",
      },
      {
        type: "paragraph",
        content:
          "Due to improved invoice reconciliation, we are now saving 1-2 man-days each month, and we have a better understanding of our finances thanks to dashboards.",
      },
      {
        type: "question",
        content:
          "What features or aspects of Midday AI do you find most valuable, and why?",
      },
      {
        type: "paragraph",
        content:
          "This tool provides me with a clear overview of my finances, including accounts payable. The user interface is also clean, and the user experience is fantastic. Now, I can easily track all the invoices I receive and issue each month.",
      },
    ],
  },
  {
    id: 2,
    title:
      "“Without Midday I would’ve sold my company and lost loads of money”",
    name: "Guy Solan",
    company: "Thetis Medical",
    country: "United Kingdom",
    src: "/stories/guy.jpeg",
    video:
      "https://customer-oh6t55xltlgrfayh.cloudflarestream.com/5b86803383964d52ee6834fd289f4f4e/manifest/video.m3u8",
    content: [
      {
        type: "paragraph",
        content:
          "”Without Midday I would’ve sold my company and lost loads of money. I never had the time to learn Quickbooks or Xero so had no idea what the company cash was doing without ringing up my accountant.”",
      },
    ],
  },
  {
    id: 3,
    title: "“It has completely transformed how I manage my day-to-day tasks”",
    description:
      "From generating invoices to tracking projects and having all the information centralized in one place, the change has been remarkable.",
    name: "Facu Montanaro",
    company: "Kundo Studio",
    country: "Argentina",
    src: "/stories/facu.jpeg",
    content: [
      {
        type: "heading",
        content:
          "At Kundo, I work alongside a talented team to empower clients in achieving successful fundraising, launching impactful products, and driving growth through design and meaningful experiences.",
      },
      {
        type: "paragraph",
        content:
          "I’m Facu Montanaro, a freelance visual designer from Argentina, focused on crafting beautiful websites and interfaces. I collaborate with startups, founders, and companies to help them thrive.",
      },
      {
        type: "question",
        content:
          "What specific challenges were you facing in managing your business operations before using Midday?",
      },
      {
        type: "paragraph",
        content:
          "Above all, I struggled to find a way to manage everything in one place to make the workflow easier, faster, and simpler. At the same time, none of the tools I had tried seemed to address the core issue, which was finding a direct, straightforward, and user-friendly solution.",
      },
      {
        type: "question",
        content:
          "How has Midday impacted your workflow or productivity since you started using it? Can you share specific examples or metrics?",
      },
      {
        type: "paragraph",
        content:
          "I can’t share specific metrics yet, but it has completely transformed how I manage my day-to-day tasks. From generating invoices to tracking projects and having all the information centralized in one place, the change has been remarkable.",
      },
      {
        type: "question",
        content:
          "What features or aspects of Midday AI do you find most valuable, and why?",
      },
      {
        type: "paragraph",
        content:
          "Invoices, Proposals, and Track—these three features have been game-changers for me. They’ve significantly improved my daily operations. I’m looking forward to seeing some of the features I suggested implemented, like adding collaborators, but having Midday integrated into my workflow as one of my go-to apps has already been a great experience.",
      },
    ],
  },
  {
    id: 4,
    title:
      "“I prefer to have one tool for finances, similar to what Deel is for HR”",
    description:
      "Midday helped me find a compromise with my tax advisor: I'm not using one of his supported clunky tools but an actually UX-friendly tool and can provide him with acceptable .csv. That's a big one!",
    name: "Richard Poelderl",
    company: "Conduct.bln",
    country: "Germany",
    src: "/stories/richard.jpeg",
    content: [
      {
        type: "heading",
        content:
          "Businesses typically hire me because they want to focus their product development resources on the product rather than marketing. I can offer the growth/marketing with engineering as I understand both worlds",
      },
      {
        type: "question",
        content:
          "What specific challenges were you facing in managing your business operations before using Midday?",
      },
      {
        type: "paragraph",
        content:
          "My preferred accounting app (that let's me submit my tax reports) didn't support my bank. And the account app's data exports required additional formatting.",
      },
      {
        type: "paragraph",
        content:
          "Moreover, I moved from the invoicing feature of my business bank to Midday. Not really a big challenge, but Midday makes that just a bit easier (and I prefer to have one tool for finances, similar to what Deel is for HR).",
      },
      {
        type: "question",
        content:
          "How has Midday impacted your workflow or productivity since you started using it? Can you share specific examples or metrics?",
      },
      {
        type: "paragraph",
        content:
          "The invoice feature took a bit of work to setup as I used one of the earlier versions. But it's nice that it let's me edit almost any field (except for the number formats — I'm sure when you read this, that's included as well).",
      },
      {
        type: "paragraph",
        content:
          "Also, it helped me find a compromise with my tax advisor: I'm not using one of his supported clunky tools but an actually UX-friendly tool and can provide him with acceptable .csv formats so that he imports the data into his accounting software. That's a big one! It's not perfect for my tax advisor, but it makes my life much easier.",
      },
      {
        type: "question",
        content:
          "What features or aspects of Midday AI do you find most valuable, and why?",
      },
      {
        type: "paragraph",
        content:
          "Invoicing - to issue invoices for clients who can't pay 4+ figure sums with a credit card.",
      },
      {
        type: "paragraph",
        content: "CSV Exports - to share with tax advisor.",
      },
      {
        type: "paragraph",
        content:
          "Bank sync - to get an overview of my subscriptions for accounting.",
      },
    ],
  },
];

function Video({ src }: { src: string }) {
  const playerRef = useRef(undefined);
  const [isPlaying, setPlaying] = useState(false);

  const togglePlay = () => {
    if (isPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }

    setPlaying((prev) => !prev);
  };

  return (
    <div className="w-full h-[280px] relative">
      <ReactHlsPlayer
        src={src}
        onClick={togglePlay}
        autoPlay={false}
        poster="https://cdn.midday.ai/guy-cover.png"
        playerRef={playerRef}
        className="w-full"
      />

      {!isPlaying && (
        <div className="absolute bottom-4 left-4 space-x-4 items-center justify-center z-30 transition-all">
          <Button
            size="icon"
            type="button"
            className="rounded-full size-10 md:size-14 transition ease-in-out hover:scale-110 hover:bg-white bg-white"
            onClick={togglePlay}
          >
            <Icons.Play size={24} className="text-black" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function SectionStories() {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  return (
    <Dialog>
      <div className="relative mt-20 pb-20">
        <div className="w-full h-full flex items-center flex-col z-10 relative">
          <h2 className="text-[56px] text-center font-medium mt-12">
            What our users say
          </h2>
          <div className="flex mt-20 -space-x-4">
            {stories.map((story, index) => (
              <div
                key={story.id}
                className={`transform ${
                  index % 2 === 0 ? "rotate-3" : "-rotate-3"
                } ${
                  index % 2 === 0 ? "translate-y-3" : "-translate-y-3"
                } hover:z-10 hover:-translate-y-5 transition-all duration-300`}
              >
                <DialogTrigger asChild>
                  <div onClick={() => setSelectedStory(story)}>
                    <StoryCard {...story} />
                  </div>
                </DialogTrigger>
              </div>
            ))}
          </div>
        </div>

        <div className="dotted-bg w-[calc(100vw+1400px)] h-full absolute top-0 -left-[1200px] z-0" />
      </div>

      <DialogContent className="max-w-[550px] !p-6 pt-10 max-h-[calc(100vh-200px)] overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{selectedStory?.title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Avatar className="size-6">
              <AvatarImageNext
                src={selectedStory?.src ?? ""}
                width={24}
                height={24}
                alt={selectedStory?.name ?? ""}
              />
            </Avatar>
            <div>
              <p>{selectedStory?.name}</p>
              <div className="flex items-center gap-2 text-[#878787]">
                <p className="text-sm">{selectedStory?.company}</p>
                {selectedStory?.country && (
                  <>
                    •<p className="text-sm">{selectedStory?.country}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedStory?.video && <Video src={selectedStory?.video} />}

          {selectedStory?.content?.map((item, index) =>
            item.type === "heading" ? (
              <h2 key={index.toString()} className="text-2xl font-medium">
                {item.content}
              </h2>
            ) : (
              <div
                key={index.toString()}
                className={item.type === "question" ? "text-[#878787]" : ""}
              >
                {item.content}
              </div>
            ),
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
