import { memo } from "react";
import { WebSocketStatus } from "@hocuspocus/provider";

import { cn } from "../../../../lib/editor/utils";
import { getConnectionText } from "../../../../lib/editor/utils/getConnectionText";
import Tooltip from "../../editorAtom/tooltip";
import { EditorUser } from "../types";

export type EditorInfoProps = {
  characters: number;
  words: number;
  collabState: WebSocketStatus;
  users: EditorUser[];
};

export const EditorInfo = memo(
  ({ characters, collabState, users, words }: EditorInfoProps) => {
    return (
      <div className="flex items-center">
        <div className="mr-4 flex flex-col justify-center border-r border-neutral-200 pr-4 text-right dark:border-neutral-800">
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {words} {words === 1 ? "word" : "words"}
          </div>
          <div className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {characters} {characters === 1 ? "character" : "characters"}
          </div>
        </div>
        <div className="mr-2 flex items-center gap-2">
          <div
            className={cn("h-2 w-2 rounded-full", {
              "bg-yellow-500 dark:bg-yellow-400": collabState === "connecting",
              "bg-green-500 dark:bg-green-400": collabState === "connected",
              "bg-red-500 dark:bg-red-400": collabState === "disconnected",
            })}
          />
          <span className="max-w-[4rem] text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            {getConnectionText(collabState)}
          </span>
        </div>
        {collabState === "connected" && (
          <div className="flex flex-row items-center">
            <div className="relative ml-3 flex flex-row items-center">
              {users.map((user: EditorUser) => (
                <div key={user.clientId} className="-ml-3">
                  <Tooltip title={user.name}>
                    <img
                      className="h-8 w-8 rounded-full border border-white dark:border-black"
                      src={`https://api.dicebear.com/7.x/notionists-neutral/svg?seed=${
                        user.name
                      }&backgroundColor=${user.color.replace("#", "")}`}
                      alt="avatar"
                    />
                  </Tooltip>
                </div>
              ))}
              {users.length > 3 && (
                <div className="-ml-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white bg-[#FFA2A2] text-xs font-bold leading-none dark:border-black">
                    +{users.length - 3}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  },
);

EditorInfo.displayName = "EditorInfo";
