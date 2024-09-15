import { Avatar, AvatarFallback, AvatarImage } from "../avatar";
import { Badge } from "../badge";
import { Button } from "../button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../hover-card";

interface DataHoverCardProps {
  triggerLabel: string;
  title: string;
  items: string[];
  avatarSrc?: string;
  avatarFallbackText?: string;
}

export const DataHoverCard: React.FC<DataHoverCardProps> = ({
  triggerLabel,
  title,
  items,
  avatarSrc,
  avatarFallbackText = 'Default',
}) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="link">{triggerLabel}</Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-80">
        <div className="flex justify-between space-x-4">
          <Avatar>
            <AvatarImage src={avatarSrc || 'default_avatar_url.png'} />
            <AvatarFallback>{avatarFallbackText}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2 p-2 space-y-1 border-l">
            <h4 className="text-xs font-semibold">{title}</h4>
            <div className="flex flex-wrap gap-2">
              {items.map((item, index) => (
                <Badge variant="outline" key={index}>
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
