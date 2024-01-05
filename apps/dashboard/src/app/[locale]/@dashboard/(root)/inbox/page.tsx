import { Inbox } from "@/components/inbox";
import { Metadata } from "next";

export const mails = [
  {
    id: "6c84fb90-12c4-11e1-840d-7b25c5ee775a",
    name: "Vercel Inc.",
    email: "invoice+statements@vercel.com",
    subject: "Your receipt from Vercel Inc. #2520-3908",
    text: "Receipt from Vercel Inc. $60.00 Paid January 2, 2024",
    date: "2024-01-02T09:00:00",
    status: "new",
    attachment_url:
      "https://service.midday.ai/storage/v1/object/sign/vault/dd6a039e-d071-423a-9a4d-9ba71325d890/Invoice-2996867F-0012.pdf?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJ2YXVsdC9kZDZhMDM5ZS1kMDcxLTQyM2EtOWE0ZC05YmE3MTMyNWQ4OTAvSW52b2ljZS0yOTk2ODY3Ri0wMDEyLnBkZiIsImlhdCI6MTcwNDQ3NDczMSwiZXhwIjoxNzA1MDc5NTMxfQ.PTTPtbq-ClOwKGUG25CcpCLYN87Hx5aelkUi4t_0e-A&t=2024-01-05T17%3A12%3A11.201Z",
    logo_url:
      "https://pbs.twimg.com/profile_images/1652878800311427073/j0-3owJd_400x400.jpg",
  },
  {
    id: "110e8400-e29b-11d4-a716-446655440000",
    name: "Supabase Pte Ltd",
    email: "alicesmith@example.com",
    subject: "Your receipt from Supabase Pte Ltd #2627-2457",
    text: "Receipt from Supabase Pte Ltd $49.51 Paid December 9, 2023",
    date: "2023-12-22T09:00:00",
    status: "completed",
    attachment_url:
      "https://service.midday.ai/storage/v1/object/sign/vault/dd6a039e-d071-423a-9a4d-9ba71325d890/Invoice-BEF74D04-0005.pdf?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJ2YXVsdC9kZDZhMDM5ZS1kMDcxLTQyM2EtOWE0ZC05YmE3MTMyNWQ4OTAvSW52b2ljZS1CRUY3NEQwNC0wMDA1LnBkZiIsImlhdCI6MTcwNDQ3NDcxMSwiZXhwIjoxNzA1MDc5NTExfQ.PP2aTVtVTXNoQ-_oLTE9aGx5tNjZlc6cig0KRvKyyyY&t=2024-01-05T17%3A11%3A51.169Z",
    logo_url:
      "https://pbs.twimg.com/profile_images/1737436487912718336/FGWDhP1X_400x400.jpg",
  },
  {
    id: "3e7c3f6d-bdf5-46ae-8d90-171300f27ae2",
    name: "Google Payments",
    email: "bobjohnson@example.com",
    subject: "Google Workspace: Din faktura är tillgänglig för lostisland.co",
    text: "Din månadsfaktura för Google Workspace är tillgänglig. PDF-dokumentet är bifogat längst ned i det här meddelandet.",
    date: "2023-12-20T09:00:00",
    status: "completed",
    logo_url:
      "https://pbs.twimg.com/profile_images/1605297940242669568/q8-vPggS_400x400.jpg",
  },
  {
    id: "61c35085-72d7-42b4-8d62-738f700d4b92",
    name: "Uber Receipts",
    email: "emilydavis@example.com",
    subject: "Your Wednesday evening trip with Uber",
    text: "Thanks for riding, Pontus We hope you enjoyed your ride this evening.",
    date: "2023-03-25T13:15:00",
    status: "in_progress",
  },
  {
    id: "8f7b5db9-d935-4e42-8e05-1f1d0a3dfb97",
    name: "GitHub",
    email: "michaelwilson@example.com",
    subject: "[GitHub] Payment Receipt",
    text: "We received payment for your GitHub.com subscription. Thanks for your business!",
    date: "2023-03-10T15:00:00",
  },
  {
    id: "1f0f2c02-e299-40de-9b1d-86ef9e42126b",
    name: "DigitalOcean Support",
    email: "sarahbrown@example.com",
    subject: "[DigitalOcean] Your 2023-11 invoice is available",
    text: "Your 2023-11 invoice is now available for team: My Team. The balance was automatically charged to your credit card, so you don't need to do anything. Happy Coding!",
    date: "2023-02-15T16:30:00",
  },
  {
    id: "17c0a96d-4415-42b1-8b4f-764efab57f66",
    name: "Amazon Web Services",
    email: "davidlee@example.com",
    subject: "Amazon Web Services Billing Statement Available",
    text: "Greetings from Amazon Web Services, This e-mail confirms that your latest billing statement, for the account ending",
    date: "2023-01-28T17:45:00",
  },
  {
    id: "2f0130cb-39fc-44c4-bb3c-0a4337edaaab",
    name: "Olivia Wilson",
    email: "oliviawilson@example.com",
    subject: "Vacation Plans",
    text: "Let's plan our vacation for next month. What do you think? I've been thinking of visiting a tropical paradise, and I've put together some destination options.\n\nI believe it's time for us to unwind and recharge. Please take a look at the options and let me know your preferences.\n\nWe can start making arrangements to ensure a smooth and enjoyable trip.\n\nExcited to hear your thoughts! Olivia",
    date: "2022-12-20T18:30:00",
  },
  {
    id: "de305d54-75b4-431b-adb2-eb6b9e546014",
    name: "James Martin",
    email: "jamesmartin@example.com",
    subject: "Re: Conference Registration",
    text: "I've completed the registration for the conference next month. The event promises to be a great networking opportunity, and I'm looking forward to attending the various sessions and connecting with industry experts.\n\nI've also attached the conference schedule for your reference.\n\nIf there are any specific topics or sessions you'd like me to explore, please let me know. It's an exciting event, and I'll make the most of it.\n\nBest regards, James",
    date: "2022-11-30T19:15:00",
  },
  {
    id: "7dd90c63-00f6-40f3-bd87-5060a24e8ee7",
    name: "Sophia White",
    email: "sophiawhite@example.com",
    subject: "Team Dinner",
    text: "Let's have a team dinner next week to celebrate our success. We've achieved some significant milestones, and it's time to acknowledge our hard work and dedication.\n\nI've made reservations at a lovely restaurant, and I'm sure it'll be an enjoyable evening.\n\nPlease confirm your availability and any dietary preferences. Looking forward to a fun and memorable dinner with the team!\n\nBest, Sophia",
    date: "2022-11-05T20:30:00",
  },
  {
    id: "99a88f78-3eb4-4d87-87b7-7b15a49a0a05",
    name: "Daniel Johnson",
    email: "danieljohnson@example.com",
    subject: "Feedback Request",
    text: "I'd like your feedback on the latest project deliverables. We've made significant progress, and I value your input to ensure we're on the right track.\n\nI've attached the deliverables for your review, and I'm particularly interested in any areas where you think we can further enhance the quality or efficiency.\n\nYour feedback is invaluable, and I appreciate your time and expertise. Let's work together to make this project a success.\n\nRegards, Daniel",
    date: "2022-10-22T09:30:00",
  },
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    name: "Ava Taylor",
    email: "avataylor@example.com",
    subject: "Re: Meeting Agenda",
    text: "Here's the agenda for our meeting next week. I've included all the topics we need to cover, as well as time allocations for each.\n\nIf you have any additional items to discuss or any specific points to address, please let me know, and we can integrate them into the agenda.\n\nIt's essential that our meeting is productive and addresses all relevant matters.\n\nLooking forward to our meeting! Ava",
    date: "2022-10-10T10:45:00",
  },
  {
    id: "c1a0ecb4-2540-49c5-86f8-21e5ce79e4e6",
    name: "William Anderson",
    email: "williamanderson@example.com",
    subject: "Product Launch Update",
    text: "The product launch is on track. I'll provide an update during our call. We've made substantial progress in the development and marketing of our new product.\n\nI'm excited to share the latest updates with you during our upcoming call. It's crucial that we coordinate our efforts to ensure a successful launch. Please come prepared with any questions or insights you may have.\n\nLet's make this product launch a resounding success!\n\nBest regards, William",
    date: "2022-09-20T12:00:00",
  },
  {
    id: "ba54eefd-4097-4949-99f2-2a9ae4d1a836",
    name: "Mia Harris",
    email: "miaharris@example.com",
    subject: "Re: Travel Itinerary",
    text: "I've received the travel itinerary. It looks great! Thank you for your prompt assistance in arranging the details. I've reviewed the schedule and the accommodations, and everything seems to be in order. I'm looking forward to the trip, and I'm confident it'll be a smooth and enjoyable experience.\n\nIf there are any specific activities or attractions you recommend at our destination, please feel free to share your suggestions.\n\nExcited for the trip! Mia",
    date: "2022-09-10T13:15:00",
  },
  {
    id: "df09b6ed-28bd-4e0c-85a9-9320ec5179aa",
    name: "Ethan Clark",
    email: "ethanclark@example.com",
    subject: "Team Building Event",
    text: "Let's plan a team-building event for our department. Team cohesion and morale are vital to our success, and I believe a well-organized team-building event can be incredibly beneficial. I've done some research and have a few ideas for fun and engaging activities.\n\nPlease let me know your thoughts and availability. We want this event to be both enjoyable and productive.\n\nTogether, we'll strengthen our team and boost our performance.\n\nRegards, Ethan",
    date: "2022-08-25T15:30:00",
  },
  {
    id: "d67c1842-7f8b-4b4b-9be1-1b3b1ab4611d",
    name: "Chloe Hall",
    email: "chloehall@example.com",
    subject: "Re: Budget Approval",
    text: "The budget has been approved. We can proceed with the project. I'm delighted to inform you that our budget proposal has received the green light from the finance department. This is a significant milestone, and it means we can move forward with the project as planned.\n\nI've attached the finalized budget for your reference. Let's ensure that we stay on track and deliver the project on time and within budget.\n\nIt's an exciting time for us! Chloe",
    date: "2022-08-10T16:45:00",
  },
  {
    id: "6c9a7f94-8329-4d70-95d3-51f68c186ae1",
    name: "Samuel Turner",
    email: "samuelturner@example.com",
    subject: "Weekend Hike",
    text: "Who's up for a weekend hike in the mountains? I've been craving some outdoor adventure, and a hike in the mountains sounds like the perfect escape. If you're up for the challenge, we can explore some scenic trails and enjoy the beauty of nature.\n\nI've done some research and have a few routes in mind.\n\nLet me know if you're interested, and we can plan the details.\n\nIt's sure to be a memorable experience! Samuel",
    date: "2022-07-28T17:30:00",
  },
];

export const metadata: Metadata = {
  title: "Inbox | Midday",
};

export default function InboxPage() {
  return (
    <div className="flex-col flex">
      <Inbox mails={mails} />
    </div>
  );
}
