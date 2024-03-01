import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";

export function InboxUpdates({ show, onRefresh }) {
  return (
    <motion.div
      className="absolute top-4 left-[50%] z-20 -ml-[50px]"
      animate={{ y: show ? 0 : -100 }}
      initial={{ y: -100 }}
    >
      <Button
        onClick={onRefresh}
        className="rounded-full border space-x-2 text-sm font-normal"
      >
        <Icons.Refresh />
        <span>Updates</span>
      </Button>
    </motion.div>
  );
}
