import { useCallback, useState } from "react";
import { Editor } from "@tiptap/core";
import { Node } from "@tiptap/pm/model";

export const useData = () => {
  const [currentNode, setCurrentNode] = useState<Node | null>(null);
  const [currentNodePos, setCurrentNodePos] = useState<number>(-1);

  const handleNodeChange = useCallback(
    (data: { node: Node | null; editor: Editor; pos: number }) => {
      if (data.node) {
        setCurrentNode(data.node);
      }

      setCurrentNodePos(data.pos);
    },
    [setCurrentNodePos, setCurrentNode],
  );

  return {
    currentNode,
    currentNodePos,
    setCurrentNode,
    setCurrentNodePos,
    handleNodeChange,
  };
};
