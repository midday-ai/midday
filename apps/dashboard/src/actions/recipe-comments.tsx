"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@kicks";
import { Badge } from "@kickstarted/ui/badge";
import { Button } from "@kickstarted/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@kickstarted/ui/card";
import { Textarea } from "@kickstarted/ui/textarea";
import { AccountCircle, Star, StarHalf } from "lucide-react";
import { useMemo, useState } from "react";

const MAX_COMMENT_LENGTH = 300;

type Comment = {
  id: number;
  text: string;
  rating: number;
  author: string;
  avatarUrl?: string;
};

export default function RecipeComments() {
  const exampleComments: Comment[] = [
    {
      id: 1,
      text: "This recipe is absolutely delicious! I made it for my family and they loved it. The flavors are perfectly balanced.",
      rating: 5,
      author: "Jane Doe",
      avatarUrl: "/placeholder-user.jpg",
    },
    {
      id: 2,
      text: "Good recipe, but I found it a bit too salty for my taste. I'll use less salt next time.",
      rating: 4,
      author: "John Smith",
    },
    {
      id: 3,
      text: "Quick and easy to make. Perfect for busy weeknights!",
      rating: 5,
      author: "Alice Johnson",
      avatarUrl: "/placeholder-user.jpg",
    },
  ];
  const [comments, setComments] = useState<Comment[]>(exampleComments);
  const [showForm, setShowForm] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const { averageRating, voteCount } = useMemo(() => {
    const count = comments.length;
    const avg =
      count > 0
        ? comments.reduce((acc, comment) => acc + comment.rating, 0) / count
        : 0;
    return { averageRating: avg, voteCount: count };
  }, [comments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim() && rating > 0) {
      const comment: Comment = {
        id: Date.now(),
        text: newComment.slice(0, MAX_COMMENT_LENGTH),
        rating,
        author: "Anonymous User", // You can replace this with actual user data
      };
      setComments([comment, ...comments]);
      setNewComment("");
      setRating(0);
      setShowForm(false);
    }
  };

  const renderStar = (index: number) => {
    const isFilled = index < Math.floor(rating);
    const isHalf =
      !isFilled && index === Math.floor(rating) && rating % 1 !== 0;

    if (isFilled) {
      return (
        <Star
          className="text-yellow-400"
          fill="currentColor"
          strokeWidth={0}
          size={24}
        />
      );
    }

    if (isHalf) {
      return (
        <div className="relative">
          <Star
            className="text-gray-400"
            fill="currentColor"
            strokeWidth={0}
            size={24}
          />
          <StarHalf
            className="text-yellow-400 absolute top-0"
            fill="currentColor"
            strokeWidth={0}
            size={24}
          />
        </div>
      );
    }

    return (
      <Star
        className="text-gray-400"
        fill="currentColor"
        strokeWidth={0}
        size={24}
      />
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Button onClick={() => setShowForm(!showForm)} className="mb-4">
        {showForm ? "Hide Comment Form" : "Add a Comment"}
      </Button>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Your Comment</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <Textarea
                placeholder="Write your comment here..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                className="mb-2"
              />
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={`star-${i}`}
                    type="button"
                    className={cn(
                      "transition-transform duration-200 ease-in-out",
                      "cursor-pointer hover:scale-125",
                    )}
                    onClick={() => setRating(i + 1)}
                    onMouseEnter={() => setHoveredRating(i + 1)}
                    onMouseLeave={() => setHoveredRating(null)}
                    aria-label={`Rate ${i + 1} star${i === 0 ? "" : "s"}`}
                  >
                    {renderStar(i)}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {MAX_COMMENT_LENGTH - newComment.length} characters remaining
              </p>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={newComment.trim() === "" || rating === 0}
              >
                Submit Comment
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {comments.map((comment) => (
          <Card key={comment.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                {comment.avatarUrl ? (
                  <Avatar className="w-6 h-6 ring-1 ring-gray-200 dark:ring-gray-800">
                    <AvatarImage
                      src={comment.avatarUrl}
                      alt={comment.author}
                      width={32}
                      height={32}
                    />
                    <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                ) : (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-6 h-6 rounded-full cursor-default"
                  >
                    <AccountCircle className="h-4 w-4" />
                  </Button>
                )}
                <CardTitle className="text-lg">{comment.author}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={`star-${i}`}>{renderStar(i)}</div>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{comment.text}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={`avg-star-${i}`}>{renderStar(i)}</div>
          ))}
          <div className="flex items-center gap-2 ml-2 text-sm text-muted-foreground">
            <span>
              ({voteCount} {voteCount === 1 ? "vote" : "votes"})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
