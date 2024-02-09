import { updateEntriesAction } from "@/actions/project/update-entries-action";
import { useOptimisticAction } from "next-safe-action/hooks";
import { UpdateRecordForm } from "./forms/update-record.form";

export function TrackerEntriesList({ data }) {
  const { execute: updateEntries, optimisticData } = useOptimisticAction(
    updateEntriesAction,
    data,
    (state, payload) => {
      //   if (payload.read) {
      //     return items.map((item) => {
      //       if (item.id === payload.id) {
      //         return {
      //           ...item,
      //           read: true,
      //         };
      //       }
      //       return item;
      //     });
      //   }
      //   if (payload.trash) {
      //     return state.filter((item) => item.id !== payload.id);
      //   }
      //   return state;
      // },
      // {
    }
  );

  return optimisticData?.map((record) => (
    <UpdateRecordForm
      key={record.id}
      duration={record.duration}
      assignedId={record.assigned_id}
      onCreate={() => updateEntries({ type: "create" })}
      onDelete={(id) => updateEntries({ type: "delete", id })}
      onChange={(params) => updateEntries({ type: "update", ...params })}
    />
  ));
}
