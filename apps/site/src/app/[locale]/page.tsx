import PostList from "@/components/PostList";

// import UserMenu from "@/components/UserMenu";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="flex justify-between py-6">
        <h1 className="text-xl font-bold">Home</h1>
        {/* <UserMenu session={session} /> */}
      </div>

      <div>
        <PostList />
      </div>
    </div>
  );
}
